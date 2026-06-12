import { useRef, useState } from "react";

import { motion, useInView } from "framer-motion";

import { Play } from "lucide-react";

import { cn } from "@/lib/utils";

import { AspectRatio } from "@/components/ui/aspect-ratio";

import { OptimizedImage } from "@/components/ui/optimized-image";

import { SRCSET_SIZES } from "@/lib/mediaDelivery";



export type GalleryPhotoTileItem = {

  id?: string;

  posterSrc: string;

  alt?: string;

  caption?: string;

  isVideo?: boolean;

};



type GalleryPhotoTileProps = {

  item: GalleryPhotoTileItem;

  index: number;

  onClick: () => void;

  ratio?: number;

  variant?: "default" | "hero" | "wide" | "album";

  className?: string;

};



const VARIANT_RATIO: Record<Exclude<GalleryPhotoTileProps["variant"], undefined>, number> = {

  default: 4 / 3,

  hero: 3 / 4,

  wide: 16 / 9,

  album: 1,

};



export function GalleryPhotoTile({

  item,

  index,

  onClick,

  ratio,

  variant = "default",

  className,

}: GalleryPhotoTileProps) {

  const ref = useRef<HTMLDivElement>(null);

  const isInView = useInView(ref, { once: true, margin: "-24px" });

  const [loaded, setLoaded] = useState(false);

  const resolvedRatio = ratio ?? VARIANT_RATIO[variant];

  const caption = (item.caption ?? "").trim();

  const label = caption || item.alt || "Gallery photo";

  const isAlbum = variant === "album";



  return (

    <motion.div

      ref={ref}

      initial={{ opacity: 0, y: isAlbum ? 4 : 18 }}

      animate={isInView ? { opacity: 1, y: 0 } : undefined}

      transition={{ delay: (index % 16) * 0.015, duration: isAlbum ? 0.28 : 0.5, ease: "easeOut" }}

      className={cn("h-full", className)}

    >

      <button

        type="button"

        onClick={onClick}

        className={cn(

          "group relative w-full overflow-hidden bg-muted/40 text-left",

          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",

          isAlbum

            ? "rounded-lg border border-border/40 transition-colors hover:border-border"

            : "h-full rounded-xl border border-border/60 bg-card shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md",

        )}

        aria-label={label}

      >

        <AspectRatio ratio={resolvedRatio} className="bg-muted/30">

          <OptimizedImage

            src={item.posterSrc}

            alt={label}

            preset="card"

            sizes={SRCSET_SIZES.gallery}

            className={cn(

              "h-full w-full object-cover transition-transform duration-300",

              isAlbum ? "group-hover:scale-[1.03]" : "duration-700 ease-out group-hover:scale-105",

              isInView && loaded ? "opacity-100" : "opacity-0",

            )}

            loading="lazy"

            onLoad={() => setLoaded(true)}

          />



          {!isAlbum ? (

            <>

              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent opacity-80 transition-opacity duration-300 sm:opacity-0 sm:group-hover:opacity-100" />

              <div className="pointer-events-none absolute inset-0 flex flex-col justify-end translate-y-0 sm:translate-y-full sm:group-hover:translate-y-0 transition-transform duration-300 ease-out">

                <div className="bg-black/75 p-3 sm:p-4 backdrop-blur-[2px]">

                  <p className="line-clamp-2 text-sm font-semibold text-white">{label}</p>

                  {item.isVideo ? (

                    <p className="mt-0.5 text-xs uppercase tracking-wider text-white/70">Video</p>

                  ) : null}

                </div>

              </div>

            </>

          ) : (

            <div className="pointer-events-none absolute inset-0 bg-black/0 transition-colors duration-200 group-hover:bg-black/[0.06]" />

          )}



          {item.isVideo ? (

            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">

              <div

                className={cn(

                  "flex items-center justify-center rounded-full bg-black/55",

                  isAlbum ? "h-8 w-8" : "h-12 w-12",

                )}

              >

                <Play className={cn("text-white", isAlbum ? "h-3.5 w-3.5" : "h-6 w-6")} fill="currentColor" />

              </div>

            </div>

          ) : null}

        </AspectRatio>

      </button>

    </motion.div>

  );

}

