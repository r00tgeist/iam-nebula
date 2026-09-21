import { useCallback, useEffect, useState } from "react";
import { CheckCircle2, Lock } from "lucide-react";
import { config } from "./config";
import { STEPS, STORAGE_KEY, freshState, loadState, norm, prefersReducedMotion, saveState, timeStamp, useNoIndex, type QuestState } from "./lib";
import { CaptchaStep, KbaStep, LoginStep, PasswordExpiredStep, PatternStep } from "./steps/knowledge";
import { BiometricStep, FinalStep, HardwareKeyStep, OtpStep, PamStep, PushStep } from "./steps/factors";

const LAST = STEPS.length - 1;

function readKeyParam(): { found: boolean; debug: boolean } {
  const params = new URLSearchParams(window.location.search);
  const key = params.get("key");
  const debug = params.get("debug") === "1";
  if (key !== null) {
    params.delete("key");
    const qs = params.toString();
    window.history.replaceState(null, "", window.location.pathname + (qs ? `?${qs}` : ""));
  }
  return { found: key !== null && norm(key) === norm(config.hardwareKey.secret), debug };
}

export default function LizaQuest() {
  useNoIndex();
  const [boot] = useState(readKeyParam);
  const [state, setState] = useState<QuestState>(() => {
    const s = loadState();
    if (boot.found && !s.hwKeyScanned) {
      s.hwKeyScanned = true;
      s.audit = [...s.audit, `${timeStamp()} FIDO_KEY_PRESENTED via QR`].slice(-30);
      saveState(s);
    }
    return s;
  });
  const [granted, setGranted] = useState(false);

  // keep several tabs in sync (QR scan often opens a new tab)
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) setState(loadState());
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const update = useCallback((fn: (s: QuestState) => QuestState) => {
    setState((prev) => {
      const next = fn(prev);
      saveState(next);
      return next;
    });
  }, []);

  const log = useCallback(
    (line: string) => update((s) => ({ ...s, audit: [...s.audit, `${timeStamp()} ${line}`].slice(-30) })),
    [update],
  );

  const onPass = useCallback(
    (line?: string) => {
      if (line) log(line);
      const advance = () => update((s) => ({ ...s, step: Math.min(LAST, s.step + 1) }));
      if (prefersReducedMotion()) {
        advance();
        return;
      }
      setGranted(true);
      setTimeout(() => {
        setGranted(false);
        advance();
        window.scrollTo({ top: 0 });
      }, 1100);
    },
    [log, update],
  );

  const onFail = useCallback((line: string) => log(line), [log]);

  const reset = () => {
    if (!window.confirm("Выйти и начать вход заново?")) return;
    const s = freshState();
    saveState(s);
    setState(s);
  };

  const jump = (i: number) => update((s) => ({ ...s, step: i }));

  const step = STEPS[state.step]?.id ?? "login";
  const trust = Math.round((state.step / LAST) * 100);
  const isFinal = step === "final";
  const props = { onPass, onFail };

  return (
    <div className="relative min-h-[100dvh] px-4 pb-10 pt-[max(1.25rem,env(safe-area-inset-top))]">
      <style>{`@keyframes lzscan{0%{transform:translateY(0)}50%{transform:translateY(255px)}100%{transform:translateY(0)}}`}</style>

      <div className="mx-auto w-full max-w-md">
        {/* Header */}
        <header className="mb-5 flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/15 text-primary">
            <Lock size={16} />
          </span>
          <div className="min-w-0">
            <p className="truncate font-display text-sm font-bold text-foreground">{config.meta.orgName}</p>
            <p className="truncate font-mono text-[0.7rem] text-muted-foreground">{config.meta.tenant}</p>
          </div>
          {!isFinal && (
            <button onClick={reset} className="ml-auto shrink-0 text-xs text-muted-foreground underline-offset-4 hover:text-foreground hover:underline">
              Выйти
            </button>
          )}
        </header>

        {/* Trust level */}
        <div className="mb-5">
          <div className="mb-1.5 flex items-baseline justify-between text-xs">
            <span className="text-muted-foreground">
              {isFinal ? "Аутентификация завершена" : `Шаг ${state.step + 1} из ${LAST}: ${STEPS[state.step].label}`}
            </span>
            <span className="font-mono text-primary">доверие {trust}%</span>
          </div>
          <div
            className="h-1.5 overflow-hidden rounded-full bg-muted"
            role="progressbar"
            aria-valuenow={trust}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Уровень доверия"
          >
            <div
              className="h-full rounded-full bg-gradient-to-r from-primary to-secondary transition-[width] duration-700 ease-out"
              style={{ width: `${trust}%` }}
            />
          </div>
        </div>

        {/* Card */}
        <main className="glass-card relative overflow-hidden p-5 sm:p-7">
          {granted && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-card/95" role="status">
              <CheckCircle2 size={44} className="text-primary" />
              <p className="mt-3 font-mono text-sm font-medium tracking-wide text-primary">ACCESS GRANTED</p>
              <p className="mt-1 text-sm text-muted-foreground">Фактор подтверждён</p>
            </div>
          )}
          <div key={step}>
            {step === "login" && <LoginStep {...props} />}
            {step === "passwordExpired" && <PasswordExpiredStep {...props} />}
            {step === "kba" && <KbaStep {...props} />}
            {step === "captcha" && <CaptchaStep {...props} />}
            {step === "pattern" && <PatternStep {...props} />}
            {step === "otp" && <OtpStep {...props} />}
            {step === "hardwareKey" && <HardwareKeyStep {...props} scanned={state.hwKeyScanned} />}
            {step === "push" && <PushStep {...props} number={state.pushNumber} />}
            {step === "biometric" && <BiometricStep {...props} />}
            {step === "pam" && <PamStep {...props} />}
            {step === "final" && <FinalStep />}
          </div>
        </main>

        {/* Early QR scan notice */}
        {state.hwKeyScanned && state.step < STEPS.findIndex((s) => s.id === "hardwareKey") && (
          <p className="mt-3 text-center text-xs text-muted-foreground">
            Аппаратный ключ уже зарегистрирован. Он понадобится позже.
          </p>
        )}

        {/* Audit log */}
        {state.audit.length > 0 && !isFinal && (
          <section className="mt-5" aria-label="Журнал аудита">
            <p className="mb-1.5 text-xs text-muted-foreground">Журнал аудита</p>
            <div className="rounded-lg border border-border bg-background/50 p-3 font-mono text-[0.68rem] leading-relaxed text-muted-foreground">
              {state.audit.slice(-4).map((l, i) => (
                <div key={i} className={l.includes("FAIL") || l.includes("DENIED") ? "text-destructive/80" : undefined}>
                  {l}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Debug */}
        {boot.debug && (
          <section className="mt-8 rounded-lg border border-dashed border-secondary/50 p-3 text-xs">
            <p className="mb-2 font-mono text-secondary">debug</p>
            <div className="flex flex-wrap gap-1.5">
              {STEPS.map((s, i) => (
                <button
                  key={s.id}
                  onClick={() => jump(i)}
                  className={`rounded border px-2 py-1 ${i === state.step ? "border-primary text-primary" : "border-border text-muted-foreground"}`}
                >
                  {i + 1}. {s.label}
                </button>
              ))}
            </div>
            <div className="mt-2 flex flex-wrap gap-3">
              <button className="text-muted-foreground underline" onClick={() => update((s) => ({ ...s, hwKeyScanned: !s.hwKeyScanned }))}>
                ключ отсканирован: {String(state.hwKeyScanned)}
              </button>
              <button
                className="text-destructive underline"
                onClick={() => {
                  const s = freshState();
                  saveState(s);
                  setState(s);
                }}
              >
                сбросить всё
              </button>
              <a className="text-muted-foreground underline" href="/liza/print">
                страница печати
              </a>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
