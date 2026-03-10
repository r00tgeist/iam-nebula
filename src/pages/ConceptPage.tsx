import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { concepts } from "@/data/concepts";
import { connections } from "@/data/connections";
import RoadmapDiagram from "@/components/RoadmapDiagram";
import LucideIcon from "@/components/LucideIcon";
import { ConceptShowcase, hasShowcase } from "@/components/showcases";

const spring = { type: "spring" as const, stiffness: 300, damping: 30 };

const ConceptPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const concept = concepts.find((c) => c.id === id);
  const conceptConnections = connections.find((c) => c.conceptId === id);

  if (!concept) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">Concept not found.</p>
      </div>
    );
  }

  const isCyan = concept.category === "basic";
  const showShowcase = id && hasShowcase(id);

  return (
    <div className="min-h-screen px-4 py-8">
      <div className="mx-auto max-w-5xl">
        {/* Top bar */}
        <motion.div
          className="flex items-center gap-4"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={spring}
        >
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft size={16} />
            Back to Gallery
          </button>
          <span
            className={`rounded-full px-3 py-0.5 text-xs font-semibold font-body ${
              isCyan
                ? "bg-primary/15 text-primary"
                : "bg-secondary/15 text-secondary"
            }`}
          >
            {concept.category === "basic" ? "Basic" : "Advanced"}
          </span>
        </motion.div>

        {/* Title */}
        <motion.div
          layoutId={`card-${concept.id}`}
          className="mt-6"
          transition={spring}
        >
          <div className="flex items-center gap-4">
            <div
              className={`flex h-14 w-14 items-center justify-center rounded-xl ${
                isCyan
                  ? "bg-primary/15 text-primary"
                  : "bg-secondary/15 text-secondary"
              }`}
            >
              <LucideIcon name={concept.icon} size={28} />
            </div>
            <h1 className="font-display text-3xl font-bold text-foreground sm:text-4xl">
              {concept.title}
            </h1>
          </div>
          <p className="mt-3 text-lg text-muted-foreground">
            {concept.description}
          </p>
        </motion.div>

        {/* Interactive Showcase (rendered above roadmap for prominence) */}
        {showShowcase && (
          <motion.div
            className="mt-12"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...spring, delay: 0.15 }}
          >
            <ConceptShowcase conceptId={id!} />
          </motion.div>
        )}

        {/* Roadmap */}
        {conceptConnections && (
          <motion.div
            className="mt-12"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...spring, delay: showShowcase ? 0.3 : 0.2 }}
          >
            <RoadmapDiagram concept={concept} connections={conceptConnections} />
          </motion.div>
        )}

        {/* Description sections */}
        <motion.div
          className="mt-16 space-y-8"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...spring, delay: showShowcase ? 0.45 : 0.4 }}
        >
          <div>
            <h2 className="font-display text-xl font-bold text-foreground">
              What is it?
            </h2>
            <p className="mt-3 text-muted-foreground leading-relaxed">
              {concept.whatIsIt}
            </p>
          </div>

          <div>
            <h2 className="font-display text-xl font-bold text-foreground">
              Why it matters
            </h2>
            <p className="mt-3 text-muted-foreground leading-relaxed">
              {concept.whyItMatters}
            </p>
          </div>

          <div className="glass-card border-l-2 border-l-primary p-5">
            <h3 className="font-display text-sm font-bold uppercase tracking-wider text-primary">
              Key Takeaway
            </h3>
            <p className="mt-2 text-foreground leading-relaxed">
              {concept.keyTakeaway}
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default ConceptPage;
