import { useNavigate } from "react-router-dom";
import { Concept } from "@/data/concepts";
import LucideIcon from "@/components/LucideIcon";

const ConceptCard = ({ concept, index }: { concept: Concept; index: number }) => {
  const navigate = useNavigate();
  const isCyan = concept.category === "basic";

  return (
    <div
      onClick={() => navigate(`/concept/${concept.id}`)}
      className={`concept-card group relative cursor-pointer overflow-hidden rounded-xl border border-dashed border-[rgba(255,255,255,0.08)] bg-card/80 p-6 transition-all duration-300 ease-out hover:border-solid hover:-translate-y-2 ${
        isCyan ? "hover:border-primary/50 hover:shadow-[0_0_30px_rgba(0,229,255,0.12)]" : "hover:border-secondary/50 hover:shadow-[0_0_30px_rgba(139,92,246,0.12)]"
      }`}
    >
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
    </div>
  );
};

export default ConceptCard;
