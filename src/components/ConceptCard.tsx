import { memo } from "react";
import { useNavigate } from "react-router-dom";
import { Concept } from "@/data/concepts";
import LucideIcon from "@/components/LucideIcon";
import { ArrowRight } from "lucide-react";

const ConceptCard = memo(({ concept }: { concept: Concept; index: number }) => {
  const navigate = useNavigate();
  const isCyan = concept.category === "basic";

  return (
    <div
      onClick={() => navigate(`/concept/${concept.id}`)}
      className="concept-card group cursor-pointer rounded-xl bg-card/60 p-6 transition-all duration-300 ease-out hover:-translate-y-1.5 hover:bg-card/90"
    >
      <div className="flex items-center justify-between mb-6">
        <span
          className={`inline-block rounded-full px-3 py-0.5 text-[10px] font-semibold font-mono uppercase tracking-wider ${
            isCyan
              ? "bg-primary/10 text-primary/80 border border-primary/10"
              : "bg-secondary/10 text-secondary/80 border border-secondary/10"
          }`}
        >
          {concept.category}
        </span>
        <ArrowRight
          size={14}
          className="text-muted-foreground/0 group-hover:text-muted-foreground/60 transition-all duration-300 -translate-x-2 group-hover:translate-x-0"
        />
      </div>

      <div className="flex justify-center mb-5">
        <div className="relative">
          <div
            className={`flex h-14 w-14 items-center justify-center rounded-2xl transition-all duration-300 group-hover:scale-110 ${
              isCyan
                ? "bg-primary/8 text-primary/70 group-hover:bg-primary/12 group-hover:text-primary"
                : "bg-secondary/8 text-secondary/70 group-hover:bg-secondary/12 group-hover:text-secondary"
            }`}
          >
            <LucideIcon name={concept.icon} size={24} />
          </div>
          <div
            className={`absolute -inset-2 rounded-3xl opacity-0 transition-opacity duration-300 group-hover:opacity-100 ${
              isCyan ? "glow-cyan" : "glow-violet"
            }`}
          />
        </div>
      </div>

      <h3 className="font-display text-center text-base font-bold text-foreground/90 group-hover:text-foreground transition-colors duration-200">
        {concept.shortTitle}
      </h3>

      <p className="mt-2 text-center text-[13px] text-muted-foreground/60 leading-relaxed group-hover:text-muted-foreground/80 transition-colors duration-200">
        {concept.description}
      </p>

      <div className="mt-5 flex justify-center">
        <div
          className={`h-px w-0 group-hover:w-12 transition-all duration-500 ease-out ${
            isCyan ? "bg-primary/30" : "bg-secondary/30"
          }`}
        />
      </div>
    </div>
  );
});

ConceptCard.displayName = "ConceptCard";

export default ConceptCard;
