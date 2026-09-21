import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, MotionConfig, motion, useAnimationControls } from "framer-motion";
import { Car, Lock } from "lucide-react";
import { CyberBackdrop, HeadshotSnap, HexTicker, Hitmarkers, HudCorners, Killfeed, SkeetWatermark } from "./fx";
import { CYBER_CSS, SKEET_CSS, hex, useKillfeed } from "./fx-core";
import { config } from "./config";
import { STEPS, STORAGE_KEY, freshState, loadState, norm, prefersReducedMotion, saveState, timeStamp, useNoIndex, useSafeTimeout, type QuestState } from "./lib";
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
  const shake = useAnimationControls();
  const feed = useKillfeed();
  const stepRef = useRef(state.step);
  stepRef.current = state.step;
  const advancing = useRef(false);
  const later = useSafeTimeout();
  const cardRef = useRef<HTMLElement>(null);

  // warm the cache for the captcha photos so the grid never pops in
  useEffect(() => {
    config.captcha.rounds.forEach((r) => {
      const img = new Image();
      img.src = r.image;
    });
  }, []);
  const [booting, setBooting] = useState(() => state.step === 0 && !boot.debug);

  useEffect(() => {
    if (!booting) return;
    const t = setTimeout(() => setBooting(false), prefersReducedMotion() ? 0 : 2600);
    return () => clearTimeout(t);
  }, [booting]);

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
      if (advancing.current) return; // ignore double submits while the success beat plays
      advancing.current = true;
      if (line) log(line);
      feed.push({ kind: "kill", victim: STEPS[stepRef.current]?.label.toLowerCase() });
      const advance = () =>
        update((s) => {
          const step = Math.min(LAST, s.step + 1);
          return { ...s, step, finishedAt: step === LAST ? s.finishedAt ?? Date.now() : s.finishedAt };
        });
      if (prefersReducedMotion()) {
        advance();
        advancing.current = false;
        return;
      }
      setGranted(true);
      later(() => {
        setGranted(false);
        advance();
        advancing.current = false;
        window.scrollTo({ top: 0 });
      }, 850);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [log, update, later],
  );

  const onFail = useCallback(
    (line: string) => {
      log(line);
      update((s) => ({ ...s, misses: s.misses + 1 }));
      feed.push({ kind: "miss" });
      shake.start({ x: [0, -10, 10, -7, 7, -3, 0], transition: { duration: 0.45 } });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [log, shake],
  );

  const reset = () => {
    if (!window.confirm("Выйти и начать вход заново?")) return;
    const s = freshState();
    saveState(s);
    setState(s);
  };

  const jump = (i: number) => {
    advancing.current = false;
    update((s) => ({ ...s, step: i }));
  };

  const step = STEPS[state.step]?.id ?? "login";

  useEffect(() => {
    const t = window.setTimeout(() => {
      const card = cardRef.current;
      if (!card || card.contains(document.activeElement)) return;
      const h = card.querySelector<HTMLElement>("h1");
      if (h) {
        h.tabIndex = -1;
        h.focus({ preventScroll: true });
      }
    }, 350);
    return () => clearTimeout(t);
  }, [step]);
  const trust = Math.round((state.step / LAST) * 100);
  const isFinal = step === "final";
  const props = { onPass, onFail };

  if (booting) return <BootSplash />;

  return (
    <MotionConfig reducedMotion="user">
    <div style={{ ["--muted-foreground" as string]: "240 10% 62%" }} className="relative min-h-[100dvh] px-4 pb-16 pt-[max(1.25rem,env(safe-area-inset-top))]">
      <style>{SKEET_CSS + CYBER_CSS}</style>
      <CyberBackdrop />
      <Hitmarkers />
      <Killfeed entries={feed.entries} />
      <SkeetWatermark user="lizon" />
      <style>{`@keyframes lzscan{0%{transform:translateY(0)}50%{transform:translateY(255px)}100%{transform:translateY(0)}}`}</style>

      <main className="relative z-10 mx-auto w-full max-w-md">
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
          <div className="relative h-5" aria-hidden>
            <motion.div
              className="absolute bottom-0.5 text-primary"
              initial={false}
              animate={{
                left: `calc(${trust}% - ${trust === 100 ? 18 : trust * 0.18}px)`,
                rotate: trust === 100 ? [0, -14, 10, 0] : 0,
              }}
              transition={{
                left: { type: "spring", stiffness: 60, damping: 14 },
                rotate: { duration: 0.6, delay: 0.5 },
              }}
            >
              <Car size={18} strokeWidth={1.8} />
            </motion.div>
          </div>
          <div
            className="h-1.5 overflow-hidden rounded-full bg-muted"
            role="progressbar"
            aria-valuenow={trust}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Уровень доверия"
          >
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-primary to-secondary shadow-[0_0_12px_hsl(var(--primary)/0.6)]"
              initial={false}
              animate={{ width: `${trust}%` }}
              transition={{ type: "spring", stiffness: 60, damping: 14 }}
            />
          </div>
        </div>

        <HexTicker />

        {/* Card */}
        <motion.section ref={cardRef} aria-live="polite" animate={shake} className="glass-card relative overflow-hidden p-5 outline-none sm:p-7 [&_h1:focus]:outline-none">
          <div className="skeet-bar absolute inset-x-0 top-0 h-[2px] opacity-80" aria-hidden />
          <HudCorners />
          <AnimatePresence>
            {granted && (
              <motion.div
                className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-card/95"
                role="status"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <HeadshotSnap />
              </motion.div>
            )}
          </AnimatePresence>
          <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.28, ease: "easeOut" }}
          >
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
            {step === "final" && <FinalStep stats={{ kills: LAST, misses: state.misses, ms: (state.finishedAt ?? Date.now()) - state.startedAt }} />}
          </motion.div>
          </AnimatePresence>
        </motion.section>

        {/* QR scanned with the phone camera into a different tab / browser */}
        {boot.found && state.step < STEPS.findIndex((s) => s.id === "hardwareKey") && (
          <div className="mt-4 rounded-lg border border-primary/30 bg-primary/10 p-3 text-center text-sm text-foreground">
            Ключ зарегистрирован 🔑
            <br />
            <span className="text-muted-foreground">
              Если квест открыт в другой вкладке или приложении — вернись туда и нажми «Приложить ключ».
            </span>
          </div>
        )}

        {/* Audit log */}
        {state.audit.length > 0 && !isFinal && (
          <section className="mt-5" aria-label="Журнал аудита">
            <p className="mb-1.5 text-xs text-muted-foreground">Журнал аудита</p>
            <div className="rounded-lg border border-border bg-background/50 p-3 font-mono text-[0.68rem] leading-relaxed text-muted-foreground">
              <AnimatePresence initial={false}>
                {state.audit.slice(-4).map((l, i, arr) => (
                  <motion.div
                    key={`${state.audit.length - arr.length + i}-${l}`}
                    layout
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0 }}
                    className={l.includes("FAIL") || l.includes("DENIED") ? "text-destructive/80" : undefined}
                  >
                    {l}
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </section>
        )}

        {/* Debug */}
        {boot.debug && (
          <section aria-label="debug" className="mt-8 rounded-lg border border-dashed border-secondary/50 p-3 text-xs">
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
      </main>
    </div>
    </MotionConfig>
  );
}

const BOOT_LINES = [
  `[+] attaching to process lizon.exe (pid ${1337})`,
  `[+] resolving tenant ${config.meta.tenant}`,
  `[+] tls 1.3 · x25519 · aes-256-gcm`,
  `[+] 0x${hex(8)} → loading identity policies`,
  `[+] injecting birthday.dll … ok`,
  `[+] subject: lizon · trust: 0%`,
];

function BootSplash() {
  return (
    <div className="relative flex min-h-[100dvh] items-center justify-center px-6">
      <style>{CYBER_CSS}</style>
      <CyberBackdrop />
      <div className="relative z-10 w-full max-w-xs font-mono text-[0.7rem] leading-relaxed text-muted-foreground">
        {BOOT_LINES.map((l, i) => (
          <motion.div key={i} initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 + i * 0.33 }}>
            <span className={i === BOOT_LINES.length - 2 ? "text-primary" : undefined}>{l}</span>
          </motion.div>
        ))}
        <div className="mt-4 h-[3px] overflow-hidden rounded-full bg-muted">
          <motion.div
            className="skeet-bar h-full"
            initial={{ width: "0%" }}
            animate={{ width: "100%" }}
            transition={{ duration: 2.3, ease: "easeInOut" }}
          />
        </div>
        <style>{SKEET_CSS}</style>
      </div>
    </div>
  );
}
