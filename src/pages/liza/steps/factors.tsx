import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Bell, Camera, CheckCircle2, Fingerprint, KeyRound, ShieldCheck, Usb } from "lucide-react";
import { cn } from "@/lib/utils";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { config } from "../config";
import { matches, norm, prefersReducedMotion } from "../lib";
import { ErrorNote, Field, HintNote, PrimaryButton, StepHeader, type StepProps } from "../ui";
import { playPhonk } from "../fx";

/* ------------------------------------------------------------------ 6. OTP */
export function OtpStep({ onPass, onFail }: StepProps) {
  const c = config.otp;
  const [val, setVal] = useState("");
  const [err, setErr] = useState("");

  const check = (v: string) => {
    if (v === c.code) onPass("OTP_OK factor=possession");
    else {
      setErr("Код не подошёл. Проверь цифры на карточке.");
      onFail("OTP_FAIL");
      setTimeout(() => setVal(""), 400);
    }
  };

  return (
    <div>
      <StepHeader title={c.title} subtitle={c.subtitle} />
      <HintNote>{c.hint}</HintNote>
      <div className="mt-6 flex justify-center">
        <InputOTP
          maxLength={6}
          value={val}
          onChange={(v) => {
            setErr("");
            setVal(v.replace(/\D/g, ""));
          }}
          onComplete={check}
          inputMode="numeric"
          pattern="^[0-9]*$"
          autoFocus
        >
          <InputOTPGroup className="gap-1.5 sm:gap-2">
            {Array.from({ length: 6 }, (_, i) => (
              <InputOTPSlot
                key={i}
                index={i}
                className="h-12 w-11 rounded-lg border border-input bg-background/60 font-mono text-xl first:rounded-lg last:rounded-lg sm:h-14 sm:w-12"
              />
            ))}
          </InputOTPGroup>
        </InputOTP>
      </div>
      <ErrorNote>{err}</ErrorNote>
    </div>
  );
}

/* --------------------------------------------------------- 7. Hardware key */
export function HardwareKeyStep({ onPass, onFail, scanned }: StepProps & { scanned: boolean }) {
  const c = config.hardwareKey;
  const [manual, setManual] = useState(false);
  const [serial, setSerial] = useState("");
  const [err, setErr] = useState("");
  const passed = useRef(false);

  useEffect(() => {
    if (scanned && !passed.current) {
      passed.current = true;
      const t = setTimeout(() => onPass("FIDO_KEY_OK factor=possession method=qr"), 900);
      return () => clearTimeout(t);
    }
  }, [scanned, onPass]);

  return (
    <div>
      <StepHeader title={c.title} subtitle={c.subtitle} />
      <div className="flex flex-col items-center py-4">
        <div
          className={cn(
            "flex h-24 w-24 items-center justify-center rounded-2xl border",
            scanned ? "border-primary bg-primary/15 text-primary" : "border-border bg-muted/40 text-muted-foreground",
          )}
        >
          {scanned ? <CheckCircle2 size={40} /> : <Usb size={40} className="motion-safe:animate-pulse" />}
        </div>
        <p className="mt-3 text-sm text-muted-foreground" aria-live="polite">
          {scanned ? "Ключ распознан" : "Ожидание ключа…"}
        </p>
      </div>
      <HintNote>{c.hint}</HintNote>

      {!scanned &&
        (manual ? (
          <form
            className="mt-5"
            onSubmit={(e) => {
              e.preventDefault();
              if (norm(serial).replace(/\s/g, "") === norm(c.secret)) {
                passed.current = true;
                onPass("FIDO_KEY_OK factor=possession method=serial");
              } else {
                setErr("Серийный номер не совпадает.");
                onFail("FIDO_KEY_FAIL method=serial");
              }
            }}
          >
            <Field id="lz-serial" label="Серийный номер ключа (напечатан под QR)" value={serial} onChange={(e) => setSerial(e.target.value)} />
            <ErrorNote>{err}</ErrorNote>
            <PrimaryButton type="submit" className="mt-4">
              Проверить ключ
            </PrimaryButton>
          </form>
        ) : (
          <button
            type="button"
            onClick={() => setManual(true)}
            className="mt-4 w-full text-center text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground"
          >
            QR не сканируется? Ввести серийный номер
          </button>
        ))}
    </div>
  );
}

