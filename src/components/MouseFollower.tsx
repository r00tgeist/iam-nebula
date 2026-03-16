import { useEffect, useRef, useCallback } from "react";

const MouseFollower = () => {
  const ref = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number>();
  const posRef = useRef({ x: -9999, y: -9999 });
  const targetRef = useRef({ x: -9999, y: -9999 });

  const lerp = useCallback(() => {
    const ease = 0.1;
    posRef.current.x += (targetRef.current.x - posRef.current.x) * ease;
    posRef.current.y += (targetRef.current.y - posRef.current.y) * ease;

    if (ref.current) {
      // GPU-composited transform instead of repainting background every frame
      ref.current.style.transform = `translate3d(${posRef.current.x - 300}px, ${posRef.current.y - 300}px, 0)`;
    }
    rafRef.current = requestAnimationFrame(lerp);
  }, []);

  useEffect(() => {
    // Skip entirely on touch devices
    if (window.matchMedia("(pointer: coarse)").matches) return;

    const handler = (e: MouseEvent) => {
      targetRef.current = { x: e.clientX, y: e.clientY };
    };
    window.addEventListener("mousemove", handler, { passive: true });
    rafRef.current = requestAnimationFrame(lerp);
    return () => {
      window.removeEventListener("mousemove", handler);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [lerp]);

  return (
    <div
      ref={ref}
      className="pointer-events-none fixed top-0 left-0 z-[9998]"
      style={{
        width: 600,
        height: 600,
        borderRadius: "50%",
        background: "radial-gradient(circle, rgba(0,229,255,0.04) 0%, transparent 60%)",
        willChange: "transform",
        transform: "translate3d(-9999px, -9999px, 0)",
      }}
    />
  );
};

export default MouseFollower;
