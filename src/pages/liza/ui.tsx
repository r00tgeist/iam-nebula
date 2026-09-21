import { forwardRef, type ButtonHTMLAttributes, type InputHTMLAttributes, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { ScrambleText } from "./fx";

export type StepProps = {
  onPass: (auditLine?: string) => void;
  onFail: (auditLine: string) => void;
};

export function StepHeader({ title, subtitle }: { title: string; subtitle?: ReactNode }) {
  return (
    <div className="mb-6">
      <h1 className="font-display text-2xl font-bold leading-tight text-foreground sm:text-[1.7rem]">
        <ScrambleText text={title} />
      </h1>
      {subtitle && <p className="mt-2 text-[0.95rem] leading-relaxed text-muted-foreground">{subtitle}</p>}
    </div>
  );
}

export const Field = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement> & { label: string }>(
  ({ label, className, id, ...props }, ref) => (
    <label className="block" htmlFor={id}>
      <span className="mb-1.5 block text-sm font-medium text-foreground/80">{label}</span>
      <input
        ref={ref}
        id={id}
        autoComplete="off"
        autoCapitalize="off"
        spellCheck={false}
        className={cn(
          "w-full rounded-lg border border-input bg-background/60 px-3.5 py-3 text-base text-foreground",
          "placeholder:text-muted-foreground/60 focus:border-primary/60 focus:outline-none focus:ring-2 focus:ring-primary/30",
          className,
        )}
        {...props}
      />
    </label>
  ),
);
Field.displayName = "Field";

export function PrimaryButton({ className, ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={cn(
        "w-full rounded-lg bg-primary px-4 py-3 text-base font-semibold text-primary-foreground transition-opacity",
        "hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        className,
      )}
      {...props}
    />
  );
}

export function ErrorNote({ children }: { children: ReactNode }) {
  if (!children) return null;
  return (
    <p role="alert" className="mt-3 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
      {children}
    </p>
  );
}

export function HintNote({ children }: { children: ReactNode }) {
  return (
    <p className="rounded-lg border border-secondary/25 bg-secondary/10 px-3 py-2.5 text-sm leading-relaxed text-foreground/85">
      {children}
    </p>
  );
}
