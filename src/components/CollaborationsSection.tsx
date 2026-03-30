import { motion } from "framer-motion";
import { resolvePublicStorageUrl } from "@/services/storage";
import { shortLocationForCard } from "@/lib/addressUtils";
import {
  useEffect,
  useState,
  useMemo,
  useRef,
  useCallback,
  type ReactNode,
  type PointerEventHandler,
  type MouseEventHandler,
} from "react";
import { Link } from "react-router-dom";
import { getActiveCollaborations, Collaboration } from "@/services/collaborations";
import { useLeadCaptureOptional } from "@/contexts/LeadCaptureContext";

function resolveLogoUrl(url: string | null | undefined): string {
  if (!url) return "/placeholder.svg";
  return resolvePublicStorageUrl(url, "partner-logos");
}

const DRAG_THRESHOLD_PX = 4;
const CLICK_SUPPRESS_PX = 12;
/** Matches collaborations-logo-scroll: one full cycle (half the duplicated track) per 50s */
const AUTO_LOOP_SECONDS = 50;

const MARQUEE_STRIP_CLASS =
  "relative w-full min-w-0 rounded-none border border-primary/30 dark:border-primary/25 overflow-hidden py-5 md:py-6 shadow-[0_4px_24px_rgba(232,175,193,0.14)] dark:shadow-elevation-1-dark collaborations-logo-mask collaborations-logo-mask-no-fade bg-white/55 dark:bg-card/50 backdrop-blur-sm dark:border-white/25";

