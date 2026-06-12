import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import {
  getActivePublicTheme,
  subscribePublicTheme,
  type PublicTheme,
} from "@/lib/publicTheme";

/**
 * Radial-faded dot field — inspired by 21st.dev / shadcn dotted hero blocks.
 */
const DOT_COLORS: Record<PublicTheme, string> = {
  light: "rgba(90, 55, 65, 0.22)",
  blush: "rgba(192, 38, 122, 0.18)",
  lavender: "rgba(123, 104, 166, 0.2)",
  dark: "rgba(232, 175, 193, 0.14)",
};

type HeroDottedRadialBackgroundProps = {
  className?: string;
  dotSize?: number;
  spacing?: number;
};

export function HeroDottedRadialBackground({
  className,
  dotSize = 1,
  spacing = 24,
}: HeroDottedRadialBackgroundProps) {
  const [theme, setTheme] = useState<PublicTheme>("light");

  useEffect(() => {
    setTheme(getActivePublicTheme());
    return subscribePublicTheme(setTheme);
  }, []);

  return (
    <div
      aria-hidden
      className={cn("hero-dotted-radial pointer-events-none absolute inset-0", className)}
      style={{
        backgroundImage: `radial-gradient(circle at 1px 1px, ${DOT_COLORS[theme]} ${dotSize}px, transparent 0)`,
        backgroundSize: `${spacing}px ${spacing}px`,
      }}
    />
  );
}

export default HeroDottedRadialBackground;
