import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

type HomeSectionShellProps = {
  id?: string;
  ariaLabelledBy?: string;
  badge: string;
  title: React.ReactNode;
  /** Optional single short line under the title — not a side-column blurb */
  subtitle?: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  contentClassName?: string;
  headerClassName?: string;
  /** Wrap content in a glass panel for richer visual density */
  contentPanel?: boolean;
  contentPanelClassName?: string;
  /** Edge-to-edge band: header + content connect to screen sides (like venues carousel) */
  fullBleed?: boolean;
};

function SectionBadge({ label }: { label: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.45, ease: "easeOut" }}
      className="mb-3 inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/[0.08] px-3.5 py-1.5 shadow-sm"
    >
      <motion.span
        aria-hidden
        className="h-1.5 w-1.5 shrink-0 rounded-full bg-primary"
        animate={{ scale: [1, 1.35, 1], opacity: [0.85, 1, 0.85] }}
        transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
      />
      <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-primary md:text-xs">
        {label}
      </span>
    </motion.div>
  );
}

export function HomeSectionShell({
  id,
  ariaLabelledBy,
  badge,
  title,
  subtitle,
  description,
  action,
  children,
  className,
  contentClassName,
  headerClassName,
  contentPanel = false,
  contentPanelClassName,
  fullBleed = false,
}: HomeSectionShellProps) {
  const hasSideColumn = Boolean(description) || Boolean(action);

  const contentInner = contentPanel ? (
    <div className={cn(!fullBleed && "mx-auto max-w-7xl px-5 sm:px-6 md:px-8 lg:px-10")}>
      <div
        className={cn(
          "border border-border/60 bg-white/65 shadow-[0_8px_40px_rgba(0,0,0,0.06)] backdrop-blur-xl dark:border-white/10 dark:bg-card/75 dark:shadow-[0_8px_40px_rgba(0,0,0,0.28)]",
          fullBleed ? "rounded-none border-x-0" : "rounded-2xl md:rounded-3xl",
          contentPanelClassName,
        )}
      >
        {children}
      </div>
    </div>
  ) : (
    children
  );

  const headerPadding = fullBleed
    ? "px-5 py-6 sm:px-6 md:px-8 md:py-8 lg:px-10 lg:py-9"
    : "px-5 py-6 sm:px-6 md:px-8 md:py-8 lg:px-10 lg:py-9";

  const titleBlockClass = fullBleed ? "w-full" : "mx-auto max-w-7xl pl-5 md:pl-6";

  const titleInnerClass = "relative border-l-[3px] border-primary/75 pl-5 md:pl-6";

  return (
    <section
      id={id}
      aria-labelledby={ariaLabelledBy}
      className={cn("relative z-20 w-full overflow-x-hidden py-10 md:py-14", className)}
    >
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.55, ease: "easeOut" }}
        className="relative w-full border-y border-border/50 bg-white/75 shadow-[0_4px_24px_rgba(0,0,0,0.04)] backdrop-blur-xl dark:border-white/10 dark:bg-card/55 dark:shadow-[0_4px_32px_rgba(0,0,0,0.35)]"
      >
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.35] dark:opacity-[0.18]"
          style={{
            backgroundImage: "radial-gradient(circle, hsl(var(--border)) 1px, transparent 1px)",
            backgroundSize: "22px 22px",
          }}
        />

        <motion.div
          aria-hidden
          className="absolute left-0 top-0 h-px bg-gradient-to-r from-primary/80 via-primary/40 to-transparent"
          initial={{ width: "0%" }}
          whileInView={{ width: "42%" }}
          viewport={{ once: true }}
          transition={{ duration: 1.1, ease: "easeOut" }}
        />

        <div
          aria-hidden
          className="pointer-events-none absolute -left-24 top-0 h-40 w-40 rounded-full bg-primary/12 blur-3xl md:h-56 md:w-56"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -right-16 bottom-0 h-32 w-32 rounded-full bg-rose-gold/10 blur-3xl md:h-48 md:w-48"
        />

        <div className={cn("relative border-b border-border/40", headerPadding, headerClassName)}>
          {hasSideColumn ? (
            <div
              className={cn(
                "grid grid-cols-1 items-start gap-5 lg:grid-cols-[3fr_2fr] lg:gap-8",
                !fullBleed && "mx-auto max-w-7xl",
              )}
            >
              <div className="space-y-3">
                <SectionBadge label={badge} />
                <h2
                  id={ariaLabelledBy}
                  className="font-serif text-3xl font-medium leading-[1.12] tracking-tight text-balance md:text-4xl lg:text-[2.75rem] lg:leading-[1.1]"
                >
                  {title}
                </h2>
                {subtitle ? (
                  <p className="max-w-xl text-base leading-relaxed text-muted-foreground md:text-lg">{subtitle}</p>
                ) : null}
              </div>
              <div className="flex flex-col gap-4 lg:justify-self-end lg:text-right">
                {description ? (
                  <div className="max-w-md text-base leading-relaxed text-muted-foreground text-balance lg:ml-auto">
                    {description}
                  </div>
                ) : null}
                {action ? <div className="lg:ml-auto">{action}</div> : null}
              </div>
            </div>
          ) : (
            <div className={titleBlockClass}>
              <div className={titleInnerClass}>
                <SectionBadge label={badge} />
                <h2
                  id={ariaLabelledBy}
                  className="font-serif text-3xl font-medium leading-[1.12] tracking-tight text-balance md:text-4xl lg:text-[2.75rem] lg:leading-[1.1]"
                >
                  {title}
                </h2>
                {subtitle ? (
                  <p className="mt-3 max-w-xl text-base leading-relaxed text-muted-foreground md:mt-4 md:text-lg">
                    {subtitle}
                  </p>
                ) : null}
                <div
                  aria-hidden
                  className="mt-5 h-px w-16 bg-gradient-to-r from-primary/50 to-transparent md:mt-6 md:w-20"
                />
              </div>
            </div>
          )}
        </div>

        <div className={cn("relative w-full", contentClassName)}>{contentInner}</div>
      </motion.div>
    </section>
  );
}

export default HomeSectionShell;
