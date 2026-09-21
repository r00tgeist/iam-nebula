import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { prefersReducedMotion } from "./lib";

/* ------------------------------------------------------------------ Hitmarkers */
type Hit = { id: number; x: number; y: number };

/** CS-style hitmarker on every tap/click anywhere on the page. */
export function Hitmarkers() {
  const [hits, setHits] = useState<Hit[]>([]);
  const id = useRef(0);

  useEffect(() => {
    if (prefersReducedMotion()) return;
    const onDown = (e: PointerEvent) => {
      const h = { id: ++id.current, x: e.clientX, y: e.clientY };
      setHits((prev) => [...prev.slice(-6), h]);
      setTimeout(() => setHits((prev) => prev.filter((p) => p.id !== h.id)), 380);
    };
    window.addEventListener("pointerdown", onDown, { passive: true });
    return () => window.removeEventListener("pointerdown", onDown);
  }, []);

  return (
    <div className="pointer-events-none fixed inset-0 z-[60]" aria-hidden>
      {hits.map((h) => (
        <motion.svg
          key={h.id}
          width="22"
          height="22"
          viewBox="0 0 22 22"
          className="absolute"
          style={{ left: h.x - 11, top: h.y - 11 }}
          initial={{ opacity: 1, scale: 0.6 }}
          animate={{ opacity: 0, scale: 1.15 }}
          transition={{ duration: 0.36, ease: "easeOut" }}
        >
          <g stroke="white" strokeWidth="2.2" strokeLinecap="square" style={{ filter: "drop-shadow(0 0 1px rgba(0,0,0,.8))" }}>
            <line x1="2" y1="2" x2="7.5" y2="7.5" />
            <line x1="20" y1="2" x2="14.5" y2="7.5" />
            <line x1="2" y1="20" x2="7.5" y2="14.5" />
            <line x1="20" y1="20" x2="14.5" y2="14.5" />
          </g>
        </motion.svg>
      ))}
    </div>
  );
}

/* -------------------------------------------------------------------- Killfeed */
export type FeedEntry = { id: number; kind: "kill" | "miss"; victim?: string; killer?: string };

const HeadshotIcon = () => (
  <svg width="15" height="15" viewBox="0 0 16 16" aria-hidden>
    <circle cx="8" cy="7" r="5.2" fill="none" stroke="currentColor" strokeWidth="1.6" />
    <circle cx="6" cy="6.5" r="1" fill="currentColor" />
    <circle cx="10" cy="6.5" r="1" fill="currentColor" />
    <path d="M6 12.5v2M8 12.5v2M10 12.5v2" stroke="currentColor" strokeWidth="1.4" />
  </svg>
);

const RifleIcon = () => (
  <svg width="38" height="12" viewBox="0 0 38 12" aria-hidden>
    <path
      d="M1 5h22l2-2h6v2h6v2H27l-3 1h-5l-2 3h-4l1-3H8L6 10H3l1-3H1z"
      fill="currentColor"
    />
  </svg>
);

export function Killfeed({ entries }: { entries: FeedEntry[] }) {
  return (
    <div
      className="pointer-events-none fixed right-2 z-[55] flex flex-col items-end gap-1"
      style={{ top: "calc(env(safe-area-inset-top, 0px) + 56px)" }}
      aria-hidden
    >
      <AnimatePresence initial={false}>
        {entries.map((e) =>
          e.kind === "kill" ? (
            <motion.div
              key={e.id}
              layout
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ type: "spring", stiffness: 420, damping: 30 }}
              className="flex items-center gap-2 rounded-sm border border-[#e0303a] bg-black/70 px-2 py-1 font-body text-[0.72rem] font-semibold backdrop-blur-sm"
            >
              <span className="text-[#99c4f0]">{e.killer ?? "лизон"}</span>
              <span className="text-white/90">
                <RifleIcon />
              </span>
              <span className="text-white/90">
                <HeadshotIcon />
              </span>
              <span className="text-[#e8b64f]">{e.victim}</span>
            </motion.div>
          ) : (
            <motion.div
              key={e.id}
              layout
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0 }}
              className="rounded-sm bg-black/70 px-2 py-1 font-mono text-[0.66rem] backdrop-blur-sm"
            >
              <span className="text-white/80">[game</span>
              <span className="text-[#95b806]">sense</span>
              <span className="text-white/80">] </span>
              <span className="text-[#ff5a5a]">missed shot due to resolver</span>
            </motion.div>
          ),
        )}
      </AnimatePresence>
    </div>
  );
}

