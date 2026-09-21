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
export type FeedEntry = { id: number; kind: "kill" | "miss"; victim?: string };

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
              <span className="text-[#99c4f0]">сергеич</span>
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
