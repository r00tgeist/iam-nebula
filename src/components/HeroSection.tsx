import { motion } from "framer-motion";

const spring = { type: "spring" as const, stiffness: 300, damping: 30 };

const HeroSection = ({
  filter,
  setFilter,
}: {
  filter: "all" | "basic" | "advanced";
  setFilter: (f: "all" | "basic" | "advanced") => void;
}) => {
  const filters: Array<{ value: "all" | "basic" | "advanced"; label: string }> = [
    { value: "all", label: "All" },
    { value: "basic", label: "Basic" },
    { value: "advanced", label: "Advanced" },
  ];

  return (
    <section className="relative flex min-h-[60vh] flex-col items-center justify-center overflow-hidden px-4 pt-20 pb-10">
      {/* Mesh gradient — uses radial-gradient instead of blur filter */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden" style={{ contain: "strict" }}>
        <div
          className="absolute -top-[200px] -left-[200px] h-[700px] w-[700px] rounded-full"
          style={{
            background: "radial-gradient(circle, hsla(187,100%,50%,0.18) 0%, transparent 65%)",
            animation: "mesh-drift 14s ease-in-out infinite",
            willChange: "transform",
          }}
        />
        <div
          className="absolute -right-[150px] top-[10%] h-[600px] w-[600px] rounded-full"
          style={{
            background: "radial-gradient(circle, hsla(263,87%,66%,0.12) 0%, transparent 65%)",
            animation: "mesh-drift 18s ease-in-out infinite reverse",
            willChange: "transform",
          }}
        />
        <div
          className="absolute bottom-[-100px] left-[25%] h-[500px] w-[500px] rounded-full"
          style={{
            background: "radial-gradient(circle, hsla(220,70%,20%,0.15) 0%, transparent 65%)",
            animation: "mesh-drift 22s ease-in-out infinite",
            willChange: "transform",
          }}
        />
      </div>

      <h1
        className="hero-animate font-display relative z-10 text-5xl font-extrabold tracking-tight sm:text-7xl md:text-8xl text-gradient-primary"
        style={{ animationDelay: "0.1s" }}
      >
        IAM Decoded
      </h1>

      <p
        className="hero-animate relative z-10 mt-5 max-w-xl text-center text-lg text-muted-foreground"
        style={{ animationDelay: "0.3s" }}
      >
        Master Identity &amp; Access Management — from zero to architect
      </p>

      {/* Animated divider */}
      <div
        className="hero-animate relative z-10 mt-8 h-px w-64 bg-primary origin-left"
        style={{ animationDelay: "0.5s", animation: "divider-draw 0.8s cubic-bezier(0.22,1,0.36,1) 0.5s both" }}
      />

      {/* Filter pills — keep Framer only for the pill indicator */}
      <div
        className="hero-animate relative z-10 mt-8 flex gap-3"
        style={{ animationDelay: "0.6s" }}
      >
        {filters.map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={`relative rounded-full px-6 py-2 text-sm font-medium font-body transition-colors duration-200 ${
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
            <span className="relative z-10">{f.label}</span>
          </button>
        ))}
      </div>
    </section>
  );
};

export default HeroSection;
