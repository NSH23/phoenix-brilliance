"use client";

import { useEffect, useState, useMemo } from "react";
import { motion } from "framer-motion";
import { getGalleryImagesForHomepage, type GalleryImage } from "@/services/gallery";
import { getAboutSectionFlipImagesOptional, type AboutSectionFlipImages } from "@/services/siteContent";
import { resolvePublicStorageUrl } from "@/services/storage";

// Fallback images so something is always visible if gallery is empty or fails
const FALLBACK_IMAGES = [
  "/placeholder.svg",
  "/placeholder.svg",
  "/placeholder.svg",
  "/placeholder.svg",
  "/placeholder.svg",
  "/placeholder.svg",
  "/placeholder.svg",
  "/placeholder.svg",
  "/placeholder.svg",
  "/placeholder.svg",
  "/placeholder.svg",
  "/placeholder.svg",
];

/** Diagonal order for 2x2 (4 cards) – 2 rows of 2, 8 images */
const DIAGONAL_ORDER_4 = [0, 2, 1, 3];
const CARD_DELAY_MS = 420;
const FLIP_DURATION_MS = 850;
const PAUSE_BETWEEN_CYCLES_MS = 3200;
const NUM_CARDS = 4;
const NUM_IMAGES = NUM_CARDS * 2; // 8

function resolveFlipImageUrl(raw: string): string {
  const t = (raw || '').trim();
  if (!t) return '';
  return resolvePublicStorageUrl(t, 'gallery-images') || t;
}

function hasAnyFlipUrl(about: AboutSectionFlipImages): boolean {
  return about.front.some((u) => u.trim()) || about.back.some((u) => u.trim());
}

function galleryRowsFromAboutSection(about: AboutSectionFlipImages): GalleryImage[] {
  const combined: GalleryImage[] = [];
  for (let i = 0; i < 4; i++) {
    const f = resolveFlipImageUrl(about.front[i] ?? '');
    const b = resolveFlipImageUrl(about.back[i] ?? '');
    combined.push({
      id: `front-${i}`,
      url: f || FALLBACK_IMAGES[i % FALLBACK_IMAGES.length],
      title: null,
      category: null,
      is_featured: false,
      display_order: i * 2,
      row_index: 0,
      created_at: '',
      updated_at: '',
    });
    combined.push({
      id: `back-${i}`,
      url: b || FALLBACK_IMAGES[(i * 2 + 1) % FALLBACK_IMAGES.length],
      title: null,
      category: null,
      is_featured: false,
      display_order: i * 2 + 1,
      row_index: 0,
      created_at: '',
      updated_at: '',
    });
  }
  return combined;
}

export type AboutFlipCardsProps = {
  /** When true, wait for homepage bundle before resolving images (avoids wrong gallery fallback). */
  homepageDataPending?: boolean;
  /** From homepage query: `null` = no saved config; `undefined` = fetch client-side (no bundle). */
  prefetchedFlipImages?: AboutSectionFlipImages | null;
};

