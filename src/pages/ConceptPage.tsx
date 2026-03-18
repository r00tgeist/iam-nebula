import { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, HelpCircle, AlertTriangle, Lightbulb, ChevronLeft, ChevronRight } from "lucide-react";
import { concepts } from "@/data/concepts";
import { connections } from "@/data/connections";
import RoadmapDiagram from "@/components/RoadmapDiagram";
import LucideIcon from "@/components/LucideIcon";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ToolsCTA from "@/components/ToolsCTA";
import { ConceptShowcase, hasShowcase } from "@/components/showcases/index";

const spring = { type: "spring" as const, stiffness: 300, damping: 30 };

const ConceptPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const conceptIndex = concepts.findIndex((c) => c.id === id);
  const concept = conceptIndex >= 0 ? concepts[conceptIndex] : null;
  const conceptConnections = connections.find((c) => c.conceptId === id);

  const prevConcept = conceptIndex > 0 ? concepts[conceptIndex - 1] : null;
  const nextConcept = conceptIndex < concepts.length - 1 ? concepts[conceptIndex + 1] : null;

  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [id]);

  useEffect(() => {
    if (concept) {
      document.title = `${concept.title} — IAM Decoded`;
    }
    return () => {
      document.title = "IAM Decoded — Master Identity & Access Management";
    };
  }, [concept]);

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
    <div className="flex min-h-screen flex-col page-enter">
      <Navbar />

      <div className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">
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

        <motion.div
          className="mt-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
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

        <motion.div
          className="mt-12"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...spring, delay: showShowcase ? 0.4 : 0.3 }}
        >
          <ToolsCTA conceptId={id!} />
        </motion.div>

        <motion.div
          className="mt-16 space-y-8"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...spring, delay: showShowcase ? 0.5 : 0.4 }}
        >
          <div>
            <div className="flex items-center gap-2 mb-3">
              <HelpCircle size={18} className={isCyan ? "text-primary" : "text-secondary"} />
              <h2 className="font-display text-xl font-bold text-foreground">
                What is it?
              </h2>
            </div>
            <p className="text-muted-foreground leading-relaxed">
              {concept.whatIsIt}
            </p>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle size={18} className={isCyan ? "text-primary" : "text-secondary"} />
              <h2 className="font-display text-xl font-bold text-foreground">
                Why it matters
              </h2>
            </div>
            <p className="text-muted-foreground leading-relaxed">
              {concept.whyItMatters}
            </p>
          </div>

          <div className={`glass-card border-l-2 p-5 ${isCyan ? "border-l-primary" : "border-l-secondary"}`}>
            <div className="flex items-center gap-2 mb-2">
              <Lightbulb size={14} className={isCyan ? "text-primary" : "text-secondary"} />
              <h3 className={`font-display text-sm font-bold uppercase tracking-wider ${isCyan ? "text-primary" : "text-secondary"}`}>
                Key Takeaway
              </h3>
            </div>
            <p className="text-foreground leading-relaxed">
              {concept.keyTakeaway}
            </p>
          </div>
        </motion.div>

        <div className="mt-16 mb-8 flex items-stretch gap-4">
          {prevConcept ? (
            <button
              onClick={() => navigate(`/concept/${prevConcept.id}`)}
              className="flex-1 flex items-center gap-3 rounded-xl border border-[rgba(255,255,255,0.06)] bg-[rgba(0,0,0,0.1)] px-5 py-4 text-left transition-all hover:border-[rgba(255,255,255,0.12)] hover:bg-[rgba(255,255,255,0.02)] group"
            >
              <ChevronLeft size={16} className="text-muted-foreground/40 group-hover:text-foreground transition-colors shrink-0" />
              <div>
                <p className="text-[10px] font-mono text-muted-foreground/40 uppercase tracking-wider">Previous</p>
                <p className="text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors">
                  {prevConcept.shortTitle}
                </p>
              </div>
            </button>
          ) : (
            <div className="flex-1" />
          )}
          {nextConcept ? (
            <button
              onClick={() => navigate(`/concept/${nextConcept.id}`)}
              className="flex-1 flex items-center justify-end gap-3 rounded-xl border border-[rgba(255,255,255,0.06)] bg-[rgba(0,0,0,0.1)] px-5 py-4 text-right transition-all hover:border-[rgba(255,255,255,0.12)] hover:bg-[rgba(255,255,255,0.02)] group"
            >
              <div>
                <p className="text-[10px] font-mono text-muted-foreground/40 uppercase tracking-wider">Next</p>
                <p className="text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors">
                  {nextConcept.shortTitle}
                </p>
              </div>
              <ChevronRight size={16} className="text-muted-foreground/40 group-hover:text-foreground transition-colors shrink-0" />
            </button>
          ) : (
            <div className="flex-1" />
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default ConceptPage;
