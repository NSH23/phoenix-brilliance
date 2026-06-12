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
      <span className="block text-[1.75rem] font-normal leading-[1.12] tracking-tight text-foreground sm:text-3xl md:text-4xl lg:text-[2.75rem]">
        {line1}
      </span>
      <span
        className={cn(
          "mt-1 block font-serif text-[1.5rem] font-medium italic leading-[1.12] tracking-tight text-primary sm:text-2xl md:mt-1.5 md:text-3xl lg:text-[2.35rem]",
          accentClassName,
        )}
      >
        {accent}
      </span>
    </span>
  );
}

export default HomeSectionSplitTitle;
