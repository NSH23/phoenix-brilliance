import { useState, useEffect, useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

export interface CarouselCardData {
  id: number | string;
  imgUrl: string;
  content: string;
  title?: string;
}

export interface CarouselCardProps {
  data: CarouselCardData[];
  showCarousel?: boolean;
  cardsPerView?: number;
  onCardClick?: (index: number) => void;
}

const CarouselCard = ({ data, showCarousel = true, cardsPerView = 3, onCardClick }: CarouselCardProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isSingleCard, setIsSingleCard] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsSingleCard(data?.length === 1);
  }, [data]);

  const cardWidth = 75 / cardsPerView;

  const nextSlide = () => {
    if (isAnimating || !showCarousel || !data) return;
    if (data.length <= cardsPerView) return;

    setIsAnimating(true);
    const nextIndex = (currentIndex + 1) % data.length;

    if (containerRef.current) {
      containerRef.current.style.transition = "transform 500ms ease";
      containerRef.current.style.transform = `translateX(-${cardWidth}%)`;

      setTimeout(() => {
        setCurrentIndex(nextIndex);
        if (containerRef.current) {
          containerRef.current.style.transition = "none";
          containerRef.current.style.transform = "translateX(0)";
          void containerRef.current.offsetWidth;
          setIsAnimating(false);
        }
      }, 500);
    }
  };

  const prevSlide = () => {
    if (isAnimating || !showCarousel || !data) return;
    if (data.length <= cardsPerView) return;

    setIsAnimating(true);
    const prevIndex = (currentIndex - 1 + data.length) % data.length;

    if (containerRef.current) {
      containerRef.current.style.transition = "none";
      containerRef.current.style.transform = `translateX(-${cardWidth}%)`;
      setCurrentIndex(prevIndex);
      void containerRef.current.offsetWidth;
      containerRef.current.style.transition = "transform 500ms ease";
      containerRef.current.style.transform = "translateX(0)";

      setTimeout(() => {
        setIsAnimating(false);
      }, 500);
    }
  };

  const getVisibleCards = () => {
    if (!showCarousel || !data) return data || [];

    const visibleCards: CarouselCardData[] = [];
    const totalCards = data.length;

    for (let i = 0; i < cardsPerView + 1; i++) {
      const index = (currentIndex + i) % totalCards;
      visibleCards.push(data[index]);
    }

    return visibleCards;
  };

  if (!data || data.length === 0) {
    return <div className="text-sm text-muted-foreground">No card data available</div>;
  }

  return (
    <div className="w-full px-4">
      <div className={`relative ${isSingleCard ? "mx-auto max-w-sm" : "w-full"}`}>
        {showCarousel && data.length > cardsPerView && (
          <>
            <button
              type="button"
              onClick={prevSlide}
              className="absolute left-0 top-1/2 z-10 -translate-y-1/2 rounded-full bg-black/50 p-2 text-white transition-all duration-300 hover:bg-black/70"
              disabled={isAnimating}
              aria-label="Previous slide"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={nextSlide}
              className="absolute right-0 top-1/2 z-10 -translate-y-1/2 rounded-full bg-black/50 p-2 text-white transition-all duration-300 hover:bg-black/70"
              disabled={isAnimating}
              aria-label="Next slide"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </>
        )}

        <div className="overflow-hidden">
          <div
            ref={containerRef}
            className="flex"
            style={{
              transform: "translateX(0)",
              width: showCarousel ? `${((cardsPerView + 1) * 100) / cardsPerView}%` : "100%",
            }}
          >
            {getVisibleCards().map((card, idx) => (
              <div
                key={`card-${currentIndex}-${idx}`}
                style={{
                  width: showCarousel
                    ? `${100 / (cardsPerView + 1)}%`
                    : `${100 / Math.min(cardsPerView, data.length)}%`,
                }}
                className="px-2"
              >
                <button
                  type="button"
                  onClick={() => onCardClick?.((currentIndex + idx) % data.length)}
                  className="group relative block h-full w-full overflow-hidden rounded-xl border border-border/60 bg-card text-left shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  <div className="h-56 w-full sm:h-64">
                    <img
                      src={card.imgUrl}
                      alt={card.title ?? ""}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      loading="lazy"
                      decoding="async"
                    />
                  </div>
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent opacity-80 sm:opacity-0 sm:transition-opacity sm:duration-300 sm:group-hover:opacity-100" />
                  <div className="pointer-events-none absolute inset-0 flex flex-col justify-end translate-y-0 sm:translate-y-full sm:group-hover:translate-y-0 transition-transform duration-300 ease-out">
                    <div className="bg-black/75 p-3 sm:p-4 backdrop-blur-[2px]">
                      {card.title ? <p className="mb-0.5 line-clamp-1 text-sm font-semibold text-white">{card.title}</p> : null}
                      <p className="line-clamp-2 text-xs text-white/80 sm:text-sm">{card.content}</p>
                    </div>
                  </div>
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CarouselCard;
