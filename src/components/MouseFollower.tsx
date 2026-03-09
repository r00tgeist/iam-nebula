import { useEffect, useState } from "react";
import { motion } from "framer-motion";

const MouseFollower = () => {
  const [pos, setPos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handler = (e: MouseEvent) => setPos({ x: e.clientX, y: e.clientY });
    window.addEventListener("mousemove", handler);
    return () => window.removeEventListener("mousemove", handler);
  }, []);

  return (
    <motion.div
      className="pointer-events-none fixed inset-0 z-[9998]"
      animate={{ background: `radial-gradient(600px circle at ${pos.x}px ${pos.y}px, rgba(0, 229, 255, 0.04), transparent 60%)` }}
      transition={{ type: "tween", duration: 0.15, ease: "linear" }}
    />
  );
};

export default MouseFollower;
