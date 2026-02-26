import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { getGalleryImagesByRows, categoryToGallerySlug, GalleryImage } from "@/services/gallery";
import { getSiteSettingOptional } from "@/services/siteContent";
import { GALLERY_FRAME_TEMPLATES, type GalleryFrameTemplateId } from "@/lib/galleryFrames";
import { cn } from "@/lib/utils";

/* Gallery: rows of images with infinite horizontal scroll.
 * Frame style is configurable. 5 images visible per row.
 * Clicking image with category navigates to /gallery/{category-slug}.
 */

const FALLBACK_IMAGES: Record<string, string[]> = {
  row1: [
    "/wedding 1.jpg",
    "/gallery wedding.jpg",
    "/engagement.jpg",
    "/sangeet.jpg",
    "/haldi.jpg",
    "/mehendi.jpg",
  ],
  row2: [
    "/birthday.jpg",
    "/corporate.jpg",
    "/anniversary.jpg",
    "/wedding 1.jpg",
    "/engagement.jpg",
    "/gallery wedding.jpg",
  ],
};

/* Row directions; pause on hover handled in GalleryRow */
const ROW_CONFIG = [
  { direction: "left" as const, speed: 0.5 },
  { direction: "right" as const, speed: 0.45 },
  { direction: "left" as const, speed: 0.4 },
];

/* Frame width: ~5 images fit in viewport on large screens - increased size */
const FRAME_WIDTH_CLASS = "w-[200px] sm:w-[220px] md:w-[240px] lg:w-[260px] xl:w-[280px] min-w-[180px]";

interface FrameImageProps {
  src: string;
  alt: string;
  category: string | null;
  frameId: GalleryFrameTemplateId;
}

