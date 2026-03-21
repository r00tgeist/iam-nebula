import { useEffect, useRef, useCallback } from "react";

const MouseFollower = () => {
  const ref = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number>();
  const posRef = useRef({ x: -9999, y: -9999 });
  const targetRef = useRef({ x: -9999, y: -9999 });
  const activeRef = useRef(false);

  const lerp = useCallback(() => {
    const ease = 0.1;
    const dx = targetRef.current.x - posRef.current.x;
    const dy = targetRef.current.y - posRef.current.y;

    // Stop the loop when close enough (< 0.5px)
    if (Math.abs(dx) < 0.5 && Math.abs(dy) < 0.5) {
      posRef.current.x = targetRef.current.x;
      posRef.current.y = targetRef.current.y;
      if (ref.current) {
        ref.current.style.transform = `translate3d(${posRef.current.x - 300}px, ${posRef.current.y - 300}px, 0)`;
      }
      activeRef.current = false;
      return;
    }

    posRef.current.x += dx * ease;
    posRef.current.y += dy * ease;

    if (ref.current) {
      ref.current.style.transform = `translate3d(${posRef.current.x - 300}px, ${posRef.current.y - 300}px, 0)`;
    }
    rafRef.current = requestAnimationFrame(lerp);
  }, []);

  const startLoop = useCallback(() => {
    if (!activeRef.current) {
      activeRef.current = true;
      rafRef.current = requestAnimationFrame(lerp);
    }
  }, [lerp]);

  useEffect(() => {
    if (window.matchMedia("(pointer: coarse)").matches) return;

    const handler = (e: MouseEvent) => {
      targetRef.current = { x: e.clientX, y: e.clientY };
      startLoop();
    };
    window.addEventListener("mousemove", handler, { passive: true });
    return () => {
      window.removeEventListener("mousemove", handler);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [startLoop]);

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
