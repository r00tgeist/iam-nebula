import { useEffect, useRef, useState, type PointerEvent as RPointerEvent } from "react";
import { Check, Eye, EyeOff } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { config, type KbaQuestion, type PasswordRule } from "../config";
import { dateMatches, daysSince, matches, norm } from "../lib";
import { ErrorNote, Field, HintNote, PrimaryButton, StepHeader, type StepProps } from "../ui";

/* ---------------------------------------------------------------- 1. Login */
export function LoginStep({ onPass, onFail }: StepProps) {
  const c = config.login;
  const [user, setUser] = useState("");
  const [pass, setPass] = useState("");
  const [show, setShow] = useState(false);
  const [err, setErr] = useState("");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!matches(user, c.usernames)) {
      setErr(`Пользователь не найден. ${c.usernameHint}`);
      onFail(`AUTH_FAIL user="${user.trim() || "∅"}" reason=unknown_user`);
      return;
    }
    if (!matches(pass, c.passwords)) {
      setErr(`Неверный пароль. ${c.passwordHint}`);
      onFail(`AUTH_FAIL user="${norm(user)}" reason=bad_password`);
      return;
    }
    onPass(`AUTH_OK user="${norm(user)}" factor=password`);
  };

  return (
    <form onSubmit={submit} noValidate>
      <StepHeader title={c.title} subtitle={c.subtitle} />
      <div className="space-y-4">
        <Field id="lz-user" label="Имя пользователя" value={user} onChange={(e) => setUser(e.target.value)} autoFocus />
        <div className="relative">
          <Field
            id="lz-pass"
            label="Пароль"
            type={show ? "text" : "password"}
            value={pass}
            onChange={(e) => setPass(e.target.value)}
            className="pr-11"
          />
          <button
            type="button"
            onClick={() => setShow((v) => !v)}
            aria-label={show ? "Скрыть пароль" : "Показать пароль"}
            className="absolute bottom-2.5 right-2.5 rounded p-1 text-muted-foreground hover:text-foreground"
          >
            {show ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
      </div>
      <ErrorNote>{err}</ErrorNote>
      <PrimaryButton type="submit" className="mt-6">
        Войти
      </PrimaryButton>
    </form>
  );
}

/* ------------------------------------------------------ 2. Password expired */
const EMOJI_RE = /\p{Extended_Pictographic}/u;

function ruleOk(rule: PasswordRule, value: string) {
  const v = norm(value);
  switch (rule.type) {
    case "minLength":
      return [...value].length >= rule.value;
    case "contains":
      return rule.anyOf.some((a) => v.includes(norm(a)));
    case "notContains":
      return value.length > 0 && !rule.anyOf.some((a) => v.includes(norm(a)));
    case "emoji":
      return EMOJI_RE.test(value);
    case "digit":
      return /\d/.test(value);
    case "digitSum":
      return [...value.replace(/\D/g, "")].reduce<number>((a, d) => a + Number(d), 0) === rule.value;
  }
}

export function PasswordExpiredStep({ onPass }: StepProps) {
  const c = config.passwordExpired;
  const [pw, setPw] = useState("");
  const [unlocked, setUnlocked] = useState(1); // how many rules are revealed
  const results = c.rules.map((r) => ruleOk(r, pw));
  const allOk = unlocked >= c.rules.length && results.every(Boolean);

  // reveal the next rule once every visible one is satisfied (never hides already revealed rules)
  const visibleOk = results.slice(0, unlocked).every(Boolean);
  useEffect(() => {
    if (visibleOk && unlocked < c.rules.length && pw.length > 0) setUnlocked((u) => u + 1);
  }, [visibleOk, unlocked, pw, c.rules.length]);

  const shown = c.rules.slice(0, unlocked).map((r, i) => ({ r, i, ok: results[i] })).reverse();

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (allOk) onPass(`PASSWORD_CHANGED policy=strict rules_passed=${c.rules.length}/${c.rules.length}`);
      }}
    >
      <StepHeader title={c.title} subtitle={c.subtitle} />
      <Field id="lz-newpass" label="Новый пароль" value={pw} onChange={(e) => setPw(e.target.value)} autoFocus />
      <p className="mt-2 flex justify-between font-mono text-[0.68rem] text-muted-foreground">
        <span>символов: {[...pw].length}</span>
        <span>
          правил: {Math.min(unlocked, c.rules.length)}/{c.rules.length}
        </span>
      </p>
      <ul className="mt-3 space-y-2" aria-live="polite">
        <AnimatePresence initial={false}>
          {shown.map(({ r, i, ok }) => (
            <motion.li
              key={i}
              layout
              initial={{ opacity: 0, y: -10, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ type: "spring", stiffness: 380, damping: 28 }}
              className={cn(
                "rounded-lg border px-3 py-2 text-sm",
                ok ? "border-primary/30 bg-primary/5 text-foreground" : "border-destructive/40 bg-destructive/10 text-foreground",
              )}
            >
              <div className="mb-0.5 flex items-center gap-2 font-mono text-[0.65rem] uppercase tracking-wider">
                <span className={ok ? "text-primary" : "text-destructive"}>{ok ? "✓" : "✗"}</span>
                <span className="text-muted-foreground">правило {i + 1}</span>
              </div>
              {r.label}
            </motion.li>
          ))}
        </AnimatePresence>
      </ul>
      <PrimaryButton type="submit" disabled={!allOk} className="mt-6">
        Сменить пароль
      </PrimaryButton>
    </form>
  );
}