function FrameImage({ src, alt, category, frameId }: FrameImageProps) {
  const [imgError, setImgError] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const slug = category ? categoryToGallerySlug(category) : null;
  const href = slug ? `/gallery/${slug}` : undefined;

  // Detect dark theme
  useEffect(() => {
    const checkTheme = () => {
      const darkMode = document.documentElement.classList.contains('dark');
      setIsDark(darkMode);
    };
    checkTheme();
    const observer = new MutationObserver(checkTheme);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  const content = (
    <div
      className={cn(
        "polaroid-frame group flex-shrink-0 cursor-pointer transition-all duration-300",
        "hover:-translate-y-2.5 hover:scale-[1.02] hover:rotate-1",
        FRAME_WIDTH_CLASS
      )}
    >
      <div
        className={cn(
          "relative overflow-visible transition-all duration-300",
          // Enhanced frames with theme-aware styling
          frameId === "polaroid" && (isDark 
            ? "bg-white p-5 pb-14 rounded-sm shadow-[0_8px_30px_rgba(0,0,0,0.5),0_15px_50px_rgba(0,0,0,0.4),inset_0_0_0_1px_hsl(var(--primary)_/_0.25)] border border-[hsl(var(--primary)_/_0.3)] group-hover:shadow-[0_12px_40px_rgba(0,0,0,0.6),0_20px_60px_hsl(var(--primary)_/_0.2)]"
            : "bg-gradient-to-br from-[#FAFAF8] to-[#F5F3EF] p-5 pb-14 rounded-sm shadow-[0_8px_30px_rgba(232,175,193,0.2),0_15px_50px_rgba(232,175,193,0.14),inset_0_0_0_1px_hsl(var(--primary)_/_0.15)] border border-[hsl(var(--primary)_/_0.2)] group-hover:shadow-[0_12px_40px_rgba(232,175,193,0.26),0_20px_60px_hsl(var(--primary)_/_0.15)]"
          ),
          frameId === "rounded" && (isDark
            ? "bg-white p-4 rounded-2xl shadow-[0_8px_25px_rgba(0,0,0,0.5),0_2px_8px_hsl(var(--primary)_/_0.15),inset_0_0_0_1px_hsl(var(--primary)_/_0.2)] border border-[hsl(var(--primary)_/_0.25)] group-hover:shadow-[0_12px_35px_rgba(0,0,0,0.6),0_4px_12px_hsl(var(--primary)_/_0.2)]"
            : "bg-gradient-to-br from-[#FFFFFF] to-[#FAFAF8] p-4 rounded-2xl shadow-[0_8px_25px_rgba(232,175,193,0.18),0_2px_8px_hsl(var(--primary)_/_0.08),inset_0_0_0_1px_hsl(var(--primary)_/_0.12)] border border-[hsl(var(--primary)_/_0.18)] group-hover:shadow-[0_12px_35px_rgba(232,175,193,0.24),0_4px_12px_hsl(var(--primary)_/_0.12)]"
          ),
          frameId === "shadow" && (isDark
            ? "bg-white p-3 rounded-xl shadow-[0_10px_35px_rgba(0,0,0,0.5),0_3px_10px_hsl(var(--primary)_/_0.2),inset_0_0_0_1px_hsl(var(--primary)_/_0.25)] border border-[hsl(var(--primary)_/_0.3)] group-hover:shadow-[0_15px_45px_rgba(0,0,0,0.6),0_5px_15px_hsl(var(--primary)_/_0.25)]"
            : "bg-gradient-to-br from-[#FFFFFF] to-[#F9F7F5] p-3 rounded-xl shadow-[0_10px_35px_rgba(232,175,193,0.18),0_3px_10px_hsl(var(--primary)_/_0.1),inset_0_0_0_1px_hsl(var(--primary)_/_0.15)] border border-[hsl(var(--primary)_/_0.2)] group-hover:shadow-[0_15px_45px_rgba(232,175,193,0.24),0_5px_15px_hsl(var(--primary)_/_0.15)]"
          ),
          frameId === "vintage" && (isDark
            ? "bg-white p-5 rounded-sm border-2 border-[hsl(var(--primary)_/_0.5)] shadow-[0_8px_30px_rgba(0,0,0,0.5),inset_0_0_20px_rgba(0,0,0,0.1),inset_0_2px_4px_hsl(var(--primary)_/_0.1)] group-hover:shadow-[0_12px_40px_rgba(0,0,0,0.6),inset_0_0_25px_rgba(0,0,0,0.15)]"
            : "bg-gradient-to-br from-[#FFF8E7] to-[#FFEAA7] p-5 rounded-sm border-2 border-[hsl(var(--primary)_/_0.4)] shadow-[0_8px_30px_rgba(232,175,193,0.18),inset_0_0_20px_rgba(232,175,193,0.04),inset_0_2px_4px_rgba(255,255,255,0.5)] group-hover:shadow-[0_12px_40px_rgba(232,175,193,0.24),inset_0_0_25px_rgba(232,175,193,0.06)]"
          ),
          frameId === "minimal" && (isDark
            ? "bg-white p-2 rounded-lg border-2 border-[hsl(var(--primary)_/_0.3)] shadow-[0_4px_15px_rgba(0,0,0,0.4),inset_0_0_0_1px_hsl(var(--primary)_/_0.15)] group-hover:shadow-[0_8px_25px_rgba(0,0,0,0.5),0_2px_6px_hsl(var(--primary)_/_0.2)]"
            : "bg-gradient-to-br from-[#FFFFFF] to-[#FAFAF8] p-2 rounded-lg border-2 border-[hsl(var(--primary)_/_0.25)] shadow-[0_4px_15px_rgba(232,175,193,0.16),inset_0_0_0_1px_hsl(var(--primary)_/_0.1)] group-hover:shadow-[0_8px_25px_rgba(232,175,193,0.22),0_2px_6px_hsl(var(--primary)_/_0.15)]"
          )
        )}
      >
        <div
          className={cn(
            "aspect-[4/5] overflow-hidden bg-muted transition-transform duration-300 group-hover:scale-[1.03]",
            frameId === "polaroid" && "rounded-sm",
            frameId === "rounded" && "rounded-xl",
            frameId === "shadow" && "rounded-lg",
            frameId === "vintage" && "rounded-sm",
            frameId === "minimal" && "rounded-md"
          )}
        >
          {!imgError ? (
            <img
              src={src}
              alt={alt}
              className="w-full h-full object-cover"
              loading="lazy"
              decoding="async"
              onError={() => setImgError(true)}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted-foreground text-sm">
              Image
            </div>
          )}
        </div>
      </div>
    </div>
  );

  if (href) {
    return (
      <Link to={href} className="block">
        {content}
      </Link>
    );
  }
  return content;
}

const DUPLICATE_COPIES = 6;

function GalleryRow({
  images,
  direction,
  speed,
  rowIndex,
  frameId,
}: {
  images: { src: string; alt: string; category: string | null }[];
  direction: "left" | "right";
  speed: number;
  rowIndex: number;
  frameId: GalleryFrameTemplateId;
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const posRef = useRef(0);
  const unitWidthRef = useRef(0);
  const pausedRef = useRef(false);

  useEffect(() => {
    const track = trackRef.current;
    if (!track || images.length === 0) return;

    const updateWidth = () => {
      unitWidthRef.current = track.scrollWidth / DUPLICATE_COPIES;
    };
    updateWidth();
    const ro = new ResizeObserver(updateWidth);
    ro.observe(track);

    if (direction === "right" && posRef.current === 0 && unitWidthRef.current > 0) {
      posRef.current = unitWidthRef.current;
      track.style.transform = `translateX(${-posRef.current}px)`;
    }

    let rafId: number;
    const tick = () => {
      if (track && unitWidthRef.current > 0 && !pausedRef.current) {
        const step = direction === "left" ? speed : -speed;
        posRef.current += step;
        const unit = unitWidthRef.current;
        if (posRef.current >= unit) posRef.current -= unit;
        if (posRef.current < 0) posRef.current += unit;
        track.style.transform = `translateX(${-posRef.current}px)`;
      }
      rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(rafId);
      ro.disconnect();
    };
  }, [images.length, direction, speed]);

  const duplicated = Array.from({ length: DUPLICATE_COPIES }, () => images).flat();

  return (
    <div
      className="overflow-hidden py-3 md:py-5 polaroid-row-container"
      data-row={rowIndex}
      onMouseEnter={() => { pausedRef.current = true; }}
      onMouseLeave={() => { pausedRef.current = false; }}
    >
      <div
        ref={trackRef}
        className="polaroid-track flex gap-5 md:gap-6 w-max"
        style={{ willChange: "transform" }}
      >
        {duplicated.map((img, i) => (
          <FrameImage
            key={`${rowIndex}-${i}`}
            src={img.src}
            alt={img.alt}
            category={img.category}
            frameId={frameId}
          />
        ))}
      </div>
    </div>
  );
}

export default function PolaroidGallerySection() {
  const [rows, setRows] = useState<{ src: string; alt: string; category: string | null }[][]>([]);
  const [frameId, setFrameId] = useState<GalleryFrameTemplateId>("polaroid");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [rowsData, frameVal] = await Promise.all([
          getGalleryImagesByRows(),
          getSiteSettingOptional("homepage_gallery_frame_template"),
        ]);

        setFrameId(
          frameVal && frameVal in GALLERY_FRAME_TEMPLATES
            ? (frameVal as GalleryFrameTemplateId)
            : "polaroid"
        );

        if (rowsData.length > 0 && rowsData.some((r) => r.length > 0)) {
          const mapped = rowsData.map((row) =>
            row.map((i: GalleryImage) => ({
              src: i.url,
              alt: i.title || "Gallery",
              category: i.category,
            }))
          );
          const minPerRow = 10;
          const filled = mapped.map((row) => {
            let r = [...row];
            while (r.length < minPerRow) r = [...r, ...r.slice(0, minPerRow - r.length)];
            return r;
          });
          setRows(filled);
        } else {
          const r1 = FALLBACK_IMAGES.row1.map((u, i) => ({ src: u, alt: `Wedding ${i + 1}`, category: "Wedding" as string | null }));
          const r2 = FALLBACK_IMAGES.row2.map((u, i) => ({ src: u, alt: `Event ${i + 1}`, category: null }));
          setRows([r1, r2]);
        }
      } catch {
        const r1 = FALLBACK_IMAGES.row1.map((u, i) => ({ src: u, alt: `Wedding ${i + 1}`, category: "Wedding" as string | null }));
        const r2 = FALLBACK_IMAGES.row2.map((u, i) => ({ src: u, alt: `Event ${i + 1}`, category: null }));
        setRows([r1, r2]);
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, []);

  if (isLoading) {
    return (
      <section className="home-section bg-muted dark:bg-charcoal">
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-2 border-primary/40 border-t-primary rounded-full animate-spin" />
        </div>
      </section>
    );
  }

  const displayRows = rows;

  return (
    <section
      id="gallery"
      className="polaroid-gallery relative home-section bg-muted dark:bg-charcoal overflow-hidden pt-4 sm:pt-6 lg:pt-8 pb-6 sm:pb-8 lg:pb-10"
    >
      <div className="home-section-inner mb-4 sm:mb-5">
        <h2 className="section-heading text-center mb-2">
          Portfolio Highlights
        </h2>
        <p className="section-subtitle text-center mb-4">
          Our recent work
        </p>
        <div
          className="w-16 h-0.5 mx-auto rounded-full bg-primary"
          aria-hidden
        />
      </div>

      <div className="polaroid-gallery-inner space-y-3 md:space-y-4">
        {displayRows.map((rowImages, idx) => (
          <GalleryRow
            key={idx}
            images={rowImages}
            direction={ROW_CONFIG[idx % ROW_CONFIG.length].direction}
            speed={ROW_CONFIG[idx % ROW_CONFIG.length].speed}
            rowIndex={idx}
            frameId={frameId}
          />
        ))}
      </div>

      <div className="relative z-10 home-section-inner pt-8 text-center">
        <Link to="/gallery" className="btn-section-cta">
          <span>View Full Gallery</span>
          <span aria-hidden>→</span>
        </Link>
      </div>
    </section>
  );
}