function CollaborationsMarqueeStrip({ itemCount, children }: { itemCount: number; children: ReactNode }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const offsetRef = useRef(0);
  const loopWidthRef = useRef(0);
  const rafRef = useRef(0);
  const hoverRef = useRef(false);
  const draggingRef = useRef(false);
  const dragArmedRef = useRef(false);
  const dragStartRef = useRef({ x: 0, y: 0, offset: 0 });
  const movedRef = useRef(0);
  const suppressClickRef = useRef(false);
  const reducedMotionRef = useRef(false);

  const wrapOffset = useCallback(() => {
    const lw = loopWidthRef.current;
    if (lw <= 0) return;
    let o = offsetRef.current;
    while (o <= -lw) o += lw;
    while (o > 0) o -= lw;
    offsetRef.current = o;
  }, []);

  const applyTransform = useCallback(() => {
    const el = trackRef.current;
    if (!el) return;
    wrapOffset();
    el.style.transform = `translate3d(${offsetRef.current}px,0,0)`;
  }, [wrapOffset]);

  const measureLoop = useCallback(() => {
    const el = trackRef.current;
    if (!el) return;
    const half = el.scrollWidth / 2;
    loopWidthRef.current = half > 0 ? half : 0;
  }, []);

  useEffect(() => {
    reducedMotionRef.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }, []);

  useEffect(() => {
    measureLoop();
    const el = trackRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      measureLoop();
      applyTransform();
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [measureLoop, applyTransform, itemCount]);

  useEffect(() => {
    offsetRef.current = 0;
    measureLoop();
    applyTransform();
  }, [measureLoop, applyTransform, itemCount]);

  useEffect(() => {
    let last = performance.now();
    const tick = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.1);
      last = now;
      const lw = loopWidthRef.current;
      const autoRun =
        lw > 0 &&
        !reducedMotionRef.current &&
        !hoverRef.current &&
        !draggingRef.current;

      if (autoRun) {
        offsetRef.current -= (lw / AUTO_LOOP_SECONDS) * dt;
      }
      applyTransform();
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [applyTransform]);

  const onPointerDown: PointerEventHandler<HTMLDivElement> = (e) => {
    if (e.button !== 0) return;
    dragArmedRef.current = true;
    draggingRef.current = false;
    movedRef.current = 0;
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      offset: offsetRef.current,
    };
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const onPointerMove: PointerEventHandler<HTMLDivElement> = (e) => {
    if (!dragArmedRef.current) return;
    const dx = e.clientX - dragStartRef.current.x;
    const dy = e.clientY - dragStartRef.current.y;

    if (!draggingRef.current) {
      if (Math.abs(dx) < DRAG_THRESHOLD_PX && Math.abs(dy) < DRAG_THRESHOLD_PX) return;
      if (Math.abs(dy) > Math.abs(dx)) {
        dragArmedRef.current = false;
        e.currentTarget.releasePointerCapture(e.pointerId);
        return;
      }
      draggingRef.current = true;
    }

    movedRef.current = Math.abs(dx);
    offsetRef.current = dragStartRef.current.offset + dx;
    applyTransform();
    e.preventDefault();
  };

  const endPointer: PointerEventHandler<HTMLDivElement> = (e) => {
    if (draggingRef.current && movedRef.current > CLICK_SUPPRESS_PX) {
      suppressClickRef.current = true;
    }
    if (dragArmedRef.current || draggingRef.current) {
      try {
        e.currentTarget.releasePointerCapture(e.pointerId);
      } catch {
        /* already released */
      }
    }
    dragArmedRef.current = false;
    draggingRef.current = false;
  };

  const onClickCapture: MouseEventHandler<HTMLDivElement> = (e) => {
    if (!suppressClickRef.current) return;
    e.preventDefault();
    e.stopPropagation();
    suppressClickRef.current = false;
  };

  return (
    <div
      className={MARQUEE_STRIP_CLASS}
      onPointerEnter={() => {
        hoverRef.current = true;
      }}
      onPointerLeave={() => {
        hoverRef.current = false;
      }}
    >
      <div className="relative z-10">
        <div
          ref={trackRef}
          role="presentation"
          className="collaborations-logo-track-static flex items-stretch gap-6 md:gap-8 cursor-grab active:cursor-grabbing touch-none select-none"
          style={{ touchAction: "none" }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={endPointer}
          onPointerCancel={endPointer}
          onClickCapture={onClickCapture}
        >
          {children}
        </div>
      </div>
    </div>
  );
}

type CollaborationsSectionProps = {
  prefetchedCollaborations?: Collaboration[];
  homepageDataPending?: boolean;
};

const CollaborationsSection = ({ prefetchedCollaborations, homepageDataPending }: CollaborationsSectionProps = {}) => {
  const [collaborations, setCollaborations] = useState<Collaboration[]>([]);
  const leadCapture = useLeadCaptureOptional();
  const selectedVenue = leadCapture?.selectedVenue ?? null;

  useEffect(() => {
    if (homepageDataPending) return;

    if (prefetchedCollaborations !== undefined) {
      setCollaborations(prefetchedCollaborations);
      return;
    }

    getActiveCollaborations()
      .then((data) => {
        setCollaborations(data);
      })
      .catch((err) => {
        console.error("Failed to fetch collaborations:", err);
      });
  }, [homepageDataPending, prefetchedCollaborations]);

  const displayed = useMemo(() => {
    if (!selectedVenue || selectedVenue.trim() === "") return collaborations;
    const v = selectedVenue.trim().toLowerCase();
    return collaborations.filter((c) => (c.name || "").trim().toLowerCase() === v);
  }, [collaborations, selectedVenue]);

  // Single card: show once, centered. Multiple: duplicate for infinite scroll
  const listToRender = displayed.length === 1 ? displayed : [...displayed, ...displayed];
  const singleCard = displayed.length === 1;

  if (collaborations.length === 0) return null;
  if (displayed.length === 0) return null;

  const venueCards = listToRender.map((venue, index) => {
    const isPremiumCard = singleCard && index === 0;
    const cardContent = (
      <>
        <div className="aspect-[4/3] flex-shrink-0 overflow-hidden">
          <img
            src={resolveLogoUrl(venue.logo_url)}
            alt={venue.name}
            className="w-full h-full object-cover transition-all duration-500 group-hover:scale-105"
            loading="lazy"
            decoding="async"
            draggable={false}
          />
        </div>
        <div className="flex-shrink-0 h-[5rem] flex flex-col items-center justify-center p-5 text-center">
          <p className="text-base font-sans font-medium text-foreground dark:text-white truncate w-full px-1">{venue.name}</p>
          <p className="text-xs text-muted-foreground dark:text-gray-400 uppercase tracking-wider mt-1.5 truncate w-full">{shortLocationForCard(venue.location)}</p>
        </div>
      </>
    );
    return (
      <div
        key={singleCard ? venue.id : `${venue.id}-${index}`}
        className="collaborations-logo-item flex-shrink-0 w-[300px] sm:w-[360px] md:w-[420px] flex flex-col group"
      >
        <Link to={`/collaborations/${venue.id}`} replace className="flex flex-col flex-1 min-h-0">
          {isPremiumCard ? (
            <div className="p-[1px] rounded-2xl bg-gradient-to-r from-primary/30 to-transparent transition-all duration-300 ease-out hover:from-primary/40 flex-1 flex flex-col min-h-0">
              <div className="bg-card rounded-2xl overflow-hidden border-0 shadow-elevation-1 dark:shadow-elevation-1-dark hover:shadow-card-hover dark:hover:shadow-card-hover-dark transition-all duration-300 ease-out hover:-translate-y-1 flex-1 flex flex-col min-h-0">
                {cardContent}
              </div>
            </div>
          ) : (
            <div className="bg-card rounded-xl overflow-hidden border border-border dark:border-white/10 shadow-elevation-1 dark:shadow-elevation-1-dark transition-all duration-300 ease-out hover:border-primary/40 dark:hover:border-primary/50 hover:shadow-card-hover dark:hover:shadow-card-hover-dark hover:ring-1 hover:ring-primary/20 hover:-translate-y-1 flex-1 flex flex-col min-h-0">
              {cardContent}
            </div>
          )}
        </Link>
      </div>
    );
  });

  return (
    <section className="relative z-20 overflow-x-hidden overflow-y-visible bg-transparent transition-colors duration-500 pt-12 md:pt-16 pb-0 md:pb-1 mb-[-1rem] md:mb-[-1.5rem]" aria-labelledby="partners-heading">
      {/* Section header – aligned with Reels/About */}
      <div className="container px-4 mx-auto max-w-7xl relative z-10">
        <motion.header
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="pl-5 md:pl-6 border-l-4 border-primary mb-8 md:mb-10 space-y-1"
        >
          <p className="text-primary font-sans font-semibold text-xs md:text-sm tracking-[0.2em] uppercase">
            Our Partners
          </p>
          <h2 id="partners-heading" className="font-serif font-medium leading-tight text-3xl md:text-4xl lg:text-5xl text-foreground">
            Trusted By <span className="italic text-primary">Elegant Venues</span>
          </h2>
          <p className="mt-4 max-w-xl text-muted-foreground text-base md:text-lg leading-relaxed font-sans">
            Premium venues and spaces we&apos;re proud to partner with.
          </p>
        </motion.header>
      </div>

      {/* Cards container – full viewport width; no background image in container */}
      <div className="w-screen min-w-screen ml-[calc(-50vw+50%)] overflow-hidden">
        {singleCard ? (
          <div
            className={`relative w-full min-w-0 rounded-none border border-primary/30 dark:border-primary/25 overflow-hidden py-5 md:py-6 shadow-[0_4px_24px_rgba(232,175,193,0.14)] dark:shadow-elevation-1-dark px-4 md:px-6 bg-white/55 dark:bg-card/50 backdrop-blur-sm dark:border-white/25`}
          >
            <div className="relative z-10">
              <div className="flex justify-center">{venueCards}</div>
            </div>
          </div>
        ) : (
          <CollaborationsMarqueeStrip itemCount={listToRender.length}>{venueCards}</CollaborationsMarqueeStrip>
        )}
      </div>
    </section>
  );
};

export default CollaborationsSection;
