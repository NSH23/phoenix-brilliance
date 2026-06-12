import { cn } from "@/lib/utils";
import {
  HomeSectionBackground,
  type HomeSectionBackgroundVariant,
} from "@/components/ui/home-section-background";

type PageContentSectionProps = {
  children: React.ReactNode;
  className?: string;
  innerClassName?: string;
  background?: HomeSectionBackgroundVariant;
  /** `linen` = band-1, `white` = band-2 */
  band?: "linen" | "white";
  container?: boolean;
  id?: string;
};

/**
 * Inner-page content band with 21st.dev-style backdrop (not for heroes).
 */
export function PageContentSection({
  children,
  className,
  innerClassName,
  background = "vignette-grid",
  band = "linen",
  container = true,
  id,
}: PageContentSectionProps) {
  const bandClass =
    band === "white" ? "bg-[var(--section-band-2)]" : "bg-[var(--section-band-1)]";

  return (
    <section id={id} className={cn("relative isolate overflow-hidden", bandClass, className)}>
      <HomeSectionBackground variant={background} />
      <div
        className={cn(
          "relative z-[1]",
          container && "container mx-auto px-4",
          innerClassName,
        )}
      >
        {children}
      </div>
    </section>
  );
}

export default PageContentSection;
