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
};

const KEY = "liza-quest";

export const freshState = (): QuestState => ({
  step: 0,
  hwKeyScanned: false,
  pushNumber: 10 + Math.floor(Math.random() * 90),
  audit: [],
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
