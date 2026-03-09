import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import HeroSection from "@/components/HeroSection";
import ConceptCard from "@/components/ConceptCard";
import { concepts } from "@/data/concepts";

const GalleryPage = () => {
  const [filter, setFilter] = useState<"all" | "basic" | "advanced">("all");

  const filtered = useMemo(
    () =>
      filter === "all"
        ? concepts
        : concepts.filter((c) => c.category === filter),
    [filter]
  );

  return (
    <div className="min-h-screen">
      <HeroSection filter={filter} setFilter={setFilter} />

      <section className="mx-auto max-w-7xl px-4 pb-24">
        <motion.div
          layout
          className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3"
        >
          <AnimatePresence mode="popLayout">
            {filtered.map((concept, i) => (
              <ConceptCard key={concept.id} concept={concept} index={i} />
            ))}
          </AnimatePresence>
        </motion.div>
      </section>
    </div>
  );
};

export default GalleryPage;
