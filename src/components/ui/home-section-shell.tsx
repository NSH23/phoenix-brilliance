import { cn } from "@/lib/utils";
import { HomeSectionHeader } from "@/components/ui/home-section-header";

type HomeSectionShellProps = {
  id?: string;
  ariaLabelledBy?: string;
  badge: string;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  contentClassName?: string;
  headerClassName?: string;
  contentPanel?: boolean;
  contentPanelClassName?: string;
  fullBleed?: boolean;
  /** @deprecated No-op — kept for call-site compatibility */
  hideSideGlow?: boolean;
  /** `linen` = band-1, `white` = band-2 (warm cream — never pure white) */
  variant?: "linen" | "white";
  /** Optional absolute backdrop layer (dots, grid, etc.) */
  backgroundOverlay?: React.ReactNode;
  /** Allow horizontal carousel peek without clipping (mobile partners strip). */
  allowHorizontalOverflow?: boolean;
};

export function HomeSectionShell({
  id,
  ariaLabelledBy,
  badge,
  title,
  subtitle,
  action,
  children,
  className,
  contentClassName,
  headerClassName,
  contentPanel = false,
  contentPanelClassName,
  fullBleed = false,
  variant = "linen",
  backgroundOverlay,
  allowHorizontalOverflow = false,
}: HomeSectionShellProps) {
  const bandClass =
    variant === "white" ? "bg-[var(--section-band-2)]" : "bg-[var(--section-band-1)]";
  const containerPad = "px-5 sm:px-6 lg:px-8";

  const contentInner = contentPanel ? (
    <div className={cn(contentPanelClassName)}>{children}</div>
  ) : (
    children
  );

  return (
    <section
      id={id}
      aria-labelledby={ariaLabelledBy}
      className={cn(
        "relative isolate w-full py-12 md:py-16 lg:py-[4.25rem]",
        allowHorizontalOverflow ? "overflow-x-visible" : "overflow-x-hidden",
        bandClass,
        className,
      )}
    >
      {backgroundOverlay}
      <div className={cn("relative z-[1] mx-auto max-w-7xl", containerPad)}>
        <HomeSectionHeader
          id={ariaLabelledBy}
          badge={badge}
          title={title}
          subtitle={subtitle}
          className={cn("mb-7 md:mb-9", headerClassName)}
        />
        {action ? <div className="mb-5 md:mb-6">{action}</div> : null}
        {!fullBleed ? (
          <div className={cn("relative w-full", contentClassName)}>{contentInner}</div>
        ) : null}
      </div>

      {fullBleed ? (
        <div className={cn("relative z-[1] w-full", contentClassName)}>{contentInner}</div>
      ) : null}
    </section>
  );
}

export default HomeSectionShell;