/* ------------------------------------------------------------------- 3. KBA */
function kbaOk(q: KbaQuestion, a: string) {
  switch (q.type) {
    case "date":
      return dateMatches(a, q.day, q.month, q.year);
    case "daysSince": {
      const n = parseInt(a.replace(/\D/g, ""), 10);
      return !Number.isNaN(n) && Math.abs(n - daysSince(q.since)) <= q.tolerance;
    }
    case "keywords": {
      const v = norm(a);
      return q.allOf.every((k) => v.includes(norm(k)));
    }
  }
}

export function KbaStep({ onPass, onFail }: StepProps) {
  const c = config.kba;
  const [answers, setAnswers] = useState<string[]>(c.questions.map(() => ""));
  const [err, setErr] = useState("");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const correct = c.questions.filter((q, i) => kbaOk(q, answers[i])).length;
    if (correct >= c.passCount) {
      onPass(`KBA_OK correct=${correct}/${c.questions.length}`);
    } else {
      setErr(`Верных ответов: ${correct} из ${c.questions.length}. Нужно минимум ${c.passCount}.`);
      onFail(`KBA_FAIL correct=${correct}/${c.questions.length}`);
    }
  };

  return (
    <form onSubmit={submit} noValidate>
      <StepHeader title={c.title} subtitle={c.subtitle} />
      <div className="space-y-4">
        {c.questions.map((q, i) => (
          <Field
            key={i}
            id={`lz-kba-${i}`}
            label={q.q}
            inputMode={q.type === "daysSince" ? "numeric" : undefined}
            value={answers[i]}
            onChange={(e) => setAnswers((a) => a.map((v, j) => (j === i ? e.target.value : v)))}
          />
        ))}
      </div>
      <ErrorNote>{err}</ErrorNote>
      <PrimaryButton type="submit" className="mt-6">
        Проверить
      </PrimaryButton>
    </form>
  );
}

/* --------------------------------------------------------------- 4. Captcha */
export function CaptchaStep({ onPass, onFail }: StepProps) {
  const c = config.captcha;
  const [round, setRound] = useState(0);
  const [sel, setSel] = useState<Set<number>>(new Set());
  const [err, setErr] = useState("");
  const r = c.rounds[round];

  const toggle = (i: number) =>
    setSel((prev) => {
      const n = new Set(prev);
      if (n.has(i)) n.delete(i);
      else n.add(i);
      return n;
    });

  const verify = () => {
    const allowed = new Set([...r.required, ...r.optional]);
    const ok = r.required.every((i) => sel.has(i)) && [...sel].every((i) => allowed.has(i));
    if (!ok) {
      setErr(r.failHint);
      onFail(`CAPTCHA_FAIL round=${round + 1} suspected_robot=true`);
      setSel(new Set());
      return;
    }
    setErr("");
    setSel(new Set());
    if (round + 1 < c.rounds.length) setRound(round + 1);
    else onPass(`CAPTCHA_OK rounds=${c.rounds.length} human=true`);
  };

  return (
    <div>
      <StepHeader title={c.title} subtitle={`Раунд ${round + 1} из ${c.rounds.length}`} />
      <div className="overflow-hidden rounded-lg border border-border">
        <div className="bg-primary px-4 py-3 text-primary-foreground">
          <p className="text-sm">Выберите все квадраты с</p>
          <p className="font-display text-xl font-bold leading-tight">{r.prompt}</p>
        </div>
        <motion.div
          key={round}
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          className="grid grid-cols-4 gap-[3px] bg-card p-[3px]"
        >
          {Array.from({ length: 16 }, (_, i) => {
            const on = sel.has(i);
            const col = i % 4;
            const row = Math.floor(i / 4);
            return (
              <button
                key={i}
                type="button"
                onClick={() => toggle(i)}
                aria-pressed={on}
                aria-label={`Квадрат ${i + 1}`}
                className="relative aspect-square overflow-hidden bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                <motion.span
                  className="absolute inset-0"
                  animate={{ scale: on ? 0.82 : 1 }}
                  transition={{ type: "spring", stiffness: 400, damping: 25 }}
                  style={{
                    backgroundImage: `url(${r.image})`,
                    backgroundSize: "400% 400%",
                    backgroundPosition: `${(col / 3) * 100}% ${(row / 3) * 100}%`,
                  }}
                />
                <AnimatePresence>
                  {on && (
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0 }}
                      className="absolute left-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground"
                    >
                      <Check size={13} strokeWidth={3} />
                    </motion.span>
                  )}
                </AnimatePresence>
              </button>
            );
          })}
        </motion.div>
      </div>
      <ErrorNote>{err}</ErrorNote>
      <PrimaryButton type="button" onClick={verify} className="mt-6">
        {round + 1 < c.rounds.length ? "Далее" : "Подтвердить"}
      </PrimaryButton>
    </div>
  );
}

