import { cn } from "@/lib/utils";

type SectionSoftBackgroundProps = {
  className?: string;
  variant?: "dots" | "grid";
};

/**
 * Lightweight section backdrop for CTA / feature bands (homepage).
 */
export function SectionSoftBackground({
  className,
  variant = "dots",
}: SectionSoftBackgroundProps) {
  return (
    <div
      aria-hidden
      className={cn(
        "pointer-events-none absolute inset-0 overflow-hidden",
        variant === "dots" ? "section-soft-bg-dots" : "section-soft-bg-grid",
        className,
      )}
    />
  );
}

export default SectionSoftBackground;
