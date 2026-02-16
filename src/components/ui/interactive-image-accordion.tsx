import { useState } from "react";
import { cn } from "@/lib/utils";

interface AccordionItem {
  id: string;
  title: string;
  subtitle: string;
  image: string;
  alt: string;
}

interface InteractiveImageAccordionProps {
  items: AccordionItem[];
  className?: string;
}

const InteractiveImageAccordion = ({
  items,
  className,
}: InteractiveImageAccordionProps) => {
  const [activeIndex, setActiveIndex] = useState(0);

  return (
    <div className={cn("w-full", className)}>
      {/* Desktop Accordion */}
      <div className="hidden md:flex h-[520px] lg:h-[560px] gap-2 rounded-xl overflow-hidden">
        {items.map((item, index) => {
          const isActive = activeIndex === index;

          return (
            <div
              key={item.id}
              className={cn(
                "relative cursor-pointer overflow-hidden rounded-xl transition-all duration-700 ease-[cubic-bezier(0.25,0.8,0.25,1)]",
                isActive ? "flex-[4]" : "flex-[0.8]"
              )}
              onMouseEnter={() => setActiveIndex(index)}
            >
              {/* Image */}
              <img
                src={item.image}
                alt={item.alt}
                className="absolute inset-0 w-full h-full object-cover"
                loading="lazy"
              />

              {/* Overlay */}
              <div
                className={cn(
                  "absolute inset-0 transition-all duration-700",
                  isActive
                    ? "bg-foreground/30"
                    : "bg-foreground/50"
                )}
              />

              {/* Content */}
              <div className="absolute inset-0 flex flex-col justify-end p-5 lg:p-6">
                {/* Collapsed label - rotated */}
                <div
                  className={cn(
                    "absolute inset-0 flex items-center justify-center transition-opacity duration-500",
                    isActive ? "opacity-0 pointer-events-none" : "opacity-100"
                  )}
                >
                  <span className="text-primary-foreground font-display text-lg tracking-wide whitespace-nowrap -rotate-90">
                    {item.title}
                  </span>
                </div>

                {/* Expanded content */}
                <div
                  className={cn(
                    "transition-all duration-700 transform",
                    isActive
                      ? "opacity-100 translate-y-0"
                      : "opacity-0 translate-y-4 pointer-events-none"
                  )}
                >
                  <div className="bg-background/10 backdrop-blur-sm rounded-lg px-5 py-4 border border-primary-foreground/10">
                    <h3 className="font-display text-xl lg:text-2xl font-medium text-primary-foreground mb-1">
                      {item.title}
                    </h3>
                    <p className="text-primary-foreground/70 font-sans text-sm leading-relaxed">
                      {item.subtitle}
                    </p>
                  </div>
                </div>
              </div>

              {/* Active indicator line */}
              <div
                className={cn(
                  "absolute bottom-0 left-0 right-0 h-1 bg-primary transition-all duration-500",
                  isActive ? "opacity-100" : "opacity-0"
                )}
              />
            </div>
          );
        })}
      </div>

      {/* Mobile Stack */}
      <div className="flex flex-col gap-3 md:hidden">
        {items.map((item, index) => (
          <button
            key={item.id}
            className={cn(
              "relative overflow-hidden rounded-xl transition-all duration-500 text-left",
              activeIndex === index ? "h-56" : "h-20"
            )}
            onClick={() => setActiveIndex(index)}
          >
            {/* Image */}
            <img
              src={item.image}
              alt={item.alt}
              className="absolute inset-0 w-full h-full object-cover"
              loading="lazy"
            />

            {/* Overlay */}
            <div
              className={cn(
                "absolute inset-0 transition-all duration-500",
                activeIndex === index
                  ? "bg-foreground/35"
                  : "bg-foreground/55"
              )}
            />

            {/* Content */}
            <div className="absolute inset-0 flex items-end p-4">
              <div>
                <h3 className="font-display text-lg font-medium text-primary-foreground">
                  {item.title}
                </h3>
                {activeIndex === index && (
                  <p className="text-primary-foreground/70 font-sans text-xs mt-1 animate-fade-in">
                    {item.subtitle}
                  </p>
                )}
              </div>
            </div>

            {/* Active indicator */}
            {activeIndex === index && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
            )}
          </button>
        ))}
      </div>
    </div>
  );
};

export default InteractiveImageAccordion;