/* --------------------------------------------------------------- 5. Pattern */
const DOTS = Array.from({ length: 9 }, (_, i) => ({ i, x: 50 + (i % 3) * 100, y: 50 + Math.floor(i / 3) * 100 }));

export function PatternStep({ onPass, onFail }: StepProps) {
  const c = config.pattern;
  const svgRef = useRef<SVGSVGElement>(null);
  const [path, setPath] = useState<number[]>([]);
  const [cursor, setCursor] = useState<{ x: number; y: number } | null>(null);
  const [drawing, setDrawing] = useState(false);
  const [status, setStatus] = useState<"idle" | "bad" | "ok">("idle");
  const [fails, setFails] = useState(0);

  const toLocal = (e: RPointerEvent) => {
    const r = svgRef.current!.getBoundingClientRect();
    return { x: ((e.clientX - r.left) / r.width) * 300, y: ((e.clientY - r.top) / r.height) * 300 };
  };

  const hit = (p: { x: number; y: number }, current: number[]) => {
    const d = DOTS.find((d) => Math.hypot(d.x - p.x, d.y - p.y) < 34);
    if (!d) return current;
    if (current[current.length - 1] === d.i) return current;
    return [...current, d.i];
  };

  const down = (e: RPointerEvent<SVGSVGElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    const p = toLocal(e);
    setStatus("idle");
    setDrawing(true);
    setCursor(p);
    setPath(hit(p, []));
  };

  const move = (e: RPointerEvent<SVGSVGElement>) => {
    if (!drawing) return;
    const p = toLocal(e);
    setCursor(p);
    setPath((cur) => hit(p, cur));
  };

  const up = () => {
    if (!drawing) return;
    setDrawing(false);
    setCursor(null);
    if (path.length < 2) {
      setPath([]);
      return;
    }
    const ok = path.length === c.sequence.length && path.every((v, i) => v === c.sequence[i]);
    if (ok) {
      setStatus("ok");
      setTimeout(() => onPass(`PATTERN_OK points=${path.length}`), 450);
    } else {
      setStatus("bad");
      setFails((f) => f + 1);
      onFail(`PATTERN_FAIL points=${path.length}`);
      setTimeout(() => {
        setPath([]);
        setStatus("idle");
      }, 700);
    }
  };

  const stroke = status === "bad" ? "hsl(var(--destructive))" : "hsl(var(--primary))";
  const pts = path.map((i) => DOTS[i]);

  return (
    <div>
      <StepHeader title={c.title} subtitle={c.subtitle} />
      <svg
        ref={svgRef}
        viewBox="0 0 300 300"
        className="mx-auto block aspect-square w-full max-w-[280px] touch-none select-none"
        onPointerDown={down}
        onPointerMove={move}
        onPointerUp={up}
        onPointerCancel={up}
        role="img"
        aria-label="Поле для графического ключа, 3 на 3 точки"
      >
        {pts.length > 1 && (
          <polyline
            points={pts.map((p) => `${p.x},${p.y}`).join(" ")}
            fill="none"
            stroke={stroke}
            strokeWidth={6}
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity={0.8}
          />
        )}
        {drawing && cursor && pts.length > 0 && (
          <line
            x1={pts[pts.length - 1].x}
            y1={pts[pts.length - 1].y}
            x2={cursor.x}
            y2={cursor.y}
            stroke={stroke}
            strokeWidth={4}
            strokeLinecap="round"
            opacity={0.4}
          />
        )}
        {DOTS.map((d) => {
          const on = path.includes(d.i);
          return (
            <g key={d.i}>
              <circle cx={d.x} cy={d.y} r={26} fill={on ? stroke : "transparent"} opacity={on ? 0.15 : 0} />
              <circle cx={d.x} cy={d.y} r={on ? 11 : 8} fill={on ? stroke : "hsl(var(--muted-foreground))"} />
            </g>
          );
        })}
      </svg>
      <p className="mt-2 text-center text-sm text-muted-foreground" aria-live="polite">
        {status === "bad" ? "Неверный ключ. Попробуйте ещё раз." : status === "ok" ? "Устройство разблокировано" : "Проведите пальцем по точкам"}
      </p>
      {fails >= c.hintAfterFails && (
        <div className="mt-4">
          <HintNote>{c.hint}</HintNote>
        </div>
      )}
    </div>
  );
}

