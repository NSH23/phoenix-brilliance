import React, { useRef, useState, useEffect } from "react";
import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { X, Play } from "lucide-react";
import { OptimizedImage } from "@/components/ui/optimized-image";

export type BentoGalleryItem = {
  id: number | string;
  title: string;
  desc: string;
  url: string;
  span?: string;
  isVideo?: boolean;
};

export interface InteractiveImageBentoGalleryProps {
  imageItems: BentoGalleryItem[];
  title?: string;
  description?: string;
  onItemClick?: (item: BentoGalleryItem, index: number) => void;
  /** When true, clicking opens the built-in modal instead of calling onItemClick. */
  useBuiltInModal?: boolean;
  className?: string;
}

const containerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: "spring", stiffness: 100, damping: 15 },
  },
};

const ImageModal = ({ item, onClose }: { item: BentoGalleryItem; onClose: () => void }) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        className="relative w-full max-w-4xl p-4"
        onClick={(e) => e.stopPropagation()}
      >
        <OptimizedImage
          src={item.url}
          alt={item.title}
          preset="lightbox"
          loading="eager"
          className="h-auto max-h-[90vh] w-full rounded-lg object-contain"
        />
      </motion.div>
      <button
        type="button"
        onClick={onClose}
        className="absolute right-4 top-4 text-white/80 transition-colors hover:text-white"
        aria-label="Close image view"
      >
        <X size={24} />
      </button>
    </motion.div>
  );
};

const InteractiveImageBentoGallery: React.FC<InteractiveImageBentoGalleryProps> = ({
  imageItems,
  title,
  description,
  onItemClick,
  useBuiltInModal = true,
  className,
}) => {
  const [selectedItem, setSelectedItem] = useState<BentoGalleryItem | null>(null);
  const [dragConstraint, setDragConstraint] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const targetRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const calculateConstraints = () => {
      if (gridRef.current && containerRef.current) {
        const containerWidth = containerRef.current.offsetWidth;
        const gridWidth = gridRef.current.scrollWidth;
        const newConstraint = Math.min(0, containerWidth - gridWidth - 32);
        setDragConstraint(newConstraint);
      }
    };

    calculateConstraints();
    window.addEventListener("resize", calculateConstraints);
    return () => window.removeEventListener("resize", calculateConstraints);
  }, [imageItems]);

  const { scrollYProgress } = useScroll({
    target: targetRef,
    offset: ["start end", "end start"],
  });
  const opacity = useTransform(scrollYProgress, [0, 0.2, 0.8, 1], [0, 1, 1, 0]);
  const y = useTransform(scrollYProgress, [0, 0.2], [30, 0]);

  const handleItemClick = (item: BentoGalleryItem, index: number) => {
    if (onItemClick) {
      onItemClick(item, index);
      return;
    }
    if (useBuiltInModal) {
      setSelectedItem(item);
    }
  };

  return (
    <section ref={targetRef} className={cn("relative w-full overflow-hidden", className)}>
      {title || description ? (
        <motion.div style={{ opacity, y }} className="container mx-auto px-4 text-center">
          {title ? (
            <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">{title}</h2>
          ) : null}
          {description ? (
            <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">{description}</p>
          ) : null}
        </motion.div>
      ) : null}

      <div ref={containerRef} className="relative mt-6 w-full cursor-grab active:cursor-grabbing sm:mt-8">
        <motion.div
          className="w-max"
          drag="x"
          dragConstraints={{ left: dragConstraint, right: 0 }}
          dragElastic={0.05}
        >
          <motion.div
            ref={gridRef}
            className="grid auto-cols-[minmax(14rem,1fr)] grid-flow-col gap-3 px-1 sm:auto-cols-[minmax(15rem,1fr)] sm:gap-4 sm:px-4 md:px-8"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
          >
            {imageItems.map((item, index) => (
              <motion.button
                key={item.id}
                type="button"
                variants={itemVariants}
                className={cn(
                  "group relative flex h-full min-h-[15rem] w-full min-w-[14rem] cursor-pointer items-end overflow-hidden rounded-xl border border-border/60 bg-card p-4 text-left shadow-sm transition-shadow duration-300 ease-in-out hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background sm:min-w-[15rem]",
                  item.span,
                )}
                whileHover={{ scale: 1.02 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                onClick={() => handleItemClick(item, index)}
                aria-label={`View ${item.title}`}
              >
                <OptimizedImage
                  src={item.url}
                  alt={item.title}
                  preset="card"
                  className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent opacity-80 transition-opacity duration-500 group-hover:opacity-100 sm:opacity-0 sm:group-hover:opacity-100" />
                {item.isVideo ? (
                  <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/20">
                    <Play className="h-10 w-10 text-white drop-shadow-md" fill="currentColor" />
                  </div>
                ) : null}
                <div className="relative z-10 translate-y-0 opacity-100 transition-all duration-500 sm:translate-y-4 sm:opacity-0 sm:group-hover:translate-y-0 sm:group-hover:opacity-100">
                  <h3 className="text-base font-bold text-white sm:text-lg">{item.title}</h3>
                  {item.desc ? <p className="mt-1 text-xs text-white/80 sm:text-sm">{item.desc}</p> : null}
                </div>
              </motion.button>
            ))}
          </motion.div>
        </motion.div>
      </div>

      <AnimatePresence>
        {selectedItem && useBuiltInModal && !onItemClick ? (
          <ImageModal item={selectedItem} onClose={() => setSelectedItem(null)} />
        ) : null}
      </AnimatePresence>
    </section>
  );
};

export default InteractiveImageBentoGallery;