/** Hook that manages the feed: push() adds an entry that expires after a few seconds. */
export function useKillfeed() {
  const [entries, setEntries] = useState<FeedEntry[]>([]);
  const id = useRef(0);
  const push = (entry: Omit<FeedEntry, "id">) => {
    const e = { ...entry, id: ++id.current };
    setEntries((prev) => [...prev.slice(-3), e]);
    setTimeout(() => setEntries((prev) => prev.filter((p) => p.id !== e.id)), 4200);
  };
  return { entries, push };
}

/* ------------------------------------------------------------ Skeet watermark */
export function SkeetWatermark({ user }: { user: string }) {
  const [time, setTime] = useState(() => new Date().toTimeString().slice(0, 5));
  useEffect(() => {
    const t = setInterval(() => setTime(new Date().toTimeString().slice(0, 5)), 15000);
    return () => clearInterval(t);
  }, []);
  return (
    <div
      className="pointer-events-none fixed bottom-2 right-2 z-[50] select-none overflow-hidden rounded-sm bg-black/60 font-mono text-[0.62rem] leading-none text-white/75 backdrop-blur-sm"
      style={{ marginBottom: "env(safe-area-inset-bottom, 0px)" }}
      aria-hidden
    >
      <div className="skeet-bar h-[2px] w-full" />
      <div className="px-2 py-1.5">
        game<span className="text-[#95b806]">sense</span> | {user} | 128 tick | {time}
      </div>
    </div>
  );
}

/** Rainbow line, same as the top of the gamesense menu. */
export const SKEET_CSS = `
.skeet-bar{background:linear-gradient(90deg,#3bc1e8 0%,#c149d8 33%,#e8e03b 66%,#3bc1e8 100%);background-size:200% 100%;animation:skeetshift 6s linear infinite}
@keyframes skeetshift{from{background-position:0 0}to{background-position:200% 0}}
@media (prefers-reduced-motion:reduce){.skeet-bar{animation:none}}
`;

/* ---------------------------------------------------------------- Phonk synth */
/** ~3s phonk cowbell riff + 808s, synthesized with WebAudio (no files). Must be called from a user gesture. */
export function playPhonk() {
  try {
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new Ctx();
    const master = ctx.createGain();
    master.gain.value = 0.32;
    master.connect(ctx.destination);

    const bpm = 140;
    const s16 = 60 / bpm / 4;
    const t0 = ctx.currentTime + 0.05;

    const cowbell = (t: number, ratio: number) => {
      const bp = ctx.createBiquadFilter();
      bp.type = "bandpass";
      bp.frequency.value = 1100 * ratio;
      bp.Q.value = 1.4;
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.7, t + 0.004);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.28);
      [540, 800].forEach((f) => {
        const o = ctx.createOscillator();
        o.type = "square";
        o.frequency.value = f * ratio;
        o.connect(bp);
        o.start(t);
        o.stop(t + 0.3);
      });
      bp.connect(g).connect(master);
    };

    const shaper = ctx.createWaveShaper();
    const curve = new Float32Array(256);
    for (let i = 0; i < 256; i++) {
      const x = (i / 128) - 1;
      curve[i] = Math.tanh(x * 3);
    }
    shaper.curve = curve;
    shaper.connect(master);

    const kick808 = (t: number, len = 0.7) => {
      const o = ctx.createOscillator();
      o.type = "sine";
      o.frequency.setValueAtTime(140, t);
      o.frequency.exponentialRampToValueAtTime(46, t + 0.09);
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.9, t + 0.005);
      g.gain.exponentialRampToValueAtTime(0.0001, t + len);
      o.connect(g).connect(shaper);
      o.start(t);
      o.stop(t + len + 0.05);
    };

    // cowbell melody (semitone ratios), classic drift-phonk shape
    const r = (semi: number) => Math.pow(2, semi / 12);
    const melody = [0, null, 0, 3, null, 0, -2, null, 0, null, 0, 5, null, 3, 0, -2];
    for (let bar = 0; bar < 2; bar++) {
      melody.forEach((n, i) => {
        if (n !== null) cowbell(t0 + (bar * 16 + i) * s16, r(n));
      });
      [0, 6, 10].forEach((i) => kick808(t0 + (bar * 16 + i) * s16, i === 0 ? 0.9 : 0.5));
    }
    setTimeout(() => ctx.close().catch(() => {}), 4500);
  } catch {
    /* audio unavailable: silently skip */
  }
}

/* =====================================================================
   CYBER LAYER — decorative, meaningless-on-purpose tech visuals
   ===================================================================== */

const HEX = "0123456789ABCDEF";
const GLYPHS = "▓▒░<>/\\|=+*#%01ABCDEFx$&@";
const rnd = (n: number) => Math.floor(Math.random() * n);
export const hex = (len: number) => Array.from({ length: len }, () => HEX[rnd(16)]).join("");

