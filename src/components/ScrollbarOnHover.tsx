import { useEffect } from "react";

const EDGE_WIDTH = 28;

/**
 * Adds/removes class on document.documentElement when the mouse is near the
 * right edge so the scrollbar can be shown only on hover there.
 */
export default function ScrollbarOnHover() {
  useEffect(() => {
    const el = document.documentElement;

    const handleMove = (e: MouseEvent) => {
      const nearRight = e.clientX >= window.innerWidth - EDGE_WIDTH;
      if (nearRight) {
        el.classList.add("scrollbar-visible");
      } else {
        el.classList.remove("scrollbar-visible");
      }
    };

    const handleLeave = () => {
      el.classList.remove("scrollbar-visible");
    };

    document.addEventListener("mousemove", handleMove, { passive: true });
    document.addEventListener("mouseleave", handleLeave, { passive: true });
    return () => {
      document.removeEventListener("mousemove", handleMove);
      document.removeEventListener("mouseleave", handleLeave);
      el.classList.remove("scrollbar-visible");
    };
  }, []);

  return null;
}
