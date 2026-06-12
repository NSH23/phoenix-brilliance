import { cn } from "@/lib/utils";

type HomeSectionHeaderProps = {
  id?: string;
  badge: string;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  className?: string;
  headingLevel?: "h1" | "h2";
};

/**
 * Editorial section header — left accent bar, eyebrow, split title, subtitle, divider.
 * Matches Events / Venues page hero typography.
 */
export function HomeSectionHeader({
  id,
  badge,
  title,
  subtitle,
  className,
  headingLevel = "h2",
}: HomeSectionHeaderProps) {
  const Heading = headingLevel;

  return (
    <header className={cn("max-w-3xl", className)}>
      <div className="border-l-[3px] border-primary/75 pl-5 md:pl-6">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-primary">
          {badge}
        </p>
        <Heading
          id={id}
          className="mt-2.5 font-serif text-3xl font-medium leading-[1.12] tracking-tight text-balance md:text-4xl lg:text-[2.65rem] lg:leading-[1.1]"
        >
          {title}
        </Heading>
        {subtitle ? (
          <p className="mt-3 max-w-2xl text-base leading-relaxed text-muted-foreground md:text-[1.05rem] md:leading-7">
            {subtitle}
          </p>
        ) : null}
        <div
          aria-hidden
          className="mt-4 h-px w-16 bg-primary/40 md:mt-5 md:w-20"
        />
      </div>
    </header>
  );
}

export default HomeSectionHeader;
