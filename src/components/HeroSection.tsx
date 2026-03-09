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
      {/* Mesh gradient background */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div
          className="absolute -top-1/4 -left-1/4 h-[600px] w-[600px] rounded-full opacity-30 blur-[120px]"
          style={{ background: "hsl(187 100% 50%)", animation: "mesh-move 12s ease-in-out infinite" }}
        />
        <div
          className="absolute -right-1/4 top-1/4 h-[500px] w-[500px] rounded-full opacity-20 blur-[120px]"
          style={{ background: "hsl(263 87% 66%)", animation: "mesh-move 15s ease-in-out infinite reverse" }}
        />
        <div
          className="absolute bottom-0 left-1/3 h-[400px] w-[400px] rounded-full opacity-15 blur-[120px]"
          style={{ background: "hsl(220 70% 20%)", animation: "mesh-move 18s ease-in-out infinite" }}
        />
      </div>

      <motion.h1
        className="font-display relative z-10 text-5xl font-extrabold tracking-tight sm:text-7xl md:text-8xl text-gradient-primary"
        initial={{ opacity: 0, y: 30, filter: "blur(10px)" }}
        animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
        transition={{ ...spring, delay: 0.1 }}
      >
        IAM Decoded
      </motion.h1>

      <motion.p
        className="relative z-10 mt-5 max-w-xl text-center text-lg text-muted-foreground"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...spring, delay: 0.35 }}
      >
        Master Identity &amp; Access Management — from zero to architect
      </motion.p>

      {/* Animated divider */}
      <motion.div
        className="relative z-10 mt-8 h-px w-64 bg-primary"
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ duration: 0.8, delay: 0.55, ease: [0.22, 1, 0.36, 1] }}
        style={{ originX: 0 }}
      />

      {/* Filter pills */}
      <motion.div
        className="relative z-10 mt-8 flex gap-3"
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...spring, delay: 0.7 }}
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
      </motion.div>
    </section>
  );
};

export default HeroSection;
