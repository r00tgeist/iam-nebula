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
  const [visibleCount, setVisibleCount] = useState(0);
  const [showCenter, setShowCenter] = useState(false);

  const isCyan = concept.category === "basic";
  const nodes = connections.nodes;
  const count = nodes.length;

  useEffect(() => {
    setShowCenter(false);
    setVisibleCount(0);
    const t1 = setTimeout(() => setShowCenter(true), 150);
    const timers = nodes.map((_, i) =>
      setTimeout(() => setVisibleCount(i + 1), 500 + i * 150)
    );
    return () => {
      clearTimeout(t1);
      timers.forEach(clearTimeout);
    };
  }, [concept.id, nodes]);

  // Compute positions on a circle — responsive via viewBox
  const SIZE = 700;
  const CX = SIZE / 2;
  const CY = SIZE / 2;
  const RADIUS = 260;
  const CENTER_R = 44;
  const NODE_R = 28;

  const positions = useMemo(() => {
    return nodes.map((_, i) => {
      const angle = (i / count) * Math.PI * 2 - Math.PI / 2;
      return {
        x: Math.cos(angle) * RADIUS + CX,
        y: Math.sin(angle) * RADIUS + CY,
      };
    });
  }, [count, nodes]);

  const accentColor = isCyan ? "hsl(187,100%,50%)" : "hsl(263,87%,66%)";
  const accentColorDim = isCyan ? "rgba(0,229,255,0.12)" : "rgba(139,92,246,0.12)";
  const accentGlow = isCyan ? "rgba(0,229,255,0.25)" : "rgba(139,92,246,0.25)";

  return (
    <div className="glass-card overflow-hidden p-6">
      <h2 className="font-display text-lg font-bold text-foreground mb-2">
        Connected Concepts & Services
      </h2>
      <p className="text-sm text-muted-foreground mb-6">
        Hover over any node to highlight its connection to{" "}
        <span className={isCyan ? "text-primary" : "text-secondary"}>{concept.shortTitle}</span>.
      </p>

      {/* ── Desktop: SVG diagram ── */}
      <div className="hidden md:flex justify-center">
        <div className="w-full" style={{ maxWidth: 700 }}>
          <svg
            viewBox={`0 0 ${SIZE} ${SIZE}`}
            className="w-full h-auto"
          >
            <defs>
              {/* Glow filter for active lines */}
              <filter id="line-glow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
              {/* Gradient for center node */}
              <radialGradient id="center-grad" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor={accentColor} stopOpacity="0.3" />
                <stop offset="100%" stopColor={accentColor} stopOpacity="0.05" />
              </radialGradient>
              {/* Animated dash pattern */}
              <pattern id="dash-pattern" patternUnits="userSpaceOnUse" width="12" height="1">
                <line x1="0" y1="0.5" x2="6" y2="0.5" stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
              </pattern>
            </defs>

            {/* ── Connection lines ── */}
            {nodes.map((node, i) => {
              if (i >= visibleCount) return null;
              const pos = positions[i];
              const isNodeActive = activeNode === node.id;

              // Shorten line so it doesn't overlap icons
              const dx = pos.x - CX;
              const dy = pos.y - CY;
              const dist = Math.sqrt(dx * dx + dy * dy);
              const ux = dx / dist;
              const uy = dy / dist;
              const x1 = CX + ux * (CENTER_R + 6);
              const y1 = CY + uy * (CENTER_R + 6);
              const x2 = pos.x - ux * (NODE_R + 6);
              const y2 = pos.y - uy * (NODE_R + 6);

              return (
                <g key={`line-${node.id}`}>
                  {/* Background dashed line */}
                  <motion.line
                    x1={x1} y1={y1} x2={x2} y2={y2}
                    stroke="rgba(255,255,255,0.06)"
                    strokeWidth="1"
                    strokeDasharray="6 6"
                    initial={{ pathLength: 0, opacity: 0 }}
                    animate={{ pathLength: 1, opacity: 1 }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                  />
                  {/* Active highlight line */}
                  <motion.line
                    x1={x1} y1={y1} x2={x2} y2={y2}
                    stroke={accentColor}
                    strokeWidth={isNodeActive ? 2 : 0}
                    initial={false}
                    animate={{
                      strokeWidth: isNodeActive ? 2 : 0,
                      opacity: isNodeActive ? 1 : 0,
                    }}
                    transition={{ duration: 0.25 }}
                    filter={isNodeActive ? "url(#line-glow)" : undefined}
                  />
                  {/* Flowing dot on active */}
                  {isNodeActive && (
                    <motion.circle
                      r="2.5"
                      fill={accentColor}
                      initial={{ offsetDistance: "0%" }}
                      animate={{ cx: [x1, x2], cy: [y1, y2] }}
                      transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                    />
                  )}
                </g>
              );
            })}

            {/* ── Center node ── */}
            <AnimatePresence>
              {showCenter && (
                <motion.g
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={spring}
                  style={{ transformOrigin: `${CX}px ${CY}px` }}
                >
                  {/* Outer glow ring */}
                  <circle cx={CX} cy={CY} r={CENTER_R + 18} fill="url(#center-grad)" />
                  {/* Pulse ring */}
                  <motion.circle
                    cx={CX} cy={CY} r={CENTER_R + 4}
                    fill="none"
                    stroke={accentColor}
                    strokeWidth="1"
                    strokeOpacity="0.2"
                    initial={{ r: CENTER_R + 4, opacity: 0.3 }}
                    animate={{ r: CENTER_R + 24, opacity: 0 }}
                    transition={{ duration: 2.5, repeat: Infinity, ease: "easeOut" }}
                  />
                  {/* Main circle */}
                  <circle
                    cx={CX} cy={CY} r={CENTER_R}
                    fill={isCyan ? "rgba(0,229,255,0.15)" : "rgba(139,92,246,0.15)"}
                    stroke={accentColor}
                    strokeWidth="1.5"
                    strokeOpacity="0.5"
                  />
                </motion.g>
              )}
            </AnimatePresence>

            {/* Center icon + label (foreignObject for Lucide) */}
            {showCenter && (
              <foreignObject x={CX - 40} y={CY - 40} width={80} height={80}>
                <div className="flex h-full w-full items-center justify-center">
                  <div className={isCyan ? "text-primary" : "text-secondary"}>
                    <LucideIcon name={concept.icon} size={30} />
                  </div>
                </div>
              </foreignObject>
            )}
            {showCenter && (
              <text
                x={CX} y={CY + CENTER_R + 20}
                textAnchor="middle"
                className="fill-foreground text-[13px] font-bold"
                style={{ fontFamily: "'Syne', sans-serif" }}
              >
                {concept.shortTitle}
              </text>
            )}

            {/* ── Surrounding nodes ── */}
            {nodes.map((node, i) => {
              if (i >= visibleCount) return null;
              const pos = positions[i];
              const isNodeActive = activeNode === node.id;

              return (
                <motion.g
                  key={node.id}
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ ...spring, delay: 0.05 }}
                  style={{ transformOrigin: `${pos.x}px ${pos.y}px` }}
                  onMouseEnter={() => setActiveNode(node.id)}
                  onMouseLeave={() => setActiveNode(null)}
                  className="cursor-pointer"
                >
                  {/* Hover glow */}
                  <motion.circle
                    cx={pos.x} cy={pos.y} r={NODE_R + 8}
                    fill={accentColorDim}
                    initial={false}
                    animate={{ opacity: isNodeActive ? 1 : 0, r: isNodeActive ? NODE_R + 10 : NODE_R + 4 }}
                    transition={{ duration: 0.2 }}
                  />
                  {/* Circle */}
                  <motion.circle
                    cx={pos.x} cy={pos.y} r={NODE_R}
                    fill="hsl(var(--card))"
                    stroke={isNodeActive ? accentColor : "rgba(255,255,255,0.08)"}
                    strokeWidth={isNodeActive ? 1.5 : 1}
                    initial={false}
                    animate={{
                      stroke: isNodeActive ? accentColor : "rgba(255,255,255,0.08)",
                    }}
                    transition={{ duration: 0.2 }}
                  />
                  {/* Icon via foreignObject */}
                  <foreignObject x={pos.x - 14} y={pos.y - 14} width={28} height={28}>
                    <div className={`flex h-full w-full items-center justify-center transition-colors duration-200 ${isNodeActive ? (isCyan ? "text-primary" : "text-secondary") : "text-muted-foreground"}`}>
                      <LucideIcon name={node.icon} size={16} />
                    </div>
                  </foreignObject>
                  {/* Label */}
                  <text
                    x={pos.x} y={pos.y + NODE_R + 16}
                    textAnchor="middle"
                    className={`text-[11px] transition-colors duration-200 ${isNodeActive ? "fill-foreground font-semibold" : "fill-[hsl(var(--muted-foreground))]"}`}
                    style={{ fontFamily: "'IBM Plex Sans', sans-serif" }}
                  >
                    {node.label}
                  </text>
                </motion.g>
              );
            })}
          </svg>
        </div>
      </div>

      {/* ── Mobile: vertical list ── */}
      <div className="md:hidden">
        {/* Center node */}
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
          <div>
            <span className="font-display text-sm font-bold text-foreground">
              {concept.shortTitle}
            </span>
            <p className="text-[11px] text-muted-foreground">{count} connected concepts</p>
          </div>
        </motion.div>

        <div className="grid grid-cols-2 gap-2">
          {nodes.map((node, i) => (
            <motion.div
              key={node.id}
              className={`flex items-center gap-3 rounded-xl border p-3 transition-colors duration-200 ${
                activeNode === node.id
                  ? isCyan
                    ? "border-primary/30 bg-primary/[0.04]"
                    : "border-secondary/30 bg-secondary/[0.04]"
                  : "border-[rgba(255,255,255,0.06)] bg-transparent"
              }`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...spring, delay: 0.2 + i * 0.05 }}
              onTouchStart={() => setActiveNode(node.id)}
              onTouchEnd={() => setActiveNode(null)}
            >
              <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border transition-colors duration-200 ${
                activeNode === node.id
                  ? isCyan
                    ? "border-primary/30 text-primary bg-primary/10"
                    : "border-secondary/30 text-secondary bg-secondary/10"
                  : "border-[rgba(255,255,255,0.06)] text-muted-foreground bg-card/40"
              }`}>
                <LucideIcon name={node.icon} size={15} />
              </div>
              <span className={`text-xs font-medium transition-colors ${activeNode === node.id ? "text-foreground" : "text-muted-foreground"}`}>
                {node.label}
              </span>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default RoadmapDiagram;
