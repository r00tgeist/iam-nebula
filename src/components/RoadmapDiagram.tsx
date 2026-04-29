import { useEffect, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Concept } from "@/data/concepts";
import { ConceptConnections, ConnectionNode } from "@/data/connections";
import LucideIcon from "@/components/LucideIcon";

const spring = { type: "spring" as const, stiffness: 260, damping: 26 };

interface Props {
  concept: Concept;
  connections: ConceptConnections;
}

// Heuristic: classify a node as a Protocol/Standard, a Service/Tool, or a Practice/Control
const classify = (node: ConnectionNode): "protocol" | "service" | "practice" => {
  const protocolIcons = new Set([
    "FileJson", "Globe", "Code", "Hash", "Award", "Tag", "ExternalLink",
  ]);
  const serviceIcons = new Set([
    "Cloud", "Server", "Database", "Cpu", "Monitor", "Smartphone", "Usb",
    "Network", "Bell", "MessageSquare", "Video",
  ]);
  if (protocolIcons.has(node.icon)) return "protocol";
  if (serviceIcons.has(node.icon)) return "service";
  return "practice";
};

const LANE_META = {
  protocol: { label: "Protocols & Standards", short: "Protocols", icon: "FileJson" },
  service:  { label: "Services & Infrastructure", short: "Services", icon: "Server" },
  practice: { label: "Controls & Practices",      short: "Controls", icon: "ShieldCheck" },
} as const;

const LANE_ORDER: Array<keyof typeof LANE_META> = ["protocol", "service", "practice"];

