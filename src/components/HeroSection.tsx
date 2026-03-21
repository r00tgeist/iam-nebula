import { motion } from "framer-motion";
import { KeyRound } from "lucide-react";

const spring = { type: "spring" as const, stiffness: 300, damping: 30 };

const HeroSection = ({
  filter,
  setFilter,
}: {
  filter: "all" | "basic" | "advanced";
  setFilter: (f: "all" | "basic" | "advanced") => void;
}) => {
  const filters: Array<{ value: "all" | "basic" | "advanced"; label: string; count: number }> = [
    { value: "all", label: "All", count: 16 },
    { value: "basic", label: "Basic", count: 8 },
    { value: "advanced", label: "Advanced", count: 8 },
  ];

  return (
    <section className="relative flex min-h-[65vh] flex-col items-center justify-center overflow-hidden px-4 pt-24 pb-12">
      {/* Mesh gradient — radial-gradient only, zero blur */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden" style={{ contain: "strict" }}>
        <div
          className="absolute -top-[250px] -left-[200px] h-[700px] w-[700px] rounded-full"
          style={{
            background: "radial-gradient(circle, hsla(187,100%,50%,0.12) 0%, transparent 60%)",
            animation: "mesh-drift 16s ease-in-out infinite",
          }}
        />
        <div
          className="absolute -right-[200px] top-[5%] h-[650px] w-[650px] rounded-full"
          style={{
            background: "radial-gradient(circle, hsla(263,87%,66%,0.1) 0%, transparent 60%)",
            animation: "mesh-drift 20s ease-in-out infinite reverse",
          }}
        />
        <div
          className="absolute bottom-[-150px] left-[20%] h-[500px] w-[500px] rounded-full"
          style={{
            background: "radial-gradient(circle, hsla(220,70%,30%,0.08) 0%, transparent 60%)",
            animation: "mesh-drift 24s ease-in-out infinite",
          }}
        />
      </div>

      {/* Floating icon */}
      <div
        className="hero-animate relative z-10 mb-6 flex h-20 w-20 items-center justify-center rounded-2xl"
        style={{ animationDelay: "0s" }}
      >
        <div
          className="absolute inset-0 rounded-2xl"
          style={{
            background: "linear-gradient(135deg, rgba(0,229,255,0.15), rgba(139,92,246,0.1))",
            animation: "pulse-glow 3s ease-in-out infinite",
          }}
        />
        <div className="relative flex h-16 w-16 items-center justify-center rounded-xl bg-[rgba(0,229,255,0.08)] border border-primary/20">
          <KeyRound size={28} className="text-primary" />
        </div>
      </div>

      {/* Title */}
      <h1
        className="hero-animate font-display relative z-10 text-4xl font-extrabold tracking-tight sm:text-7xl md:text-8xl text-gradient-primary text-center"
        style={{ animationDelay: "0.1s" }}
      >
        IAM Decoded
      </h1>

      {/* Subtitle */}
      <p
        className="hero-animate relative z-10 mt-5 max-w-lg text-center text-lg text-muted-foreground/80"
        style={{ animationDelay: "0.25s" }}
      >
        Master Identity & Access Management — from zero to architect
      </p>

      {/* Accent line */}
      <div
        className="hero-animate relative z-10 mt-8 flex items-center gap-3"
        style={{ animationDelay: "0.4s" }}
      >
        <div className="h-px w-16 bg-gradient-to-r from-transparent to-primary/40" />
        <div className="h-1.5 w-1.5 rounded-full bg-primary/60" />
        <div className="h-px w-16 bg-gradient-to-l from-transparent to-primary/40" />
      </div>

      {/* Filter pills */}
      <div
        className="hero-animate relative z-10 mt-8 flex gap-2"
        style={{ animationDelay: "0.5s" }}
      >
        {filters.map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={`relative rounded-full px-5 py-2 text-sm font-medium font-body transition-colors duration-200 ${
              filter === f.value
                ? "text-primary-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {filter === f.value && (
              <motion.span
                layoutId="filter-pill"
                className="absolute inset-0 rounded-full bg-primary glow-cyan"
                transition={spring}
              />
            )}
            <span className="relative z-10 flex items-center gap-1.5">
              {f.label}
              <span className={`text-[10px] font-mono ${filter === f.value ? "text-primary-foreground/70" : "text-muted-foreground/40"}`}>
                {f.count}
              </span>
            </span>
          </button>
        ))}
      </div>
    </section>
  );
};

export default HeroSection;