/* ---------------------------------------------------------------- 8. Push */
export function PushStep({ onPass, onFail, number }: StepProps & { number: number }) {
  const c = config.push;
  const [code, setCode] = useState("");
  const [err, setErr] = useState("");

  return (
    <form
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        if (matches(code, c.approvalCodes)) onPass(`PUSH_APPROVED approver="${config.meta.adminName}" number_match=${number}`);
        else {
          setErr("Код подтверждения неверный. Администратор точно его сказал?");
          onFail("PUSH_DENIED bad_approval_code");
        }
      }}
    >
      <StepHeader title={c.title} subtitle={c.subtitle} />
      <div className="rounded-xl border border-border bg-background/70 p-4">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Bell size={14} className="text-primary" />
          <span>{config.meta.orgName}</span>
          <span className="ml-auto">сейчас</span>
        </div>
        <p className="mt-2 text-sm text-foreground">Кто-то пытается войти в аккаунт «лизон». Это вы?</p>
        <div className="mt-4 flex flex-col items-center">
          <span className="text-xs text-muted-foreground">Число для подтверждения</span>
          <span className="font-display text-6xl font-extrabold tracking-tight text-gradient-primary">{number}</span>
        </div>
      </div>
      <div className="mt-4">
        <HintNote>{c.instruction}</HintNote>
      </div>
      <div className="mt-5">
        <Field id="lz-approval" label="Код подтверждения" value={code} onChange={(e) => setCode(e.target.value)} />
      </div>
      <ErrorNote>{err}</ErrorNote>
      <PrimaryButton type="submit" className="mt-5">
        Подтвердить вход
      </PrimaryButton>
    </form>
  );
}

/* ------------------------------------------------------------ 9. Biometric */
const HOLD_MS = 3000;

export function BiometricStep({ onPass }: StepProps) {
  const c = config.biometric;
  const [phase, setPhase] = useState<"finger" | "face">("finger");
  return phase === "finger" ? (
    <FingerprintPart onDone={() => setPhase("face")} title={c.title} text={c.fingerprintText} />
  ) : (
    <FacePart onDone={(cam) => onPass(`BIOMETRIC_OK fingerprint=match face=${cam ? "match" : "skipped"}`)} />
  );
}

function FingerprintPart({ onDone, title, text }: { onDone: () => void; title: string; text: string }) {
  const [progress, setProgress] = useState(0);
  const [done, setDone] = useState(false);
  const raf = useRef<number>();
  const start = useRef(0);

  const tick = () => {
    const p = Math.min(1, (performance.now() - start.current) / HOLD_MS);
    setProgress(p);
    if (p >= 1) {
      setDone(true);
      setTimeout(onDone, 900);
      return;
    }
    raf.current = requestAnimationFrame(tick);
  };

  const begin = () => {
    if (done) return;
    start.current = performance.now();
    raf.current = requestAnimationFrame(tick);
  };
  const cancel = () => {
    if (done) return;
    if (raf.current) cancelAnimationFrame(raf.current);
    setProgress(0);
  };
  useEffect(() => () => raf.current && cancelAnimationFrame(raf.current), []);

  const R = 58;
  const C = 2 * Math.PI * R;

  return (
    <div>
      <StepHeader title={title} subtitle="Шаг 1 из 2: отпечаток пальца" />
      <div className="flex flex-col items-center py-2">
        <button
          type="button"
          aria-label="Удерживайте для сканирования отпечатка"
          onPointerDown={begin}
          onPointerUp={cancel}
          onPointerLeave={cancel}
          onPointerCancel={cancel}
          onContextMenu={(e) => e.preventDefault()}
          onKeyDown={(e) => (e.key === " " || e.key === "Enter") && !e.repeat && begin()}
          onKeyUp={cancel}
          className="relative h-40 w-40 touch-none select-none rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          style={{ WebkitTouchCallout: "none" }}
        >
          <svg viewBox="0 0 140 140" className="absolute inset-0 h-full w-full -rotate-90">
            <circle cx="70" cy="70" r={R} fill="none" stroke="hsl(var(--muted))" strokeWidth="6" />
            <circle
              cx="70"
              cy="70"
              r={R}
              fill="none"
              stroke="hsl(var(--primary))"
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={C}
              strokeDashoffset={C * (1 - progress)}
            />
          </svg>
          <Fingerprint
            size={64}
            strokeWidth={1.4}
            className={cn("absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2", progress > 0 ? "text-primary" : "text-muted-foreground")}
          />
        </button>
        <p className="mt-4 text-sm text-muted-foreground" aria-live="polite">
          {done ? "Совпадение 99.9%" : progress > 0 ? `Сканирование… ${Math.round(progress * 100)}%` : text}
        </p>
      </div>
    </div>
  );
}