export function AboutFlipCards({
  homepageDataPending,
  prefetchedFlipImages,
}: AboutFlipCardsProps = {}) {
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [flipped, setFlipped] = useState<Set<number>>(new Set());

  useEffect(() => {
    if (homepageDataPending) return;

    if (prefetchedFlipImages !== undefined) {
      if (prefetchedFlipImages && hasAnyFlipUrl(prefetchedFlipImages)) {
        setImages(galleryRowsFromAboutSection(prefetchedFlipImages));
      } else {
        void getGalleryImagesForHomepage(NUM_IMAGES).then((data) => setImages(data || []));
      }
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const aboutSection = await getAboutSectionFlipImagesOptional();
        if (cancelled) return;
        if (aboutSection && hasAnyFlipUrl(aboutSection)) {
          setImages(galleryRowsFromAboutSection(aboutSection));
        } else {
          const data = await getGalleryImagesForHomepage(NUM_IMAGES);
          if (cancelled) return;
          setImages(data || []);
        }
      } catch {
        if (cancelled) return;
        getGalleryImagesForHomepage(NUM_IMAGES).then((data) => setImages(data || [])).catch(() => setImages([]));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [homepageDataPending, prefetchedFlipImages]);

  const { pairs, diagonalOrder } = useMemo(() => {
    const urls: string[] = [];
    const list = images.map((img) => (img?.url && String(img.url).trim() ? img.url : FALLBACK_IMAGES[0]));
    for (let i = 0; i < NUM_IMAGES; i++) {
      urls.push(list[i] ?? FALLBACK_IMAGES[i % FALLBACK_IMAGES.length]);
    }
    const makePairs = (arr: string[]): [string, string][] => {
      const p: [string, string][] = [];
      for (let i = 0; i + 1 < arr.length; i += 2) p.push([arr[i], arr[i + 1]]);
      return p;
    };
    return {
      pairs: makePairs(urls),
      diagonalOrder: DIAGONAL_ORDER_4,
    };
  }, [images]);

  useEffect(() => {
    if (pairs.length === 0) return;
    const DIAGONAL_ORDER = diagonalOrder;
    const runCycle = () => {
      setFlipped(new Set());
      DIAGONAL_ORDER.forEach((cardIndex, i) => {
        setTimeout(() => {
          setFlipped((prev) => new Set([...prev, cardIndex]));
        }, i * CARD_DELAY_MS);
      });
      const flipEnd = DIAGONAL_ORDER.length * CARD_DELAY_MS + FLIP_DURATION_MS;
      setTimeout(() => {
        [...DIAGONAL_ORDER].reverse().forEach((cardIndex, i) => {
          setTimeout(() => {
            setFlipped((prev) => {
              const next = new Set(prev);
              next.delete(cardIndex);
              return next;
            });
          }, i * CARD_DELAY_MS);
        });
      }, flipEnd);
      return flipEnd + DIAGONAL_ORDER.length * CARD_DELAY_MS + FLIP_DURATION_MS + PAUSE_BETWEEN_CYCLES_MS;
    };
    let timeoutId: ReturnType<typeof setTimeout>;
    const scheduleNext = () => {
      timeoutId = setTimeout(scheduleNext, runCycle());
    };
    scheduleNext();
    return () => clearTimeout(timeoutId);
  }, [pairs.length, diagonalOrder]);

  if (pairs.length === 0) {
    return (
      <div className="relative mx-auto w-full max-w-[22rem] overflow-hidden rounded-2xl border border-border/60 bg-white/50 shadow-[0_8px_32px_rgba(0,0,0,0.05)] dark:border-white/10 dark:bg-card/60 dark:shadow-[0_8px_32px_rgba(0,0,0,0.25)] sm:max-w-[24rem] md:max-w-[26rem] md:rounded-3xl">
        <div className="relative z-10 grid grid-cols-2 grid-rows-2 gap-2 p-2.5">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="aspect-square animate-pulse rounded-xl bg-muted/60" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="relative mx-auto w-full max-w-[22rem] overflow-hidden rounded-2xl border border-border/60 bg-white/50 shadow-[0_8px_32px_rgba(0,0,0,0.05)] backdrop-blur-md dark:border-white/10 dark:bg-card/60 dark:shadow-[0_8px_32px_rgba(0,0,0,0.25)] sm:max-w-[24rem] md:max-w-[26rem] md:rounded-3xl">
      <div className="relative z-10 grid grid-cols-2 grid-rows-2 gap-2 p-2.5 overflow-visible">
        {pairs.map(([frontUrl, backUrl], index) => (
          <FlipCard
            key={index}
            frontImage={frontUrl}
            backImage={backUrl}
            isFlipped={flipped.has(index)}
            delay={index * 0.04}
          />
        ))}
      </div>
    </div>
  );
}

function FlipCard({
  frontImage,
  backImage,
  isFlipped,
  delay,
}: {
  frontImage: string;
  backImage: string;
  isFlipped: boolean;
  delay: number;
}) {
  // Scale image up so it appears larger inside the card (zoomed in), container unchanged
  const imageStyle: React.CSSProperties = {
    width: "100%",
    height: "100%",
    objectFit: "cover",
    objectPosition: "center",
    transform: "scale(1.55)",
  };

  return (
    <div
      className="relative w-full aspect-square"
      style={{ perspective: "1200px" }}
    >
      <motion.div
        className="relative w-full h-full [transform-style:preserve-3d]"
        style={{
          transformStyle: "preserve-3d",
          WebkitTransformStyle: "preserve-3d" as const,
        }}
        initial={false}
        animate={{
          rotateY: isFlipped ? 180 : 0,
          rotateX: isFlipped ? 6 : 0,
        }}
        transition={{
          duration: 0.85,
          ease: [0.34, 0.9, 0.2, 1],
          delay,
        }}
      >
        <div
          className="absolute inset-0 overflow-hidden rounded-xl border border-border/60 bg-muted shadow-md [transform-style:preserve-3d] dark:border-white/15"
          style={{
            backfaceVisibility: "hidden",
            WebkitBackfaceVisibility: "hidden",
            transform: "rotateY(0deg) translateZ(1px)",
          }}
        >
          <img
            src={frontImage}
            alt=""
            style={imageStyle}
            loading="lazy"
            decoding="async"
            className="w-full h-full"
          />
        </div>
        <div
          className="absolute inset-0 overflow-hidden rounded-xl border border-border/60 bg-muted shadow-md [transform-style:preserve-3d] dark:border-white/15"
          style={{
            backfaceVisibility: "hidden",
            WebkitBackfaceVisibility: "hidden",
            transform: "rotateY(180deg) translateZ(1px)",
          }}
        >
          <img
            src={backImage}
            alt=""
            style={imageStyle}
            loading="lazy"
            decoding="async"
            className="w-full h-full"
          />
        </div>
      </motion.div>
    </div>
  );
}
