"use client";

import { useEffect, useState, useMemo } from "react";
import { motion } from "framer-motion";
import { getGalleryImagesForHomepage, type GalleryImage } from "@/services/gallery";
import { getAboutSectionFlipImagesOptional } from "@/services/siteContent";

// Fallback images so something is always visible if gallery is empty or fails
const FALLBACK_IMAGES = [
  "/1.jpg",
  "/3.jpg",
  "/lgt1.jpg",
  "/lgt2.jpg",
  "/dk1.jpg",
  "/whytochooseus.jpg",
  "/testamonilas.jpg",
  "/1.jpg",
  "/3.jpg",
  "/lgt1.jpg",
  "/lgt2.jpg",
  "/dk1.jpg",
];

/** Diagonal order for 3x2 (6 cards) – 2 rows of 3, 12 images */
const DIAGONAL_ORDER_6 = [0, 3, 1, 4, 2, 5];
const CARD_DELAY_MS = 420;
const FLIP_DURATION_MS = 850;
const PAUSE_BETWEEN_CYCLES_MS = 3200;
const NUM_CARDS = 6;
const NUM_IMAGES = NUM_CARDS * 2; // 12

export function AboutFlipCards() {
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [flipped, setFlipped] = useState<Set<number>>(new Set());

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const aboutSection = await getAboutSectionFlipImagesOptional();
        if (cancelled) return;
        if (aboutSection && aboutSection.front.length > 0 && aboutSection.back.length > 0) {
          const combined: GalleryImage[] = [];
          for (let i = 0; i < 6; i++) {
            combined.push({ id: `front-${i}`, url: aboutSection.front[i] || FALLBACK_IMAGES[0], title: null, category: null, is_featured: false, display_order: i * 2, row_index: 0, created_at: '', updated_at: '' });
            combined.push({ id: `back-${i}`, url: aboutSection.back[i] || FALLBACK_IMAGES[1], title: null, category: null, is_featured: false, display_order: i * 2 + 1, row_index: 0, created_at: '', updated_at: '' });
          }
          setImages(combined);
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
    return () => { cancelled = true; };
  }, []);

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
      diagonalOrder: DIAGONAL_ORDER_6,
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
      <div className="relative w-full max-w-4xl mx-auto min-h-[200px] rounded-2xl md:rounded-3xl overflow-hidden border-2 border-primary/40 shadow-[0_8px_32px_rgba(0,0,0,0.06),inset_0_1px_0_rgba(255,255,255,0.6)] dark:border-white/20 dark:shadow-[0_8px_32px_rgba(0,0,0,0.25),inset_0_1px_0_rgba(255,255,255,0.1)]">
        <div
          className="absolute inset-0 z-0 rounded-2xl md:rounded-3xl bg-cover bg-center bg-no-repeat dark:opacity-0 dark:pointer-events-none"
          style={{ backgroundImage: "url('/3.jpg')" }}
          aria-hidden
        />
        <div className="absolute inset-0 z-0 rounded-2xl md:rounded-3xl bg-white/5 dark:bg-white/[0.06] dark:backdrop-blur-xl" aria-hidden />
        <div className="relative z-10 grid grid-cols-3 gap-2 p-3 min-h-[200px] md:gap-3 md:p-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="aspect-square rounded-2xl bg-white/40 dark:bg-white/10 dark:backdrop-blur-sm animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full max-w-4xl mx-auto min-h-[200px] rounded-2xl md:rounded-3xl overflow-hidden border-2 border-primary/40 backdrop-blur-2xl shadow-[0_8px_32px_rgba(0,0,0,0.06),inset_0_1px_0_rgba(255,255,255,0.6)] dark:border-white/20 dark:shadow-[0_8px_32px_rgba(0,0,0,0.25),inset_0_1px_0_rgba(255,255,255,0.1)]">
      <div
        className="absolute inset-0 z-0 rounded-2xl md:rounded-3xl bg-cover bg-center bg-no-repeat dark:opacity-0 dark:pointer-events-none"
        style={{ backgroundImage: "url('/3.jpg')" }}
        aria-hidden
      />
      <div className="absolute inset-0 z-0 rounded-2xl md:rounded-3xl bg-white/5 dark:bg-white/[0.06] dark:backdrop-blur-xl" aria-hidden />
      <div className="relative z-10 grid grid-cols-3 gap-2 p-3 overflow-hidden min-h-[200px] md:gap-3 md:p-4">
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
      className="relative w-full aspect-square min-h-[80px]"
      style={{ perspective: "1200px" }}
    >
      <motion.div
        className="relative w-full h-full"
        style={{ transformStyle: "preserve-3d" }}
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
          className="absolute inset-0 rounded-xl overflow-hidden bg-muted border-2 border-charcoal/50 dark:border-white/25 shadow-lg ring-1 ring-charcoal/20 dark:ring-white/10"
          style={{
            backfaceVisibility: "hidden",
            WebkitBackfaceVisibility: "hidden",
            transform: "rotateY(0deg)",
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
          className="absolute inset-0 rounded-xl overflow-hidden bg-muted border-2 border-charcoal/50 dark:border-white/25 shadow-lg ring-1 ring-charcoal/20 dark:ring-white/10"
          style={{
            backfaceVisibility: "hidden",
            WebkitBackfaceVisibility: "hidden",
            transform: "rotateY(180deg)",
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
