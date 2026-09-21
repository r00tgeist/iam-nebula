import { useEffect, useRef, useState } from "react";

/* Non-component FX helpers (kept apart from fx.tsx so React fast-refresh works). */

export type FeedEntry = { id: number; kind: "kill" | "miss"; victim?: string; killer?: string };

/** Hook that manages the feed: push() adds an entry that expires after a few seconds. */
export function useKillfeed() {
  const [entries, setEntries] = useState<FeedEntry[]>([]);
  const id = useRef(0);
  const timers = useRef<number[]>([]);
  useEffect(() => () => timers.current.forEach(clearTimeout), []);
  const push = useRef((entry: Omit<FeedEntry, "id">) => {
    const e = { ...entry, id: ++id.current };
    setEntries((prev) => [...prev.slice(-3), e]);
    timers.current.push(window.setTimeout(() => setEntries((prev) => prev.filter((p) => p.id !== e.id)), 4200));
  }).current;
  return { entries, push };
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
    ctx.resume().catch(() => {}); // iOS may create the context suspended
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


export const HEX = "0123456789ABCDEF";
export const GLYPHS = "▓▒░<>/\\|=+*#%01ABCDEFx$&@";
export const rnd = (n: number) => Math.floor(Math.random() * n);
export const hex = (len: number) => Array.from({ length: len }, () => HEX[rnd(16)]).join("");


export const CYBER_CSS = `
.cyber-scanlines{background:repeating-linear-gradient(0deg,rgba(255,255,255,.025) 0 1px,transparent 1px 3px);mix-blend-mode:overlay}
.cyber-ticker{animation:cyberticker 38s linear infinite}
@keyframes cyberticker{from{transform:translateX(0)}to{transform:translateX(-50%)}}
@media (prefers-reduced-motion:reduce){.cyber-ticker{animation:none}}
`;
