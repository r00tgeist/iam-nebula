import { useEffect, useRef, useCallback } from "react";

const MouseFollower = () => {
  const ref = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number>();
  const posRef = useRef({ x: 0, y: 0 });
  const targetRef = useRef({ x: 0, y: 0 });

  const lerp = useCallback(() => {
    const ease = 0.12;
    posRef.current.x += (targetRef.current.x - posRef.current.x) * ease;
    posRef.current.y += (targetRef.current.y - posRef.current.y) * ease;

    if (ref.current) {
      ref.current.style.background = `radial-gradient(600px circle at ${posRef.current.x}px ${posRef.current.y}px, rgba(0, 229, 255, 0.04), transparent 60%)`;
    }
    rafRef.current = requestAnimationFrame(lerp);
  }, []);

  useEffect(() => {
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
      className="pointer-events-none fixed inset-0 z-[9998] will-change-[background]"
    />
  );
};

export default MouseFollower;
