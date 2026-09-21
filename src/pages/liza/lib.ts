import { useEffect } from "react";
import { config } from "./config";

export const STEPS = [
  { id: "login", label: "Логин" },
  { id: "passwordExpired", label: "Смена пароля" },
  { id: "kba", label: "Контрольные вопросы" },
  { id: "captcha", label: "CAPTCHA" },
  { id: "pattern", label: "Графический ключ" },
  { id: "otp", label: "OTP" },
  { id: "hardwareKey", label: "Аппаратный ключ" },
  { id: "push", label: "Push-подтверждение" },
  { id: "biometric", label: "Биометрия" },
  { id: "pam", label: "Привилегированный доступ" },
  { id: "final", label: "Финал" },
] as const;

export type StepId = (typeof STEPS)[number]["id"];

export type QuestState = {
  step: number;
  hwKeyScanned: boolean;
  pushNumber: number;
  audit: string[];
  startedAt: number;
  misses: number;
  finishedAt?: number;
};

const KEY = "liza-quest";

export const freshState = (): QuestState => ({
  step: 0,
  hwKeyScanned: false,
  pushNumber: 10 + Math.floor(Math.random() * 90),
  audit: [],
  startedAt: Date.now(),
  misses: 0,
});

export function loadState(): QuestState {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return freshState();
    return { ...freshState(), ...JSON.parse(raw) };
  } catch {
    return freshState();
  }
}

export function saveState(s: QuestState) {
  try {
    localStorage.setItem(KEY, JSON.stringify(s));
  } catch {
    /* storage unavailable: progress just won't persist */
  }
}

export const STORAGE_KEY = KEY;

/** lower-case, ё→е, collapse spaces, trim */
export const norm = (s: string) =>
  s.toLowerCase().replace(/ё/g, "е").replace(/\s+/g, " ").trim();

export const matches = (input: string, accepted: string[]) =>
  accepted.map(norm).includes(norm(input));

/** input contains any keyword (after normalisation); empty input never matches */
export const matchesKeyword = (input: string, keywords: string[]) => {
  const v = norm(input);
  return v.length > 0 && keywords.some((k) => v.includes(norm(k)));
};

const MONTHS = ["янв", "фев", "мар", "апр", "ма", "июн", "июл", "авг", "сен", "окт", "ноя", "дек"];

/** accepts 04.06.2021, 4/6/21, 040621, 04062021, «4 июня 2021», «4 июня» */
export function dateMatches(input: string, day: number, month: number, year: number) {
  const v = norm(input);
  if (!v) return false;
  const yearOk = (y?: number) => y === undefined || y === year || y === year % 100;
  const monthIdx = MONTHS.findIndex((m, i) => (i === 4 ? /(^|\s|\d)ма[йяе]/.test(v) : v.includes(m)));
  if (monthIdx >= 0) {
    const nums = v.match(/\d+/g)?.map(Number) ?? [];
    return nums[0] === day && monthIdx + 1 === month && yearOk(nums[1]);
  }
  const chunks = v.match(/\d+/g) ?? [];
  if (chunks.length === 1 && (chunks[0].length === 6 || chunks[0].length === 8)) {
    const c = chunks[0];
    return +c.slice(0, 2) === day && +c.slice(2, 4) === month && yearOk(+c.slice(4));
  }
  const n = chunks.map(Number);
  return n.length >= 2 && n[0] === day && n[1] === month && yearOk(n[2]);
}

export function daysSince(iso: string) {
  const [y, m, d] = iso.split("-").map(Number);
  const start = Date.UTC(y, m - 1, d);
  const now = new Date();
  const today = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.round((today - start) / 86_400_000);
}

export const timeStamp = () => {
  const d = new Date();
  return d.toTimeString().slice(0, 8);
};

export function useNoIndex() {
  useEffect(() => {
    const meta = document.createElement("meta");
    meta.name = "robots";
    meta.content = "noindex, nofollow";
    document.head.appendChild(meta);
    const prevTitle = document.title;
    document.title = `Вход — ${config.meta.orgName}`;
    return () => {
      meta.remove();
      document.title = prevTitle;
    };
  }, []);
}

export const prefersReducedMotion = () =>
  typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