function FacePart({ onDone }: { onDone: (camera: boolean) => void }) {
  const c = config.biometric;
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [state, setState] = useState<"idle" | "scanning" | "done" | "denied">("idle");
  const [shot, setShot] = useState<string>("");

  const stop = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  };
  useEffect(() => stop, []);

  const startCam = async () => {
    try {
      const s = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" }, audio: false });
      streamRef.current = s;
      setState("scanning");
      requestAnimationFrame(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = s;
          videoRef.current.play().catch(() => {});
        }
      });
      setTimeout(() => {
        const v = videoRef.current;
        if (v && v.videoWidth) {
          const canvas = document.createElement("canvas");
          canvas.width = v.videoWidth;
          canvas.height = v.videoHeight;
          const ctx = canvas.getContext("2d")!;
          ctx.translate(canvas.width, 0);
          ctx.scale(-1, 1);
          ctx.drawImage(v, 0, 0);
          setShot(canvas.toDataURL("image/jpeg", 0.85));
        }
        stop();
        setState("done");
      }, 3200);
    } catch {
      setState("denied");
    }
  };

  return (
    <div>
      <StepHeader title={c.title} subtitle="Шаг 2 из 2: распознавание лица" />
      <div className="relative mx-auto aspect-square w-full max-w-[260px] overflow-hidden rounded-full border-2 border-primary/40 bg-muted/40">
        {state === "scanning" && (
          <>
            <video ref={videoRef} playsInline muted className="h-full w-full -scale-x-100 object-cover" />
            {!prefersReducedMotion() && (
              <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-primary shadow-[0_0_20px_hsl(var(--primary))] animate-[lzscan_1.6s_ease-in-out_infinite]" />
            )}
          </>
        )}
        {state === "done" && shot && <img src={shot} alt="Снимок для проверки" className="h-full w-full object-cover" />}
        {(state === "idle" || state === "denied" || (state === "done" && !shot)) && (
          <div className="flex h-full w-full items-center justify-center text-muted-foreground">
            {state === "done" ? <ShieldCheck size={56} className="text-primary" /> : <Camera size={48} strokeWidth={1.4} />}
          </div>
        )}
      </div>
      <p className="mt-4 text-center text-sm text-muted-foreground" aria-live="polite">
        {state === "idle" && "Снимок остаётся только на твоём телефоне и никуда не отправляется."}
        {state === "scanning" && c.faceText}
        {state === "done" && `Лицо распознано: ${c.recognizedAs}. Совпадение 100%.`}
        {state === "denied" && "Камера недоступна. Ничего страшного."}
      </p>
      <div className="mt-5 space-y-2">
        {state === "idle" && <PrimaryButton onClick={startCam}>Включить камеру</PrimaryButton>}
        {state === "done" && <PrimaryButton onClick={() => onDone(true)}>Продолжить</PrimaryButton>}
        {(state === "idle" || state === "denied") && (
          <button
            type="button"
            onClick={() => onDone(false)}
            className="w-full py-2 text-center text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground"
          >
            Пройти без камеры
          </button>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ 10. PAM */
export function PamStep({ onPass }: StepProps) {
  const c = config.pam;
  const lines = [
    `Запрос создан: доступ к ресурсу «${c.resource}»`,
    `Обоснование: ${c.reason}`,
    `Согласующий уведомлён: ${config.meta.adminName}`,
    c.secondApprover,
    "Проверка политики доступа: день рождения = true",
    "Проверка риска: низкий",
    `Одобрено. Сессия выдана на ${c.duration}`,
  ];
  const [shown, setShown] = useState(prefersReducedMotion() ? lines.length : 0);

  useEffect(() => {
    if (shown >= lines.length) return;
    const t = setTimeout(() => setShown((s) => s + 1), shown === 2 || shown === 3 ? 1500 : 800);
    return () => clearTimeout(t);
  }, [shown, lines.length]);

  const complete = shown >= lines.length;

  return (
    <div>
      <StepHeader title={c.title} subtitle="Just-in-time доступ с согласованием" />
      <ol className="space-y-3">
        {lines.slice(0, shown).map((l, i) => (
          <motion.li
            key={i}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
            className="flex items-start gap-3 text-sm"
          >
            <KeyRound size={16} className={cn("mt-0.5 shrink-0", i === lines.length - 1 ? "text-primary" : "text-secondary")} />
            <span className={i === lines.length - 1 ? "font-semibold text-foreground" : "text-foreground/85"}>
              {l}
              {l === c.secondApprover && (
                <motion.span
                  className="ml-2 inline-flex -rotate-12 items-center gap-1 rounded border-2 border-primary px-1.5 py-0.5 align-middle font-mono text-[0.65rem] font-bold tracking-widest text-primary"
                  initial={{ scale: 2.6, opacity: 0, rotate: -30 }}
                  animate={{ scale: 1, opacity: 1, rotate: -12 }}
                  transition={{ delay: 0.7, type: "spring", stiffness: 500, damping: 18 }}
                  aria-hidden
                >
                  🐾 APPROVED
                </motion.span>
              )}
            </span>
          </motion.li>
        ))}
        {!complete && <li className="pl-7 text-sm text-muted-foreground motion-safe:animate-pulse">Обработка…</li>}
      </ol>
      <PrimaryButton className="mt-7" disabled={!complete} onClick={() => onPass("PAM_SESSION_START jit=true")}>
        Открыть сессию
      </PrimaryButton>
    </div>
  );
}

/* ---------------------------------------------------------------- 11. Final */
const PARTICLES = Array.from({ length: 18 }, (_, i) => {
  const a = (i / 18) * Math.PI * 2;
  const d = 90 + (i % 3) * 30;
  return { x: Math.cos(a) * d, y: Math.sin(a) * d - 20, e: ["✨", "💃", "🎁", "💜", "⭐", "🕺"][i % 6] };
});

export function FinalStep() {
  const c = config.final;
  const [open, setOpen] = useState(false);
  const [shaking, setShaking] = useState(false);
  const [sound, setSound] = useState(true);
  const [flash, setFlash] = useState(false);

  const unlock = () => {
    if (open || shaking) return;
    if (sound) playPhonk();
    setShaking(true);
    setTimeout(() => setFlash(true), prefersReducedMotion() ? 0 : 860);
    setTimeout(() => setFlash(false), prefersReducedMotion() ? 0 : 1150);
    setTimeout(() => {
      setShaking(false);
      setOpen(true);
    }, prefersReducedMotion() ? 0 : 900);
  };

  return (
    <div className="text-center">
      <AnimatePresence>
        {flash && (
          <motion.div
            className="pointer-events-none fixed inset-0 z-[70] bg-white"
            initial={{ opacity: 0.95 }}
            animate={{ opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.45 }}
            aria-hidden
          />
        )}
      </AnimatePresence>
      <motion.div
        initial={{ scale: 0, rotate: -30 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: "spring", stiffness: 260, damping: 16 }}
        className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-primary/15 text-primary glow-cyan"
      >
        <ShieldCheck size={32} />
      </motion.div>
      <motion.h1
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="font-display text-3xl font-extrabold leading-tight text-gradient-primary"
      >
        {c.title}
      </motion.h1>
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5, duration: 0.6 }}
        className="mx-auto mt-4 max-w-[34ch] whitespace-pre-line text-base leading-relaxed text-foreground/90"
      >
        {c.text}
      </motion.p>

      {/* Mystery box */}
      <div className="relative mx-auto mt-10 flex h-56 w-full items-center justify-center">
        <AnimatePresence>
          {open &&
            PARTICLES.map((p, i) => (
              <motion.span
                key={i}
                className="pointer-events-none absolute left-1/2 top-1/2 text-xl"
                initial={{ x: "-50%", y: "-50%", opacity: 1, scale: 0.4 }}
                animate={{ x: `calc(-50% + ${p.x}px)`, y: `calc(-50% + ${p.y}px)`, opacity: 0, scale: 1.2 }}
                transition={{ duration: 1.4, ease: "easeOut", delay: i * 0.015 }}
                aria-hidden
              >
                {p.e}
              </motion.span>
            ))}
        </AnimatePresence>

        <motion.button
          type="button"
          onClick={unlock}
          aria-label={open ? "Бокс открыт" : c.boxLabel}
          className="relative h-40 w-40 focus-visible:outline-none"
          initial={{ opacity: 0, y: 30 }}
          animate={
            shaking
              ? { opacity: 1, y: 0, rotate: [0, -8, 8, -10, 10, -6, 6, 0], scale: [1, 1.05, 1.05, 1.08, 1.08, 1.1, 1.1, 1] }
              : open
                ? { opacity: 1, y: 0 }
                : { opacity: 1, y: [0, -8, 0] }
          }
          transition={
            shaking
              ? { duration: 0.9 }
              : open
                ? { duration: 0.3 }
                : { opacity: { delay: 0.9 }, y: { delay: 0.9, duration: 2.4, repeat: Infinity, ease: "easeInOut" } }
          }
        >
          {/* glow */}
          <motion.span
            className="absolute inset-x-4 bottom-2 h-6 rounded-full bg-primary/40 blur-xl"
            animate={{ opacity: open ? 0.9 : [0.3, 0.6, 0.3] }}
            transition={open ? { duration: 0.4 } : { duration: 2.4, repeat: Infinity }}
          />
          {/* base */}
          <span className="absolute bottom-3 left-1/2 h-24 w-32 -translate-x-1/2 rounded-md bg-gradient-to-b from-secondary to-secondary/70 shadow-lg">
            <span className="absolute inset-y-0 left-1/2 w-4 -translate-x-1/2 bg-primary/90" />
            <span className="absolute inset-0 flex items-center justify-center font-display text-4xl font-extrabold text-white/90">?</span>
          </span>
          {/* lid */}
          <motion.span
            className="absolute left-1/2 top-[34px] h-8 w-36 rounded-md bg-gradient-to-b from-secondary to-secondary/80 shadow-md"
            style={{ x: "-50%", originX: 0.1, originY: 1 }}
            animate={open ? { y: -34, x: "-30%", rotate: -32, opacity: 0.95 } : { y: 0, rotate: 0 }}
            transition={{ type: "spring", stiffness: 180, damping: 12 }}
          >
            <span className="absolute inset-y-0 left-1/2 w-4 -translate-x-1/2 bg-primary/90" />
            <span className="absolute -top-5 left-1/2 flex -translate-x-1/2 gap-1">
              <span className="h-5 w-7 -rotate-12 rounded-full border-4 border-primary" />
              <span className="h-5 w-7 rotate-12 rounded-full border-4 border-primary" />
            </span>
          </motion.span>
        </motion.button>
      </div>

      <AnimatePresence mode="wait">
        {!open ? (
          <motion.div key="hint" exit={{ opacity: 0 }}>
            <p className="font-mono text-xs uppercase tracking-widest text-primary motion-safe:animate-pulse">
              {shaking ? "расшифровка…" : c.boxLabel}
            </p>
            {!shaking && (
              <button
                type="button"
                onClick={() => setSound((v) => !v)}
                className="mt-3 text-xs text-muted-foreground underline-offset-4 hover:underline"
                aria-pressed={sound}
              >
                {sound ? "🔊 со звуком" : "🔇 без звука"}
              </button>
            )}
          </motion.div>
        ) : (
          <motion.div key="reveal" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
            <motion.p
              className="font-display text-2xl font-extrabold text-foreground"
              initial={{ scale: 1.6 }}
              animate={{
                scale: 1,
                textShadow: [
                  "3px 0 0 rgba(255,0,80,.9), -3px 0 0 rgba(0,229,255,.9)",
                  "-2px 1px 0 rgba(255,0,80,.9), 2px -1px 0 rgba(0,229,255,.9)",
                  "1px 0 0 rgba(255,0,80,.6), -1px 0 0 rgba(0,229,255,.6)",
                  "0 0 0 rgba(0,0,0,0), 0 0 0 rgba(0,0,0,0)",
                ],
              }}
              transition={{ duration: 0.7, ease: "easeOut" }}
            >
              {c.revealTitle}
            </motion.p>
            <p className="mx-auto mt-3 max-w-[32ch] whitespace-pre-line text-base leading-relaxed text-foreground/90">{c.revealText}</p>
            <p className="mt-8 font-mono text-sm text-muted-foreground">{c.signature}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
