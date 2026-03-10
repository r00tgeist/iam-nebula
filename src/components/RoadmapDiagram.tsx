import { useEffect, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Concept } from "@/data/concepts";
import { ConceptConnections } from "@/data/connections";
import LucideIcon from "@/components/LucideIcon";

const spring = { type: "spring" as const, stiffness: 300, damping: 30 };

interface Props {
  concept: Concept;
  connections: ConceptConnections;
}

const RoadmapDiagram = ({ concept, connections }: Props) => {
  const [activeNode, setActiveNode] = useState<string | null>(null);
  const [visibleLines, setVisibleLines] = useState<number>(0);
  const [showCenter, setShowCenter] = useState(false);

  const isCyan = concept.category === "basic";
  const nodes = connections.nodes;
  const nodeCount = nodes.length;

  useEffect(() => {
    const t1 = setTimeout(() => setShowCenter(true), 100);
    const timers = nodes.map((_, i) =>
      setTimeout(() => setVisibleLines(i + 1), 400 + i * 200)
    );
    return () => {
      clearTimeout(t1);
      timers.forEach(clearTimeout);
    };
  }, [nodes]);

  // Calculate node positions in a circle
  const size = 650;
  const center = size / 2;
  const radius = 220;

  const positions = useMemo(() => {
    return nodes.map((_, i) => {
      const angle = (i / nodeCount) * Math.PI * 2 - Math.PI / 2;
      return {
        x: Math.cos(angle) * radius + center,
        y: Math.sin(angle) * radius + center,
      };
    });
  }, [nodeCount, nodes, radius, center]);

  const centerX = center;
  const centerY = center;

  // Offset: lines connect to icon center, but the div includes the label below.
  // We need to offset the line endpoints to hit the icon center, not the div center.
  const labelOffset = 16; // half the label height roughly

  return (
    <div className="glass-card overflow-hidden p-6">
      <h2 className="font-display text-lg font-bold text-foreground mb-6">
        Connected Concepts &amp; Services
      </h2>

      {/* Desktop SVG diagram */}
      <div className="hidden md:block">
        <div className="relative mx-auto" style={{ width: size, height: size }}>
          <svg width={size} height={size} className="absolute inset-0">
            {nodes.map((node, i) => {
              if (i >= visibleLines) return null;
              const pos = positions[i];
              const isActive = activeNode === node.id;
              return (
                <motion.line
                  key={node.id}
                  x1={centerX}
                  y1={centerY}
                  x2={pos.x}
                  y2={pos.y}
                  stroke={
                    isActive
                      ? isCyan
                        ? "hsl(187 100% 50%)"
                        : "hsl(263 87% 66%)"
                      : "rgba(255,255,255,0.1)"
                  }
                  strokeWidth={isActive ? 2 : 1}
                  strokeDasharray="5 5"
                  className="animate-dash-flow"
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{ pathLength: 1, opacity: 1 }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                />
              );
            })}
          </svg>

          {/* Center node — positioned so the icon center aligns with centerX/centerY */}
          <AnimatePresence>
            {showCenter && (
              <motion.div
                className="absolute flex flex-col items-center"
                style={{
                  left: centerX,
                  top: centerY,
                  x: "-50%",
                  y: "-50%",
                  marginTop: -labelOffset,
                }}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1, y: "-50%" }}
                transition={spring}
              >
                <div
                  className={`flex h-20 w-20 items-center justify-center rounded-full ${
                    isCyan
                      ? "bg-gradient-to-br from-primary/80 to-primary/40 text-primary-foreground glow-cyan-strong"
                      : "bg-gradient-to-br from-secondary/80 to-secondary/40 text-secondary-foreground glow-violet"
                  }`}
                >
                  <LucideIcon name={concept.icon} size={32} />
                </div>
                <span className="font-display mt-2 max-w-[120px] text-center text-xs font-bold text-foreground">
                  {concept.shortTitle}
                </span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Surrounding nodes — icon center aligns with the line endpoint */}
          {nodes.map((node, i) => {
            if (i >= visibleLines) return null;
            const pos = positions[i];
            const isActive = activeNode === node.id;
            return (
              <motion.div
                key={node.id}
                className="absolute flex flex-col items-center"
                style={{
                  left: pos.x,
                  top: pos.y,
                  x: "-50%",
                  y: "-50%",
                  marginTop: -10,
                }}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1, y: "-50%" }}
                transition={{ ...spring, delay: 0.1 }}
                onMouseEnter={() => setActiveNode(node.id)}
                onMouseLeave={() => setActiveNode(null)}
              >
                <div
                  className={`flex h-12 w-12 cursor-pointer items-center justify-center rounded-full border transition-all duration-200 ${
                    isActive
                      ? isCyan
                        ? "border-primary text-primary glow-cyan"
                        : "border-secondary text-secondary glow-violet"
                      : "border-[rgba(255,255,255,0.1)] text-muted-foreground"
                  }`}
                >
                  <LucideIcon name={node.icon} size={18} />
                </div>
                <span
                  className={`mt-1.5 max-w-[90px] text-center text-[10px] font-medium transition-colors ${
                    isActive ? "text-foreground" : "text-muted-foreground"
                  }`}
                >
                  {node.label}
                </span>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Mobile vertical layout */}
      <div className="md:hidden">
        <motion.div
          className="mb-6 flex items-center gap-3"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={spring}
        >
          <div
            className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-full ${
              isCyan
                ? "bg-gradient-to-br from-primary/80 to-primary/40 text-primary-foreground glow-cyan-strong"
                : "bg-gradient-to-br from-secondary/80 to-secondary/40 text-secondary-foreground glow-violet"
            }`}
          >
            <LucideIcon name={concept.icon} size={24} />
          </div>
          <span className="font-display text-sm font-bold text-foreground">
            {concept.shortTitle}
          </span>
        </motion.div>

        <div className="space-y-3 border-l border-[rgba(255,255,255,0.1)] pl-6 ml-7">
          {nodes.map((node, i) => (
            <motion.div
              key={node.id}
              className="flex items-center gap-3"
              initial={{ opacity: 0, x: -15 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ ...spring, delay: 0.3 + i * 0.08 }}
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[rgba(255,255,255,0.1)] text-muted-foreground">
                <LucideIcon name={node.icon} size={14} />
              </div>
              <span className="text-sm text-muted-foreground">{node.label}</span>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default RoadmapDiagram;