const RoadmapDiagram = ({ concept, connections }: Props) => {
  const [activeNode, setActiveNode] = useState<string | null>(null);
  const [activeLane, setActiveLane] = useState<keyof typeof LANE_META | null>(null);
  const [phase, setPhase] = useState(0); // 0 nothing, 1 source, 2 lanes, 3 nodes, 4 cross-links

  const isCyan = concept.category === "basic";
  const accent = isCyan ? "hsl(187,100%,50%)" : "hsl(263,87%,66%)";
  const accentDim = isCyan ? "rgba(0,229,255,0.12)" : "rgba(139,92,246,0.12)";
  const accentSoft = isCyan ? "rgba(0,229,255,0.4)" : "rgba(139,92,246,0.4)";

  // Group nodes into lanes
  const lanes = useMemo(() => {
    const buckets: Record<string, ConnectionNode[]> = { protocol: [], service: [], practice: [] };
    connections.nodes.forEach((n) => buckets[classify(n)].push(n));
    return buckets as Record<keyof typeof LANE_META, ConnectionNode[]>;
  }, [connections]);

  // Pre-computed cross-links between lanes (visual storytelling: protocol→service, service→practice)
  const crossLinks = useMemo(() => {
    const links: Array<{ from: string; to: string }> = [];
    const protos = lanes.protocol;
    const svcs = lanes.service;
    const prax = lanes.practice;
    // Each protocol connects to first 1-2 services (mod indexed)
    protos.forEach((p, i) => {
      if (svcs.length > 0) links.push({ from: p.id, to: svcs[i % svcs.length].id });
    });
    // Each service connects to a practice
    svcs.forEach((s, i) => {
      if (prax.length > 0) links.push({ from: s.id, to: prax[i % prax.length].id });
    });
    // If no services, hop protocol→practice
    if (svcs.length === 0 && protos.length && prax.length) {
      protos.forEach((p, i) => links.push({ from: p.id, to: prax[i % prax.length].id }));
    }
    return links;
  }, [lanes]);

  useEffect(() => {
    setPhase(0);
    setActiveNode(null);
    setActiveLane(null);
    const t1 = setTimeout(() => setPhase(1), 120);
    const t2 = setTimeout(() => setPhase(2), 450);
    const t3 = setTimeout(() => setPhase(3), 800);
    const t4 = setTimeout(() => setPhase(4), 1500);
    return () => [t1, t2, t3, t4].forEach(clearTimeout);
  }, [concept.id]);

  // Layout (SVG) — minimal, generous spacing
  const W = 920;
  const H = 520;
  const SOURCE_X = 80;
  const SOURCE_Y = H / 2;
  const SOURCE_R = 18;
  const LANE_X = [320, 580, 840];
  // Compact circular nodes with inline label
  const NODE_R = 6;
  const LABEL_OFFSET = 14;
  const LABEL_RIGHT_PAD = 110; // approx label width, used for curve endpoint
  const LANE_HEADER_Y = 46;

  // Position nodes vertically within each lane column
  const layout = useMemo(() => {
    const map: Record<string, { x: number; y: number; lane: keyof typeof LANE_META }> = {};
    LANE_ORDER.forEach((lane, laneIdx) => {
      const items = lanes[lane];
      const x = LANE_X[laneIdx];
      const n = items.length;
      const usableTop = 120;
      const usableBottom = H - 50;
      const span = usableBottom - usableTop;
      items.forEach((item, i) => {
        const y = n === 1 ? (usableTop + usableBottom) / 2 : usableTop + (span * i) / (n - 1);
        map[item.id] = { x, y, lane };
      });
    });
    return map;
  }, [lanes]);

  // Helper: compute a bezier curve path between two points
  const curve = (x1: number, y1: number, x2: number, y2: number, startPad = 0, endPad = NODE_R + 4) => {
    const sx = x1 + startPad;
    const ex = x2 - endPad;
    const dx = ex - sx;
    const cx1 = sx + dx * 0.55;
    const cx2 = ex - dx * 0.55;
    return {
      d: `M ${sx},${y1} C ${cx1},${y1} ${cx2},${y2} ${ex},${y2}`,
      sx, sy: y1, ex, ey: y2,
    };
  };

  const isLaneHighlighted = (lane: keyof typeof LANE_META) => {
    if (activeNode) return layout[activeNode]?.lane === lane;
    return activeLane === lane;
  };

  // Determine which nodes / links are highlighted
  const highlightedNodes = useMemo(() => {
    const set = new Set<string>();
    if (activeNode) {
      set.add(activeNode);
      crossLinks.forEach((l) => {
        if (l.from === activeNode) set.add(l.to);
        if (l.to === activeNode) set.add(l.from);
      });
    }
    return set;
  }, [activeNode, crossLinks]);

  const isLinkActive = (from: string, to: string) =>
    !!activeNode && (from === activeNode || to === activeNode);

  return (
    <div className="glass-card overflow-hidden p-6">
      <div className="flex items-start justify-between gap-4 mb-2 flex-wrap">
        <div>
          <h2 className="font-display text-lg font-bold text-foreground">
            Connected Concepts & Services
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            How <span className={isCyan ? "text-primary" : "text-secondary"}>{concept.shortTitle}</span> flows through{" "}
            <span className="text-foreground/80">protocols</span>,{" "}
            <span className="text-foreground/80">services</span>, and{" "}
            <span className="text-foreground/80">controls</span>.
          </p>
        </div>
        {/* Legend */}
        <div className="hidden sm:flex items-center gap-4 text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
          {LANE_ORDER.map((lane) => (
            <button
              key={lane}
              onMouseEnter={() => setActiveLane(lane)}
              onMouseLeave={() => setActiveLane(null)}
              className="flex items-center gap-1.5 hover:text-foreground transition-colors"
            >
              <span
                className="inline-block h-2 w-2 rounded-full"
                style={{ background: accent, opacity: isLaneHighlighted(lane) ? 1 : 0.4 }}
              />
              {LANE_META[lane].short}
            </button>
          ))}
        </div>
      </div>

      {/* ── Desktop: layered graph ── */}
      <div className="hidden md:block">
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto">
          <defs>
            {/* Arrow marker */}
            <marker
              id={`arrow-${concept.id}`}
              viewBox="0 0 10 10"
              refX="8" refY="5"
              markerWidth="6" markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M0,0 L10,5 L0,10 z" fill={accent} fillOpacity="0.65" />
            </marker>
            <marker
              id={`arrow-active-${concept.id}`}
              viewBox="0 0 10 10"
              refX="8" refY="5"
              markerWidth="7" markerHeight="7"
              orient="auto-start-reverse"
            >
              <path d="M0,0 L10,5 L0,10 z" fill={accent} />
            </marker>
            <marker
              id={`arrow-dim-${concept.id}`}
              viewBox="0 0 10 10"
              refX="8" refY="5"
              markerWidth="5" markerHeight="5"
              orient="auto-start-reverse"
            >
              <path d="M0,0 L10,5 L0,10 z" fill="rgba(255,255,255,0.18)" />
            </marker>
            <radialGradient id={`src-grad-${concept.id}`} cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor={accent} stopOpacity="0.35" />
              <stop offset="100%" stopColor={accent} stopOpacity="0" />
            </radialGradient>
            <linearGradient id={`flow-${concept.id}`} x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor={accent} stopOpacity="0" />
              <stop offset="50%" stopColor={accent} stopOpacity="0.9" />
              <stop offset="100%" stopColor={accent} stopOpacity="0" />
            </linearGradient>
            {/* Pill node background gradient — subtle top-to-bottom depth */}
            <linearGradient id={`node-bg-${concept.id}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="hsl(240, 18%, 13%)" />
              <stop offset="100%" stopColor="hsl(240, 22%, 8%)" />
            </linearGradient>
            {/* Source orb gradient */}
            <radialGradient id={`source-orb-${concept.id}`} cx="35%" cy="30%" r="80%">
              <stop offset="0%" stopColor={accent} stopOpacity="0.55" />
              <stop offset="60%" stopColor={accent} stopOpacity="0.18" />
              <stop offset="100%" stopColor={accent} stopOpacity="0.05" />
            </radialGradient>
            {/* Background dot pattern */}
            <pattern id={`dots-${concept.id}`} x="0" y="0" width="24" height="24" patternUnits="userSpaceOnUse">
              <circle cx="1" cy="1" r="0.8" fill="rgba(255,255,255,0.04)" />
            </pattern>
            {/* Glow filter for flowing dots */}
            <filter id={`glow-${concept.id}`} x="-200%" y="-200%" width="500%" height="500%">
              <feGaussianBlur stdDeviation="2.5" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <filter id={`glow-strong-${concept.id}`} x="-200%" y="-200%" width="500%" height="500%">
              <feGaussianBlur stdDeviation="4.5" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Background dots */}
          <rect x="0" y="0" width={W} height={H} fill={`url(#dots-${concept.id})`} />

          {/* Lane headers — minimal label + thin guide */}
          {LANE_ORDER.map((lane, idx) => {
            const x = LANE_X[idx];
            const meta = LANE_META[lane];
            const highlighted = isLaneHighlighted(lane);
            const count = lanes[lane].length;
            if (count === 0) return null;
            return (
              <motion.g
                key={`lane-${lane}`}
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: phase >= 2 ? 1 : 0, y: phase >= 2 ? 0 : -6 }}
                transition={{ duration: 0.5, delay: 0.08 * idx, ease: [0.22, 1, 0.36, 1] }}
              >
                {/* Vertical guide line */}
                <line
                  x1={x} y1={LANE_HEADER_Y + 14}
                  x2={x} y2={H - 30}
                  stroke={highlighted ? accentSoft : "rgba(255,255,255,0.05)"}
                  strokeWidth="1"
                  style={{ transition: "stroke 0.3s" }}
                />
                {/* Header marker dot */}
                <circle
                  cx={x} cy={LANE_HEADER_Y}
                  r={2.5}
                  fill={highlighted ? accent : "rgba(255,255,255,0.4)"}
                  style={{ transition: "fill 0.3s" }}
                />
                {/* Label */}
                <text
                  x={x + 10} y={LANE_HEADER_Y + 4}
                  className="text-[10px] font-mono uppercase"
                  fill={highlighted ? accent : "rgba(255,255,255,0.55)"}
                  style={{ transition: "fill 0.3s", letterSpacing: "0.18em" }}
                >
                  {meta.short}
                </text>
                {/* Count */}
                <text
                  x={x + 10} y={LANE_HEADER_Y + 18}
                  className="text-[9px] font-mono"
                  fill="rgba(255,255,255,0.3)"
                >
                  {String(count).padStart(2, "0")}
                </text>
              </motion.g>
            );
          })}

          {/* ── Source → first lane primary connections (curved) ── */}
          {phase >= 3 && LANE_ORDER.map((lane) => {
            const items = lanes[lane];
            return items.map((item, i) => {
              if (lane !== "protocol") return null;
              const pos = layout[item.id];
              const c = curve(SOURCE_X, SOURCE_Y, pos.x, pos.y, SOURCE_R + 6, NODE_R + 6);
              const active = activeNode === item.id;
              const dimmed = activeNode !== null && !active;
              const pathId = `srcpath-${concept.id}-${item.id}`;
              return (
                <g key={`src-${item.id}`}>
                  {/* Underglow */}
                  <path
                    d={c.d}
                    fill="none"
                    stroke={accent}
                    strokeWidth={active ? 6 : 3.5}
                    strokeOpacity={dimmed ? 0.04 : active ? 0.55 : 0.22}
                    strokeLinecap="round"
                    filter={`url(#glow-${active ? "strong-" : ""}${concept.id})`}
                    style={{ transition: "stroke-opacity 0.25s, stroke-width 0.25s" }}
                  />
                  {/* Main dashed flowing path */}
                  <motion.path
                    id={pathId}
                    d={c.d}
                    fill="none"
                    stroke={active ? accent : accentSoft}
                    strokeWidth={active ? 1.8 : 1.1}
                    strokeOpacity={dimmed ? 0.15 : active ? 1 : 0.7}
                    strokeDasharray="6 5"
                    strokeLinecap="round"
                    initial={{ pathLength: 0, opacity: 0 }}
                    animate={{
                      pathLength: 1,
                      opacity: 1,
                      strokeDashoffset: [0, -22],
                    }}
                    transition={{
                      pathLength: { duration: 0.7, delay: 0.05 * i, ease: "easeOut" },
                      opacity: { duration: 0.4, delay: 0.05 * i },
                      strokeDashoffset: {
                        duration: active ? 0.9 : 1.8,
                        repeat: Infinity,
                        ease: "linear",
                      },
                    }}
                    style={{ transition: "stroke 0.25s, stroke-width 0.25s, stroke-opacity 0.25s" }}
                  />
                  {/* Glowing dot traveling along the curve */}
                  {[0, 0.5].map((offset) => (
                    <circle
                      key={`dot-${item.id}-${offset}`}
                      r={active ? 3.4 : 2.4}
                      fill={accent}
                      fillOpacity={dimmed ? 0.2 : 1}
                      filter={`url(#glow-${active ? "strong-" : ""}${concept.id})`}
                    >
                      <animateMotion
                        dur={`${active ? 1.6 : 2.8}s`}
                        repeatCount="indefinite"
                        begin={`${offset * (active ? 1.6 : 2.8)}s`}
                        keyPoints="0;1"
                        keyTimes="0;1"
                        calcMode="linear"
                      >
                        <mpath href={`#${pathId}`} />
                      </animateMotion>
                    </circle>
                  ))}
                </g>
              );
            });
          })}

          {/* If no protocols, draw source → services directly */}
          {phase >= 3 && lanes.protocol.length === 0 && lanes.service.map((item, i) => {
            const pos = layout[item.id];
            const c = curve(SOURCE_X, SOURCE_Y, pos.x, pos.y, SOURCE_R + 6, NODE_R + 6);
            return (
              <motion.path
                key={`srcs-${item.id}`}
                d={c.d}
                fill="none"
                stroke={accentSoft}
                strokeWidth="1.2"
                strokeOpacity="0.6"
                strokeDasharray="6 5"
                strokeLinecap="round"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1, strokeDashoffset: [0, -22] }}
                transition={{
                  pathLength: { duration: 0.7, delay: 0.05 * i },
                  opacity: { duration: 0.4, delay: 0.05 * i },
                  strokeDashoffset: { duration: 1.8, repeat: Infinity, ease: "linear" },
                }}
              />
            );
          })}

          {/* If no services & no protocols, source → practices */}
          {phase >= 3 && lanes.protocol.length === 0 && lanes.service.length === 0 && lanes.practice.map((item, i) => {
            const pos = layout[item.id];
            const c = curve(SOURCE_X, SOURCE_Y, pos.x, pos.y, SOURCE_R + 6, NODE_R + 6);
            return (
              <motion.path
                key={`srcp-${item.id}`}
                d={c.d}
                fill="none"
                stroke={accentSoft}
                strokeWidth="1.2"
                strokeDasharray="6 5"
                strokeLinecap="round"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1, strokeDashoffset: [0, -22] }}
                transition={{
                  pathLength: { duration: 0.7, delay: 0.05 * i },
                  opacity: { duration: 0.4, delay: 0.05 * i },
                  strokeDashoffset: { duration: 1.8, repeat: Infinity, ease: "linear" },
                }}
              />
            );
          })}

          {/* ── Cross-lane curved connections ── */}
          {phase >= 4 && crossLinks.map((link, i) => {
            const from = layout[link.from];
            const to = layout[link.to];
            if (!from || !to) return null;
            const active = isLinkActive(link.from, link.to);
            const dimmed = activeNode !== null && !active;
            const c = curve(from.x, from.y, to.x, to.y, NODE_R + 4, NODE_R + 6);
            const pathId = `xpath-${concept.id}-${i}`;
            return (
              <g key={`xl-${i}`}>
                {/* Underglow */}
                <path
                  d={c.d}
                  fill="none"
                  stroke={accent}
                  strokeWidth={active ? 5 : 2.5}
                  strokeOpacity={dimmed ? 0.03 : active ? 0.5 : 0.15}
                  strokeLinecap="round"
                  filter={`url(#glow-${active ? "strong-" : ""}${concept.id})`}
                  style={{ transition: "stroke-opacity 0.25s, stroke-width 0.25s" }}
                />
                <motion.path
                  id={pathId}
                  d={c.d}
                  fill="none"
                  stroke={active ? accent : accentSoft}
                  strokeWidth={active ? 1.6 : 0.9}
                  strokeDasharray="4 5"
                  strokeLinecap="round"
                  strokeOpacity={dimmed ? 0.12 : active ? 1 : 0.7}
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{
                    pathLength: 1,
                    opacity: 1,
                    strokeDashoffset: [0, -18],
                  }}
                  transition={{
                    pathLength: { duration: 0.5, delay: 0.03 * i },
                    opacity: { duration: 0.4, delay: 0.03 * i },
                    strokeDashoffset: {
                      duration: active ? 1.0 : 2.2,
                      repeat: Infinity,
                      ease: "linear",
                    },
                  }}
                  style={{ transition: "stroke 0.25s, stroke-width 0.25s, stroke-opacity 0.25s" }}
                />
                {/* Glowing dot along curve */}
                <circle
                  r={active ? 3 : 2}
                  fill={accent}
                  fillOpacity={dimmed ? 0.2 : 1}
                  filter={`url(#glow-${active ? "strong-" : ""}${concept.id})`}
                >
                  <animateMotion
                    dur={`${active ? 1.5 : 3}s`}
                    repeatCount="indefinite"
                    begin={`${0.2 * (i % 5)}s`}
                    keyPoints="0;1"
                    keyTimes="0;1"
                    calcMode="linear"
                  >
                    <mpath href={`#${pathId}`} />
                  </animateMotion>
                </circle>
              </g>
            );
          })}

          {/* ── Source node — minimalist ── */}
          <AnimatePresence>
            {phase >= 1 && (
              <motion.g
                initial={{ opacity: 0, scale: 0.85 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              >
                {/* Soft pulse ring */}
                <motion.circle
                  cx={SOURCE_X} cy={SOURCE_Y}
                  r={SOURCE_R}
                  fill="none"
                  stroke={accent}
                  strokeWidth="1"
                  initial={{ r: SOURCE_R, opacity: 0.5 }}
                  animate={{ r: SOURCE_R + 16, opacity: 0 }}
                  transition={{ duration: 2.2, repeat: Infinity, ease: "easeOut" }}
                />
                {/* Outer hairline ring */}
                <circle
                  cx={SOURCE_X} cy={SOURCE_Y} r={SOURCE_R + 6}
                  fill="none"
                  stroke={accent}
                  strokeOpacity="0.25"
                  strokeWidth="1"
                />
                {/* Main disc */}
                <circle
                  cx={SOURCE_X} cy={SOURCE_Y} r={SOURCE_R}
                  fill="hsl(var(--background))"
                  stroke={accent}
                  strokeWidth="1.2"
                />
                {/* Center icon */}
                <foreignObject x={SOURCE_X - 11} y={SOURCE_Y - 11} width={22} height={22}>
                  <div className="flex h-full w-full items-center justify-center">
                    <div className={isCyan ? "text-primary" : "text-secondary"}>
                      <LucideIcon name={concept.icon} size={16} />
                    </div>
                  </div>
                </foreignObject>
                {/* Label below */}
                <text
                  x={SOURCE_X} y={SOURCE_Y + SOURCE_R + 22}
                  textAnchor="middle"
                  className="fill-foreground text-[12px]"
                  style={{ fontFamily: "'Syne', sans-serif", fontWeight: 600 }}
                >
                  {concept.shortTitle}
                </text>
                <text
                  x={SOURCE_X} y={SOURCE_Y + SOURCE_R + 36}
                  textAnchor="middle"
                  className="text-[8px] font-mono uppercase"
                  fill="rgba(255,255,255,0.4)"
                  style={{ letterSpacing: "0.22em" }}
                >
                  Source
                </text>
              </motion.g>
            )}
          </AnimatePresence>

          {/* ── Lane nodes ── */}
          {phase >= 3 && LANE_ORDER.flatMap((lane, laneIdx) =>
            lanes[lane].map((node, i) => {
              const pos = layout[node.id];
              const isActive = activeNode === node.id;
              const isLinked = highlightedNodes.has(node.id) && !isActive;
              const isDimmed = activeNode !== null && !isActive && !isLinked;
              return (
                <motion.g
                  key={node.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{
                    opacity: isDimmed ? 0.25 : 1,
                    x: 0,
                  }}
                  transition={{ duration: 0.5, delay: 0.05 * (laneIdx * 2 + i), ease: [0.22, 1, 0.36, 1] }}
                  onMouseEnter={() => setActiveNode(node.id)}
                  onMouseLeave={() => setActiveNode(null)}
                  className="cursor-pointer"
                >
                  {/* Soft pulse ring on active */}
                  {isActive && (
                    <motion.circle
                      cx={pos.x} cy={pos.y}
                      r={NODE_R}
                      fill="none"
                      stroke={accent}
                      strokeWidth="1"
                      initial={{ r: NODE_R, opacity: 0.6 }}
                      animate={{ r: NODE_R + 10, opacity: 0 }}
                      transition={{ duration: 1.4, repeat: Infinity, ease: "easeOut" }}
                    />
                  )}
                  {/* Outer ring for active/linked */}
                  <circle
                    cx={pos.x} cy={pos.y} r={NODE_R + 3}
                    fill="none"
                    stroke={isActive ? accent : isLinked ? accentSoft : "transparent"}
                    strokeWidth="1"
                    style={{ transition: "stroke 0.25s" }}
                  />
                  {/* Node dot */}
                  <circle
                    cx={pos.x} cy={pos.y} r={NODE_R}
                    fill={isActive || isLinked ? accent : "hsl(var(--background))"}
                    stroke={isActive || isLinked ? accent : "rgba(255,255,255,0.35)"}
                    strokeWidth="1"
                    style={{ transition: "all 0.25s" }}
                  />
                  {/* Inline label */}
                  <text
                    x={pos.x + LABEL_OFFSET} y={pos.y + 4}
                    className="text-[11px]"
                    fill={isActive || isLinked ? "hsl(var(--foreground))" : "rgba(255,255,255,0.55)"}
                    style={{
                      fontFamily: "'IBM Plex Sans', sans-serif",
                      fontWeight: isActive ? 600 : 400,
                      letterSpacing: "0.01em",
                      transition: "fill 0.25s",
                    }}
                  >
                    {node.label}
                  </text>
                </motion.g>
              );
            })
          )}
        </svg>

        {/* Hint */}
        <p className="text-center text-[10px] font-mono text-muted-foreground/40 mt-2 uppercase tracking-wider">
          Live flow • Hover any node to focus its path
        </p>
      </div>

      {/* ── Mobile: stacked lanes with arrows ── */}
      <div className="md:hidden mt-2">
        {/* Source */}
        <motion.div
          className="mb-4 flex items-center gap-3"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={spring}
        >
          <div
            className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full ${
              isCyan
                ? "bg-gradient-to-br from-primary/80 to-primary/40 text-primary-foreground glow-cyan-strong"
                : "bg-gradient-to-br from-secondary/80 to-secondary/40 text-secondary-foreground glow-violet"
            }`}
          >
            <LucideIcon name={concept.icon} size={22} />
          </div>
          <div>
            <span className="font-display text-sm font-bold text-foreground">
              {concept.shortTitle}
            </span>
            <p className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground/60">
              Source concept
            </p>
          </div>
        </motion.div>

        {LANE_ORDER.map((lane) => {
          const items = lanes[lane];
          if (items.length === 0) return null;
          const meta = LANE_META[lane];
          return (
            <div key={lane} className="mb-5">
              {/* Lane header with arrow */}
              <div className="flex items-center gap-2 mb-2 pl-1">
                <div className="flex items-center gap-1.5">
                  <div
                    className="h-2 w-2 rounded-full"
                    style={{ background: accent }}
                  />
                  <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                    {meta.short}
                  </span>
                </div>
                <div className="flex-1 h-px" style={{ background: `linear-gradient(to right, ${accentSoft}, transparent)` }} />
                <span className="text-[10px] font-mono text-muted-foreground/50">
                  {items.length}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {items.map((node, i) => {
                  const isActive = activeNode === node.id;
                  return (
                    <motion.div
                      key={node.id}
                      className={`flex items-center gap-2.5 rounded-xl border p-2.5 transition-colors ${
                        isActive
                          ? isCyan
                            ? "border-primary/30 bg-primary/[0.05]"
                            : "border-secondary/30 bg-secondary/[0.05]"
                          : "border-[rgba(255,255,255,0.06)]"
                      }`}
                      initial={{ opacity: 0, x: -6 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ ...spring, delay: 0.04 * i }}
                      onTouchStart={() => setActiveNode(node.id)}
                      onTouchEnd={() => setActiveNode(null)}
                    >
                      <div
                        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border ${
                          isActive
                            ? isCyan
                              ? "border-primary/30 text-primary bg-primary/10"
                              : "border-secondary/30 text-secondary bg-secondary/10"
                            : "border-[rgba(255,255,255,0.06)] text-muted-foreground bg-card/40"
                        }`}
                      >
                        <LucideIcon name={node.icon} size={13} />
                      </div>
                      <span
                        className={`text-[11px] font-medium leading-tight ${
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
          );
        })}
      </div>
    </div>
  );
};

export default RoadmapDiagram;
