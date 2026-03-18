import { useState, useMemo } from "react";
import HeroSection from "@/components/HeroSection";
import ConceptCard from "@/components/ConceptCard";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
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
    <div className="flex min-h-screen flex-col page-enter">
      <Navbar />
      <HeroSection filter={filter} setFilter={setFilter} />

      <section className="mx-auto w-full max-w-7xl flex-1 px-4 pb-16">
        <div className="h-px mx-auto mb-10 max-w-2xl bg-gradient-to-r from-transparent via-[rgba(255,255,255,0.06)] to-transparent" />

        <div className="flex justify-end mb-4">
          <span className="text-xs text-muted-foreground/40 font-mono">
            Showing {filtered.length} of {concepts.length} concepts
          </span>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((concept, i) => (
            <ConceptCard key={concept.id} concept={concept} index={i} />
          ))}
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default GalleryPage;