/* ---------------------------------------------------------- hex rain canvas */
export function CyberBackdrop() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const reduced = prefersReducedMotion();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const STEP = 16;
    let cols: { y: number; speed: number; len: number; chars: string[] }[] = [];
    let raf = 0;
    let last = 0;

    const resize = () => {
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const n = Math.ceil(window.innerWidth / STEP);
      cols = Array.from({ length: n }, () => ({
        y: Math.random() * window.innerHeight,
        speed: 0.6 + Math.random() * 1.8,
        len: 6 + rnd(14),
        chars: Array.from({ length: 24 }, () => HEX[rnd(16)]),
      }));
    };

    const draw = (t: number) => {
      raf = requestAnimationFrame(draw);
      if (t - last < 50) return; // ~20fps is plenty
      last = t;
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
      ctx.font = `11px "JetBrains Mono", ui-monospace, monospace`;
      cols.forEach((c, i) => {
        for (let k = 0; k < c.len; k++) {
          const y = c.y - k * STEP;
          if (y < -STEP || y > window.innerHeight + STEP) continue;
          const a = k === 0 ? 0.55 : 0.28 * (1 - k / c.len);
          ctx.fillStyle = k === 0 ? `rgba(220,255,255,${a})` : `rgba(0,229,255,${a})`;
          ctx.fillText(c.chars[(k + Math.floor(c.y / STEP)) % c.chars.length], i * STEP + 3, y);
        }
        if (!reduced) {
          c.y += c.speed * STEP * 0.35;
          if (Math.random() < 0.04) c.chars[rnd(c.chars.length)] = HEX[rnd(16)];
          if (c.y - c.len * STEP > window.innerHeight) {
            c.y = -rnd(200);
            c.speed = 0.6 + Math.random() * 1.8;
          }
        }
      });
      if (reduced) cancelAnimationFrame(raf);
    };

    resize();
    window.addEventListener("resize", resize);
    raf = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <>
      <canvas ref={ref} className="pointer-events-none fixed inset-0 z-0 opacity-[0.22]" aria-hidden />
      <div className="cyber-scanlines pointer-events-none fixed inset-0 z-0" aria-hidden />
      <div className="pointer-events-none fixed inset-0 z-0 bg-[radial-gradient(ellipse_at_center,transparent_40%,hsl(var(--background))_100%)]" aria-hidden />
    </>
  );
}

/* ------------------------------------------------------------ ticker strip */
const TICKER_TOKENS = [
  () => `SHA256:${hex(8).toLowerCase()}…${hex(4).toLowerCase()}`,
  () => `0x${hex(8)}`,
  () => "TLS_AES_256_GCM_SHA384",
  () => `nonce=${hex(12).toLowerCase()}`,
  () => "ecdh.x25519 ✓",
  () => "jwks.kid=lz-0406",
  () => `rtt ${2 + rnd(6)}ms`,
  () => "choke 0 · loss 0%",
  () => `seq=${rnd(99999)}`,
  () => "aes-gcm tag ok",
  () => `ttl=${86400 - rnd(500)}`,
  () => "fido2.assert ✓",
  () => `pid ${1000 + rnd(8000)}`,
  () => "cl_interp 0",
  () => `ptr 0x7ffd${hex(4).toLowerCase()}`,
];

export function HexTicker() {
  const [items] = useState(() => Array.from({ length: 22 }, (_, i) => TICKER_TOKENS[i % TICKER_TOKENS.length]()));
  const row = items.join("   ·   ");
  return (
    <div className="relative mb-4 overflow-hidden border-y border-primary/15 py-1 font-mono text-[0.6rem] text-primary/55" aria-hidden>
      <div className="cyber-ticker flex w-max whitespace-nowrap">
        <span className="pr-8">{row}</span>
        <span className="pr-8">{row}</span>
      </div>
    </div>
  );
}

/* ------------------------------------------------------- decrypting heading */
export function ScrambleText({ text, className }: { text: string; className?: string }) {
  const [out, setOut] = useState(text);
  useEffect(() => {
    if (prefersReducedMotion()) {
      setOut(text);
      return;
    }
    const chars = [...text];
    const total = 520;
    const start = performance.now();
    let raf = 0;
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / total);
      const revealed = Math.floor(p * chars.length);
      setOut(
        chars
          .map((ch, i) => (i < revealed || ch === " " ? ch : GLYPHS[rnd(GLYPHS.length)]))
          .join(""),
      );
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [text]);
  return (
    <span className={className}>
      <span className="sr-only">{text}</span>
      <span aria-hidden>{out}</span>
    </span>
  );
}

