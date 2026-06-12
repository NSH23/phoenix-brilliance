"use client";

import { useEffect, useState } from "react";
import { getGalleryImagesForHomepage } from "@/services/gallery";
import {
  getAboutSectionFlipImagesOptional,
  type AboutSectionFlipImages,
} from "@/services/siteContent";
import { resolvePublicStorageUrl } from "@/services/storage";
import { cn } from "@/lib/utils";

const FALLBACK_HERO = "/webp/1.webp";

const MILESTONES = [
  { year: "2017", label: "Founded", offset: "top-[14%]" },
  { year: "2024", label: "PnP Launch", offset: "top-[44%]" },
  { year: "Today", label: "Trusted Name", offset: "top-[74%]" },
] as const;

const CRAFT_CHIPS = ["Event Décor", "Production", "Design"] as const;

function resolveImageUrl(raw: string): string {
  const t = (raw || "").trim();
  if (!t) return "";
  return resolvePublicStorageUrl(t, "gallery-images") || t;
}

function heroFromFlipConfig(about: AboutSectionFlipImages): string {
  for (const raw of about.front) {
    const url = resolveImageUrl(raw);
    if (url) return url;
  }
  return FALLBACK_HERO;
}

export type AboutStoryVisualProps = {
  homepageDataPending?: boolean;
  prefetchedFlipImages?: AboutSectionFlipImages | null;
  className?: string;
};

export function AboutStoryVisual({
  homepageDataPending,
  prefetchedFlipImages,
  className,
}: AboutStoryVisualProps) {
  const [heroImage, setHeroImage] = useState(FALLBACK_HERO);

  useEffect(() => {
    if (homepageDataPending) return;

    if (prefetchedFlipImages !== undefined) {
      if (prefetchedFlipImages?.front.some((u) => u.trim())) {
        setHeroImage(heroFromFlipConfig(prefetchedFlipImages));
      } else {
        void getGalleryImagesForHomepage(1).then((rows) => {
          const url = rows?.[0]?.url?.trim();
          if (url) setHeroImage(url);
        });
      }
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const aboutSection = await getAboutSectionFlipImagesOptional();
        if (cancelled) return;
        if (aboutSection?.front.some((u) => u.trim())) {
          setHeroImage(heroFromFlipConfig(aboutSection));
          return;
        }
        const rows = await getGalleryImagesForHomepage(1);
        if (cancelled) return;
        const url = rows?.[0]?.url?.trim();
        if (url) setHeroImage(url);
      } catch {
        if (!cancelled) setHeroImage(FALLBACK_HERO);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [homepageDataPending, prefetchedFlipImages]);

  return (
    <div className={cn("home-card-padded flex h-full w-full min-w-0 flex-col gap-5", className)}>
      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-primary">
        Our Journey
      </p>

      <div className="relative aspect-[464/400] w-full overflow-hidden rounded-xl bg-muted">
        <img
          src={heroImage}
          alt="Phoenix Events celebration"
          className="absolute inset-0 h-full w-full object-cover"
          loading="lazy"
          decoding="async"
        />

        <div aria-hidden className="absolute inset-x-0 bottom-0 h-[48%] bg-black/45" />

        <p
          aria-hidden
          className="pointer-events-none absolute left-3 top-2 select-none font-serif text-[clamp(4.5rem,14vw,7.5rem)] font-normal italic leading-none text-white/15"
        >
          2017
        </p>

        <div
          aria-hidden
          className="absolute left-[26px] top-[12%] h-[70%] w-[3px] rounded-full bg-primary/70"
        />

        <ol className="absolute inset-0" aria-label="Company milestones">
          {MILESTONES.map((m) => (
            <li key={m.year} className={cn("absolute left-[21px]", m.offset)}>
              <div className="flex items-start gap-3">
                <span
                  aria-hidden
                  className="mt-1 h-3 w-3 shrink-0 rounded-full border-2 border-white bg-primary"
                />
                <div>
                  <p className="font-serif text-xl font-semibold leading-none text-white sm:text-2xl">
                    {m.year}
                  </p>
                  <p className="mt-1.5 text-[10px] font-medium uppercase tracking-[0.14em] text-white/90 sm:text-[11px]">
                    {m.label}
                  </p>
                </div>
              </div>
            </li>
          ))}
        </ol>

        <div className="absolute bottom-4 right-3 rounded-xl border border-border bg-card px-3.5 py-3 shadow-sm sm:bottom-5 sm:right-4">
          <p className="font-serif text-lg font-medium leading-tight text-foreground sm:text-[19px]">
            Kevin David
          </p>
          <p className="mt-0.5 text-[9px] font-semibold uppercase tracking-[0.16em] text-primary">
            Founder & Creative Director
          </p>
        </div>
      </div>

      <blockquote className="flex gap-4 border-none p-0">
        <span aria-hidden className="mt-0.5 h-12 w-[3px] shrink-0 rounded-sm bg-primary" />
        <p className="font-serif text-lg font-medium italic leading-snug text-foreground md:text-xl">
          We design how celebrations are remembered.
        </p>
      </blockquote>

      <div className="flex flex-wrap gap-2">
        {CRAFT_CHIPS.map((chip) => (
          <span
            key={chip}
            className="rounded-full border border-border bg-secondary px-3.5 py-1.5 text-[10px] font-medium tracking-wide text-primary sm:text-[11px]"
          >
            {chip}
          </span>
        ))}
      </div>
    </div>
  );
}
