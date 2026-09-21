import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { prefersReducedMotion } from "./lib";
import { GLYPHS, HEX, hex, rnd, type FeedEntry } from "./fx-core";

/* ------------------------------------------------------------------ Hitmarkers */
type Hit = { id: number; x: number; y: number };

/** CS-style hitmarker on every tap/click anywhere on the page. */
export function Hitmarkers() {
  const [hits, setHits] = useState<Hit[]>([]);
  const id = useRef(0);

  useEffect(() => {
    if (prefersReducedMotion()) return;
    const onDown = (e: MouseEvent) => {
      const h = { id: ++id.current, x: e.clientX, y: e.clientY };
      setHits((prev) => [...prev.slice(-6), h]);
      setTimeout(() => setHits((prev) => prev.filter((p) => p.id !== h.id)), 380);
    };
    // "click" (not pointerdown) so scrolling a page doesn't spray hitmarkers
    window.addEventListener("click", onDown, { passive: true });
    return () => window.removeEventListener("click", onDown);
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
      style={{ top: "calc(env(safe-area-inset-top, 0px) + 10px)" }}
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

/* =====================================================================
   CYBER LAYER — decorative, meaningless-on-purpose tech visuals
   ===================================================================== */

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

    // don't burn battery while the tab is in the background
    const onVisibility = () => {
      cancelAnimationFrame(raf);
      if (!document.hidden) raf = requestAnimationFrame(draw);
    };

    resize();
    window.addEventListener("resize", resize);
    document.addEventListener("visibilitychange", onVisibility);
    raf = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  return (
    <>
      <canvas ref={ref} className="pointer-events-none fixed inset-0 z-0 opacity-[0.15]" aria-hidden />
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
    <div className="relative mb-4 overflow-hidden border-y border-primary/15 py-1 font-mono text-[0.6rem] text-primary/75" aria-hidden>
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
  // final text reserves the layout; scrambled glyphs are stacked on top, so the heading never jumps
  return (
    <span className={`inline-grid overflow-hidden ${className ?? ""}`}>
      <span className="sr-only">{text}</span>
      <span aria-hidden className="invisible col-start-1 row-start-1">
        {text}
      </span>
      <span aria-hidden className="col-start-1 row-start-1">
        {out}
      </span>
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
  const arm = "absolute bg-primary";
  return (
    <div className="flex flex-col items-center">
      <div className="relative h-16 w-16">
        {[
          { cls: `${arm} left-1/2 top-0 h-5 w-[2px] -translate-x-1/2`, from: { y: -22 } },
          { cls: `${arm} bottom-0 left-1/2 h-5 w-[2px] -translate-x-1/2`, from: { y: 22 } },
          { cls: `${arm} left-0 top-1/2 h-[2px] w-5 -translate-y-1/2`, from: { x: -22 } },
          { cls: `${arm} right-0 top-1/2 h-[2px] w-5 -translate-y-1/2`, from: { x: 22 } },
        ].map((a, i) => (
          <motion.span
            key={i}
            className={a.cls}
            initial={{ ...a.from, opacity: 0.5 }}
            animate={{ x: 0, y: 0, opacity: [0.5, 1, 0] }}
            transition={{ duration: 0.3, ease: "easeOut", opacity: { duration: 0.45, times: [0, 0.6, 1] } }}
          />
        ))}
        <motion.div
          className="absolute inset-0 flex items-center justify-center text-primary"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.25, type: "spring", stiffness: 500, damping: 20 }}
        >
          <svg width="38" height="38" viewBox="0 0 16 16" aria-hidden>
            <circle cx="8" cy="7" r="5.2" fill="none" stroke="currentColor" strokeWidth="1.4" />
            <circle cx="6" cy="6.5" r="1" fill="currentColor" />
            <circle cx="10" cy="6.5" r="1" fill="currentColor" />
            <path d="M6 12.5v2M8 12.5v2M10 12.5v2" stroke="currentColor" strokeWidth="1.2" />
          </svg>
        </motion.div>
      </div>
      <motion.p
        className="mt-3 font-mono text-sm font-medium tracking-[0.2em] text-primary"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.25 }}
      >
        ACCESS GRANTED
      </motion.p>
    </div>
  );
}