/* ------------------------------------------------------------- HUD corners */
export function HudCorners() {
  const c = "absolute h-3 w-3 border-primary/70";
  return (
    <div className="pointer-events-none absolute inset-1.5 z-[5]" aria-hidden>
      <span className={`${c} left-0 top-0 border-l-2 border-t-2`} />
      <span className={`${c} right-0 top-0 border-r-2 border-t-2`} />
      <span className={`${c} bottom-0 left-0 border-b-2 border-l-2`} />
      <span className={`${c} bottom-0 right-0 border-b-2 border-r-2`} />
    </div>
  );
}

/* --------------------------------------------------- scan sweep on step in */
export function ScanSweep() {
  return (
    <motion.div
      className="pointer-events-none absolute inset-x-0 z-[6] h-[2px] bg-primary shadow-[0_0_14px_2px_hsl(var(--primary)/0.7)]"
      initial={{ top: "0%", opacity: 0.9 }}
      animate={{ top: "100%", opacity: 0 }}
      transition={{ duration: 0.7, ease: "easeIn" }}
      aria-hidden
    />
  );
}

/* ------------------------------------------- aimbot snap + headshot overlay */
export function HeadshotSnap() {
  const [lines] = useState(() =>
    Array.from({ length: 4 }, (_, i) =>
      [
        `sig ecdsa-p256 r=${hex(16).toLowerCase()}`,
        `0x${hex(4)}  ${hex(2)} ${hex(2)} ${hex(2)} ${hex(2)}  ${hex(2)} ${hex(2)} ${hex(2)} ${hex(2)}`,
        `hitbox=head dmg=100 bt=${rnd(12)}t`,
        `assert.verify() → 0x00 OK`,
      ][i],
    ),
  );
  const arm = "absolute bg-primary";
  return (
    <div className="flex flex-col items-center">
      <div className="relative h-16 w-16">
        {/* crosshair arms converge */}
        {[
          { cls: `${arm} left-1/2 top-0 h-5 w-[2px] -translate-x-1/2`, from: { y: -26 } },
          { cls: `${arm} bottom-0 left-1/2 h-5 w-[2px] -translate-x-1/2`, from: { y: 26 } },
          { cls: `${arm} left-0 top-1/2 h-[2px] w-5 -translate-y-1/2`, from: { x: -26 } },
          { cls: `${arm} right-0 top-1/2 h-[2px] w-5 -translate-y-1/2`, from: { x: 26 } },
        ].map((a, i) => (
          <motion.span
            key={i}
            className={a.cls}
            initial={{ ...a.from, opacity: 0.4 }}
            animate={{ x: 0, y: 0, opacity: [0.4, 1, 0] }}
            transition={{ duration: 0.5, ease: "easeOut", opacity: { duration: 0.75, times: [0, 0.6, 1] } }}
          />
        ))}
        <motion.span
          className="absolute inset-0 rounded-full border-2 border-primary"
          initial={{ scale: 1, opacity: 0 }}
          animate={{ scale: [1, 2.6], opacity: [0.9, 0] }}
          transition={{ delay: 0.45, duration: 0.8, ease: "easeOut" }}
        />
        <motion.div
          className="absolute inset-0 flex items-center justify-center text-primary"
          initial={{ scale: 0, rotate: -40 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ delay: 0.42, type: "spring", stiffness: 420, damping: 14 }}
        >
          <svg width="40" height="40" viewBox="0 0 16 16" aria-hidden>
            <circle cx="8" cy="7" r="5.2" fill="none" stroke="currentColor" strokeWidth="1.4" />
            <circle cx="6" cy="6.5" r="1" fill="currentColor" />
            <circle cx="10" cy="6.5" r="1" fill="currentColor" />
            <path d="M6 12.5v2M8 12.5v2M10 12.5v2" stroke="currentColor" strokeWidth="1.2" />
          </svg>
        </motion.div>
      </div>
      <motion.p
        className="mt-4 font-mono text-sm font-medium text-primary"
        initial={{ opacity: 0, letterSpacing: "0.6em" }}
        animate={{ opacity: 1, letterSpacing: "0.2em" }}
        transition={{ delay: 0.5, duration: 0.45 }}
      >
        ACCESS GRANTED
      </motion.p>
      <div className="mt-3 space-y-0.5 text-center font-mono text-[0.6rem] text-primary/60">
        {lines.map((l, i) => (
          <motion.div key={i} initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.6 + i * 0.1 }}>
            {l}
          </motion.div>
        ))}
      </div>
    </div>
  );
}

export const CYBER_CSS = `
.cyber-scanlines{background:repeating-linear-gradient(0deg,rgba(255,255,255,.025) 0 1px,transparent 1px 3px);mix-blend-mode:overlay}
.cyber-ticker{animation:cyberticker 38s linear infinite}
@keyframes cyberticker{from{transform:translateX(0)}to{transform:translateX(-50%)}}
@media (prefers-reduced-motion:reduce){.cyber-ticker{animation:none}}
`;
