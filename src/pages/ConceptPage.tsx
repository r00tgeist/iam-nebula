import { useParams, useNavigate, Link } from "react-router-dom";
import { useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, ArrowRight, HelpCircle, AlertTriangle, Lightbulb } from "lucide-react";
import { concepts } from "@/data/concepts";
import { connections } from "@/data/connections";
import RoadmapDiagram from "@/components/RoadmapDiagram";
import LucideIcon from "@/components/LucideIcon";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { ConceptShowcase, hasShowcase } from "@/components/showcases/index";

const spring = { type: "spring" as const, stiffness: 300, damping: 30 };

const ConceptPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const concept = concepts.find((c) => c.id === id);
  const conceptConnections = connections.find((c) => c.conceptId === id);

  // Scroll to top on concept change
  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [id]);

  if (!concept) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">Concept not found.</p>
      </div>
    );
  }

  const isCyan = concept.category === "basic";
  const showShowcase = id && hasShowcase(id);

  // Prev / Next navigation
  const currentIndex = concepts.findIndex((c) => c.id === id);
  const prev = currentIndex > 0 ? concepts[currentIndex - 1] : null;
  const next = currentIndex < concepts.length - 1 ? concepts[currentIndex + 1] : null;

  return (
    <div className="page-enter flex min-h-screen flex-col">
      <Navbar />

      <div className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">
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

        {/* Interactive Showcase */}
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
          className="mt-16 space-y-8 pb-8"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...spring, delay: showShowcase ? 0.45 : 0.4 }}
        >
          <div>
            <h2 className="font-display text-xl font-bold text-foreground flex items-center gap-2">
              <HelpCircle size={20} className="text-primary" />
              What is it?
            </h2>
            <p className="mt-3 text-muted-foreground leading-relaxed">
              {concept.whatIsIt}
            </p>
          </div>

          <div>
            <h2 className="font-display text-xl font-bold text-foreground flex items-center gap-2">
              <AlertTriangle size={20} className="text-primary" />
              Why it matters
            </h2>
            <p className="mt-3 text-muted-foreground leading-relaxed">
              {concept.whyItMatters}
            </p>
          </div>

          <div className={`glass-card border-l-2 p-5 ${isCyan ? "border-l-primary" : "border-l-secondary"}`}>
            <h3 className={`font-display text-sm font-bold uppercase tracking-wider flex items-center gap-2 ${isCyan ? "text-primary" : "text-secondary"}`}>
              <Lightbulb size={16} />
              Key Takeaway
            </h3>
            <p className="mt-2 text-foreground leading-relaxed">
              {concept.keyTakeaway}
            </p>
          </div>
        </motion.div>

        {/* Prev / Next navigation */}
        <div className="flex items-center justify-between border-t border-border/40 pt-6 pb-4">
          {prev ? (
            <Link
              to={`/concept/${prev.id}`}
              className="flex items-center gap-2 rounded-xl border border-border/40 px-4 py-2.5 text-sm text-muted-foreground transition-colors hover:text-foreground hover:border-border"
            >
              <ArrowLeft size={14} />
              <span className="hidden sm:inline">{prev.shortTitle}</span>
              <span className="sm:hidden">Previous</span>
            </Link>
          ) : (
            <div />
          )}
          {next ? (
            <Link
              to={`/concept/${next.id}`}
              className="flex items-center gap-2 rounded-xl border border-border/40 px-4 py-2.5 text-sm text-muted-foreground transition-colors hover:text-foreground hover:border-border"
            >
              <span className="hidden sm:inline">{next.shortTitle}</span>
              <span className="sm:hidden">Next</span>
              <ArrowRight size={14} />
            </Link>
          ) : (
            <div />
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default ConceptPage;
