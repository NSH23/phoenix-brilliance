"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface CardItem {
    id: string | number;
    title: string;
    description: string;
    imgSrc: string;
    icon: React.ReactNode;
    linkHref: string;
    /** Optional fallback image URL when imgSrc fails to load (e.g. 404) */
    fallbackImgSrc?: string;
}

interface ExpandingCardsProps extends React.HTMLAttributes<HTMLUListElement> {
    items: CardItem[];
    defaultActiveIndex?: number;
    /** Fallback image when any item's imgSrc fails to load */
    fallbackImgSrc?: string;
}

export const ExpandingCards = React.forwardRef<
    HTMLUListElement,
    ExpandingCardsProps
>(({ className, items, defaultActiveIndex = 0, fallbackImgSrc, ...props }, ref) => {
    const [activeIndex, setActiveIndex] = React.useState<number | null>(
        defaultActiveIndex,
    );
    const [failedIndices, setFailedIndices] = React.useState<Set<number>>(new Set());

    const [isDesktop, setIsDesktop] = React.useState(false);

    React.useEffect(() => {
        const handleResize = () => {
            setIsDesktop(window.innerWidth >= 768);
        };
        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const gridStyle = React.useMemo(() => {
        if (activeIndex === null) return {};

        if (isDesktop) {
            const columns = items
                .map((_, index) => (index === activeIndex ? "6fr" : "1.25fr"))
                .join(" ");
            return { gridTemplateColumns: columns };
        } else {
            const rows = items
                .map((_, index) => (index === activeIndex ? "5fr" : "1fr"))
                .join(" ");
            return { gridTemplateRows: rows };
        }
    }, [activeIndex, items.length, isDesktop]);

    const handleInteraction = (index: number) => {
        setActiveIndex(index);
    };

    const handleImageError = (index: number) => {
        setFailedIndices((prev) => new Set(prev).add(index));
    };

    const getImgSrc = (item: CardItem, index: number) => {
        if (failedIndices.has(index)) {
            return item.fallbackImgSrc || fallbackImgSrc || '';
        }
        return item.imgSrc;
    };

    return (
        <ul
            className={cn(
                "w-full gap-2",
                "grid",
                "h-[400px] md:h-[340px]",
                "transition-[grid-template-columns,grid-template-rows] duration-500 ease-out",
                className,
            )}
            style={{
                ...gridStyle,
                ...(isDesktop
                    ? { gridTemplateRows: '1fr' }
                    : { gridTemplateColumns: '1fr' }
                )
            }}
            ref={ref}
            {...props}
        >
            {items.map((item, index) => (
                <li
                    key={item.id}
                    className={cn(
                        "group relative cursor-pointer overflow-hidden rounded-2xl border-2 border-charcoal/35 dark:border-white/30 bg-card text-card-foreground shadow-elevation-1 dark:shadow-elevation-1-dark transition-all duration-300 ease-out hover:border-charcoal/60 dark:hover:border-white/55 hover:shadow-card-hover dark:hover:shadow-card-hover-dark hover:ring-2 hover:ring-charcoal/15 dark:hover:ring-white/15 hover:-translate-y-1",
                        "md:min-w-[120px]",
                        "min-h-0 min-w-0"
                    )}
                    onMouseEnter={() => handleInteraction(index)}
                    onFocus={() => handleInteraction(index)}
                    onClick={() => handleInteraction(index)}
                    tabIndex={0}
                    data-active={activeIndex === index}
                >
                    <img
                        src={getImgSrc(item, index) || item.imgSrc}
                        alt={item.title}
                        className="absolute inset-0 h-full w-full object-cover transition-all duration-300 ease-out group-data-[active=true]:scale-100 scale-110 brightness-[0.92] group-data-[active=true]:brightness-100"
                        loading="lazy"
                        decoding="async"
                        onError={() => handleImageError(index)}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-transparent/50 transition-opacity duration-300 group-data-[active=true]:from-black/80 group-data-[active=true]:via-black/40 group-data-[active=true]:to-transparent" />

                    <article
                        className="absolute inset-0 flex flex-col justify-end gap-2 p-4"
                    >
                        {/* Collapsed: horizontal title with good contrast so it's always visible */}
                        <h3 className="hidden md:block absolute bottom-4 left-4 right-4 text-left text-sm font-sans font-medium uppercase tracking-[0.12em] text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)] line-clamp-2 opacity-100 transition-opacity duration-300 group-data-[active=true]:opacity-0">
                            {item.title}
                        </h3>

                        <div className="text-white/90 opacity-0 transition-all duration-300 delay-75 ease-out group-data-[active=true]:opacity-100">
                            {item.icon}
                        </div>

                        <h3 className="text-xl font-serif font-semibold text-white opacity-0 transition-all duration-300 delay-150 ease-out group-data-[active=true]:opacity-100">
                            {item.title}
                        </h3>

                        <p className="w-full max-w-sm text-sm text-white/80 opacity-0 transition-all duration-300 delay-225 ease-out group-data-[active=true]:opacity-100 font-sans">
                            {item.description}
                        </p>
                    </article>
                </li>
            ))}
        </ul>
    );
});
ExpandingCards.displayName = "ExpandingCards";
