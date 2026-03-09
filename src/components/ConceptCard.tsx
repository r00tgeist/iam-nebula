import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Concept } from "@/data/concepts";
import LucideIcon from "@/components/LucideIcon";

const spring = { type: "spring" as const, stiffness: 300, damping: 30 };

const ConceptCard = ({ concept, index }: { concept: Concept; index: number }) => {
  const navigate = useNavigate();
  const isCyan = concept.category === "basic";

  return (
    <motion.div
      layoutId={`card-${concept.id}`}
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ...spring, delay: 0.8 + index * 0.05 }}
      whileHover={{ y: -8, transition: spring }}
      onClick={() => navigate(`/concept/${concept.id}`)}
      className="group relative cursor-pointer overflow-hidden rounded-xl border border-dashed border-[rgba(255,255,255,0.08)] bg-card/50 p-6 backdrop-blur-md transition-colors duration-300 hover:border-solid hover:border-primary/50"
      style={{
        boxShadow: "none",
        transition: "box-shadow 0.3s, border-color 0.3s",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.boxShadow = isCyan
          ? "0 0 30px rgba(0, 229, 255, 0.15)"
          : "0 0 30px rgba(139, 92, 246, 0.15)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.boxShadow = "none";
      }}
    >
      {/* Shimmer sweep */}
      <div className="pointer-events-none absolute inset-0 -translate-x-full rotate-[-45deg] bg-gradient-to-r from-transparent via-[rgba(255,255,255,0.04)] to-transparent opacity-0 transition-opacity duration-300 group-hover:animate-[shimmer-sweep_0.8s_ease-out_forwards] group-hover:opacity-100" />

      {/* Category badge */}
      <span
        className={`inline-block rounded-full px-3 py-0.5 text-xs font-semibold font-body ${
          isCyan
            ? "bg-primary/15 text-primary"
            : "bg-secondary/15 text-secondary"
        }`}
      >
        {concept.category === "basic" ? "Basic" : "Advanced"}
      </span>

      {/* Icon */}
      <div className="mt-6 flex justify-center">
        <div
          className={`relative flex h-16 w-16 items-center justify-center rounded-full transition-transform duration-300 group-hover:scale-110 ${
            isCyan
              ? "bg-primary/10 text-primary"
              : "bg-secondary/10 text-secondary"
          }`}
        >
          {/* Glow ring on hover */}
          <div
            className={`absolute inset-0 rounded-full opacity-0 transition-opacity duration-300 group-hover:opacity-100 ${
              isCyan ? "glow-cyan" : "glow-violet"
            }`}
          />
          <LucideIcon name={concept.icon} size={28} />
        </div>
      </div>

      {/* Title */}
      <h3 className="font-display mt-5 text-center text-lg font-bold text-foreground">
        {concept.shortTitle}
      </h3>

      {/* Description */}
      <p className="mt-2 text-center text-sm text-muted-foreground transition-transform duration-200 group-hover:-translate-y-1">
        {concept.description}
      </p>

      {/* Explore link */}
      <p className="mt-3 text-center text-xs font-medium text-primary opacity-0 transition-opacity duration-200 group-hover:opacity-100">
        Explore →
      </p>
    </motion.div>
  );
};

export default ConceptCard;
