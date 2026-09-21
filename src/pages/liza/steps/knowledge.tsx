import { useRef, useState, type PointerEvent as RPointerEvent } from "react";
import { Check, Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";
import { config, type PasswordRule } from "../config";
import { matches, matchesKeyword, norm } from "../lib";
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
  }
}

export function PasswordExpiredStep({ onPass }: StepProps) {
  const c = config.passwordExpired;
  const [pw, setPw] = useState("");
  const results = c.rules.map((r) => ruleOk(r, pw));
  const allOk = results.every(Boolean);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (allOk) onPass(`PASSWORD_CHANGED policy=strict rules_passed=${c.rules.length}/${c.rules.length}`);
      }}
    >
      <StepHeader title={c.title} subtitle={c.subtitle} />
      <Field id="lz-newpass" label="Новый пароль" value={pw} onChange={(e) => setPw(e.target.value)} autoFocus />
      <ul className="mt-4 space-y-2" aria-live="polite">
        {c.rules.map((r, i) => (
          <li key={i} className={cn("flex items-start gap-2.5 text-sm", results[i] ? "text-foreground" : "text-muted-foreground")}>
            <span
              className={cn(
                "mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border",
                results[i] ? "border-primary bg-primary text-primary-foreground" : "border-muted-foreground/40",
              )}
            >
              {results[i] ? <Check size={11} strokeWidth={3} /> : null}
            </span>
            <span>{r.label}</span>
          </li>
        ))}
      </ul>
      <PrimaryButton type="submit" disabled={!allOk} className="mt-6">
        Сменить пароль
      </PrimaryButton>
    </form>
  );
}

/* ------------------------------------------------------------------- 3. KBA */
export function KbaStep({ onPass, onFail }: StepProps) {
  const c = config.kba;
  const [answers, setAnswers] = useState<string[]>(c.questions.map(() => ""));
  const [err, setErr] = useState("");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const correct = c.questions.filter((q, i) => matchesKeyword(answers[i], q.answers)).length;
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
  const [sel, setSel] = useState<boolean[]>(c.images.map(() => false));
  const [err, setErr] = useState("");

  const verify = () => {
    const ok = c.images.every((img, i) => img.isUs === sel[i]);
    if (ok) onPass("CAPTCHA_OK human=true");
    else {
      setErr(c.failHint);
      onFail("CAPTCHA_FAIL suspected_robot=true");
      setSel(c.images.map(() => false));
    }
  };

  return (
    <div>
      <StepHeader title={c.title} subtitle={c.subtitle} />
      <div className="grid grid-cols-3 gap-1.5 overflow-hidden rounded-lg">
        {c.images.map((img, i) => (
          <button
            key={i}
            type="button"
            onClick={() => setSel((s) => s.map((v, j) => (j === i ? !v : v)))}
            aria-pressed={sel[i]}
            aria-label={`Изображение ${i + 1}`}
            className="relative aspect-square overflow-hidden bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            {img.src ? (
              <img
                src={img.src}
                alt=""
                className={cn("h-full w-full object-cover transition-transform duration-150", sel[i] && "scale-[0.86]")}
              />
            ) : (
              <span
                className={cn(
                  "flex h-full w-full flex-col items-center justify-center gap-1 transition-transform duration-150",
                  sel[i] && "scale-[0.86]",
                )}
              >
                <span className="text-4xl leading-none" aria-hidden>
                  {img.emoji ?? "?"}
                </span>
                {img.caption && <span className="px-1 text-center text-[0.7rem] leading-tight text-muted-foreground">{img.caption}</span>}
              </span>
            )}
            {sel[i] && (
              <span className="absolute left-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
                <Check size={13} strokeWidth={3} />
              </span>
            )}
          </button>
        ))}
      </div>
      <ErrorNote>{err}</ErrorNote>
      <PrimaryButton type="button" onClick={verify} className="mt-6">
        Подтвердить
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

