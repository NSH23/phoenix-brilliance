import { cn } from "@/lib/utils";

type HomeSectionSplitTitleProps = {
  line1: string;
  accent: string;
  className?: string;
  accentClassName?: string;
};

export function HomeSectionSplitTitle({
  line1,
  accent,
  className,
  accentClassName,
}: HomeSectionSplitTitleProps) {
  return (
    <span className={cn("block", className)}>
      <span className="block font-light tracking-tight text-foreground/95">{line1}</span>
      <span
        className={cn(
          "mt-0.5 block bg-gradient-to-r from-primary via-primary/90 to-primary/60 bg-clip-text font-medium italic tracking-tight text-transparent md:mt-1",
          accentClassName,
        )}
      >
        {accent}
      </span>
    </span>
  );
}

export default HomeSectionSplitTitle;
