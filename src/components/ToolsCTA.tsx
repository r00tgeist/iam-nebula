import { ExternalLink, Wrench } from "lucide-react";
import { conceptTools, Tool } from "@/data/tools";

const TAG_STYLE = {
  free: "bg-green-500/10 text-green-400 border-green-500/15",
  freemium: "bg-primary/10 text-primary border-primary/15",
  enterprise: "bg-secondary/10 text-secondary border-secondary/15",
};

const ToolsCTA = ({ conceptId }: { conceptId: string }) => {
  const tools = conceptTools[conceptId];
  if (!tools || tools.length === 0) return null;

  return (
    <div className="glass-card p-6 sm:p-8">
      <div className="flex items-center gap-2 mb-2">
        <Wrench size={16} className="text-primary" />
        <h2 className="font-display text-lg font-bold text-foreground">
          Real-World Tools
        </h2>
      </div>
      <p className="text-sm text-muted-foreground mb-6">
        Production-ready tools and platforms that implement this concept.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {tools.map((tool) => (
          <a
            key={tool.name}
            href={tool.url}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex flex-col rounded-xl border border-[rgba(255,255,255,0.06)] bg-[rgba(0,0,0,0.15)] p-4 transition-all duration-200 hover:border-[rgba(255,255,255,0.12)] hover:bg-[rgba(255,255,255,0.02)]"
          >
            <div className="flex items-start justify-between mb-2">
              <p className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                {tool.name}
              </p>
              <ExternalLink
                size={12}
                className="text-muted-foreground/30 group-hover:text-primary/60 transition-colors mt-0.5 shrink-0 ml-2"
              />
            </div>
            <p className="text-[11px] text-muted-foreground/60 leading-relaxed flex-1">
              {tool.description}
            </p>
            <div className="mt-3">
              <span
                className={`text-[9px] font-mono font-semibold uppercase px-2 py-0.5 rounded border ${TAG_STYLE[tool.tag]}`}
              >
                {tool.tag}
              </span>
            </div>
          </a>
        ))}
      </div>

      <p className="mt-4 text-[10px] text-muted-foreground/30 text-center font-mono">
        Some links may be affiliate links. We only recommend tools we'd actually use.
      </p>
    </div>
  );
};

export default ToolsCTA;
