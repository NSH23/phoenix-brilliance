import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, useCallback } from "react";
import { X, ChevronLeft, ChevronRight, Heart, Share2, Download, ZoomIn } from "lucide-react";

const galleryImages = [
  { src: "/gallery wedding.jpg", category: "Wedding", title: "Royal Wedding Reception", featured: true },
  { src: "/wedding.jpg", category: "Wedding", title: "Floral Mandap Setup", featured: true },
  { src: "/engagement.jpg", category: "Wedding", title: "Romantic Engagement", featured: false },
  { src: "/birthday.jpg", category: "Parties", title: "Elegant Birthday Celebration", featured: false },
  { src: "/sangeet.jpg", category: "Traditional", title: "Vibrant Sangeet Night", featured: true },
  { src: "/haldi.jpg", category: "Traditional", title: "Traditional Haldi Ceremony", featured: false },
  { src: "/mehendi.jpg", category: "Traditional", title: "Colorful Mehendi Setup", featured: false },
  { src: "/anniversary.jpg", category: "Parties", title: "Romantic Anniversary Dinner", featured: false },
  { src: "/coprate.jpg", category: "Corporate", title: "Corporate Conference", featured: true },
  { src: "/coprate.jpg", category: "Corporate", title: "Luxury Car Launch", featured: false },
];

const categories = ["All", "Wedding", "Corporate", "Traditional", "Parties"];

const GallerySection = () => {
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [lightboxImage, setLightboxImage] = useState<number | null>(null);
  const [likedImages, setLikedImages] = useState<Set<number>>(new Set());
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const filteredImages = selectedCategory === "All" 
    ? galleryImages 
    : galleryImages.filter(img => img.category === selectedCategory);

  const navigateLightbox = useCallback((direction: "prev" | "next") => {
    if (lightboxImage === null) return;
    if (direction === "prev") {
      setLightboxImage(lightboxImage === 0 ? filteredImages.length - 1 : lightboxImage - 1);
    } else {
      setLightboxImage(lightboxImage === filteredImages.length - 1 ? 0 : lightboxImage + 1);
    }
  }, [lightboxImage, filteredImages.length]);

  // Keyboard navigation for lightbox
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (lightboxImage === null) return;
      if (e.key === "ArrowLeft") navigateLightbox("prev");
      if (e.key === "ArrowRight") navigateLightbox("next");
      if (e.key === "Escape") setLightboxImage(null);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [lightboxImage, navigateLightbox]);

  const toggleLike = (index: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setLikedImages(prev => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        newSet.add(index);
      }
      return newSet;
    });
  };

  const getGridClass = (index: number) => {
    // Create varied grid layout
    if (index === 0 || index === 5) return "sm:col-span-2 sm:row-span-2";
    if (index === 3) return "sm:col-span-2";
    return "";
  };

  const getAspectClass = (index: number) => {
    if (index === 0 || index === 5) return "aspect-square";
    if (index === 3) return "aspect-[2/1]";
    if (index % 2 === 0) return "aspect-[4/5]";
    return "aspect-[3/4]";
  };

  return (
    <section id="gallery" className="py-16 sm:py-24 bg-background relative overflow-hidden">
      {/* Decorative Background */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
        <div className="absolute top-1/4 left-0 w-[300px] sm:w-[500px] h-[300px] sm:h-[500px] bg-primary/5 rounded-full blur-[80px] sm:blur-[100px] -translate-x-1/2" />
        <div className="absolute bottom-1/4 right-0 w-[250px] sm:w-[400px] h-[250px] sm:h-[400px] bg-rose-gold/5 rounded-full blur-[60px] sm:blur-[80px] translate-x-1/2" />
        <div className="absolute top-1/2 left-1/2 w-[200px] sm:w-[300px] h-[200px] sm:h-[300px] bg-champagne/5 rounded-full blur-[50px] sm:blur-[60px] -translate-x-1/2 -translate-y-1/2" />
      </div>

      <div className="container mx-auto px-4 relative">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center mb-10 sm:mb-16"
        >
          <motion.span 
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="inline-flex items-center gap-2 px-4 sm:px-5 py-2 sm:py-2.5 rounded-full 
                     bg-gradient-to-r from-primary/20 to-rose-gold/20 
                     border border-primary/30 backdrop-blur-sm mb-4 sm:mb-6"
          >
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <span className="text-xs sm:text-sm font-medium text-foreground">Our Portfolio</span>
          </motion.span>
          
          <h2 className="section-title mb-4 sm:mb-6">
            Moments We've <span className="text-gradient-gold">Captured</span>
          </h2>
          <p className="section-subtitle max-w-2xl mx-auto text-sm sm:text-base">
            Every frame tells a story of love, celebration, and unforgettable memories.
          </p>
        </motion.div>

        {/* Category Filters - Scrollable on mobile */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="flex justify-start sm:justify-center gap-2 sm:gap-3 mb-8 sm:mb-14 
                   overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0"
        >
          {categories.map((category, idx) => (
            <motion.button
              key={category}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.3, delay: 0.3 + idx * 0.05 }}
              onClick={() => setSelectedCategory(category)}
              className={`relative px-4 sm:px-7 py-2.5 sm:py-3 rounded-full text-xs sm:text-sm font-semibold 
                        transition-all duration-400 overflow-hidden whitespace-nowrap flex-shrink-0 ${
                selectedCategory === category
                  ? "bg-primary text-primary-foreground shadow-lg shadow-primary/30"
                  : "bg-muted/80 text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
            >
              <span className="relative z-10">{category}</span>
            </motion.button>
          ))}
        </motion.div>

        {/* Grid Gallery - Better Mobile Layout */}
        <motion.div 
          layout
          className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-5"
        >
          <AnimatePresence mode="popLayout">
            {filteredImages.map((image, index) => (
              <motion.div
                key={`${image.title}-${selectedCategory}`}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ 
                  duration: 0.3, 
                  delay: index * 0.03,
                  layout: { duration: 0.3 }
                }}
                className={`relative group cursor-pointer ${
                  // Featured items span 2 columns on larger screens only
                  index === 0 ? 'sm:col-span-2 sm:row-span-2' : ''
                }`}
                onClick={() => setLightboxImage(index)}
                onMouseEnter={() => setHoveredIndex(index)}
                onMouseLeave={() => setHoveredIndex(null)}
              >
                {/* Card Container */}
                <div className={`relative h-full w-full rounded-xl sm:rounded-2xl overflow-hidden
                              bg-gradient-to-br from-primary/10 via-card to-rose-gold/10 p-0.5 sm:p-1
                              shadow-md sm:shadow-lg transition-all duration-500 
                              ${hoveredIndex === index ? 'shadow-xl shadow-primary/20 scale-[1.02]' : ''}
                              ${image.featured ? 'ring-1 sm:ring-2 ring-primary/30' : ''}`}
                >
                  {/* Inner Image Container */}
                  <div className="relative h-full w-full rounded-lg sm:rounded-xl overflow-hidden aspect-[3/4] sm:aspect-auto">
                    <img
                      src={image.src}
                      alt={image.title}
                      className={`w-full h-full object-cover transition-all duration-500 
                                ${hoveredIndex === index ? 'scale-110 brightness-90' : 'scale-100'}`}
                      loading="lazy"
                    />
                    
                    {/* Gradient Overlays */}
                    <div className="absolute inset-0 bg-gradient-to-t from-charcoal/80 via-charcoal/30 to-transparent 
                                  opacity-70 group-hover:opacity-85 transition-opacity duration-500" />
                    
                    {/* Featured Badge */}
                    {image.featured && (
                      <div className="absolute top-2 right-2 sm:top-3 sm:right-3 px-2 sm:px-3 py-0.5 sm:py-1 rounded-full 
                                   bg-primary/90 backdrop-blur-sm text-[10px] sm:text-xs font-semibold text-primary-foreground
                                   flex items-center gap-1">
                        <span className="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-primary-foreground animate-pulse" />
                        <span className="hidden sm:inline">Featured</span>
                        <span className="sm:hidden">★</span>
                      </div>
                    )}

                    {/* Like Button - Hidden on mobile for cleaner look */}
                    <motion.div 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: hoveredIndex === index ? 1 : 0 }}
                      className="absolute top-2 left-2 sm:top-3 sm:left-3 hidden sm:flex gap-2"
                    >
                      <button
                        onClick={(e) => toggleLike(index, e)}
                        className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full backdrop-blur-md 
                                  flex items-center justify-center transition-all duration-300
                                  ${likedImages.has(index) 
                                    ? 'bg-red-500 text-white' 
                                    : 'bg-charcoal/50 text-ivory hover:bg-red-500/80 hover:text-white'}`}
                      >
                        <Heart className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${likedImages.has(index) ? 'fill-current' : ''}`} />
                      </button>
                    </motion.div>

                    {/* View Icon - Smaller on mobile */}
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.5 }}
                      animate={{ 
                        opacity: hoveredIndex === index ? 1 : 0,
                        scale: hoveredIndex === index ? 1 : 0.5
                      }}
                      className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 hidden sm:block"
                    >
                      <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-primary/90 backdrop-blur-sm
                                    flex items-center justify-center shadow-xl">
                        <ZoomIn className="w-5 h-5 sm:w-6 sm:h-6 text-primary-foreground" />
                      </div>
                    </motion.div>

                    {/* Bottom Caption - Compact on mobile */}
                    <div className="absolute bottom-0 left-0 right-0 p-2.5 sm:p-4">
                      <p className="font-serif text-xs sm:text-base lg:text-lg text-ivory font-medium line-clamp-1">
                        {image.title}
                      </p>
                      <div className="flex items-center gap-1.5 sm:gap-2 mt-0.5 sm:mt-1">
                        <span className="text-[10px] sm:text-xs text-ivory/70 uppercase tracking-wider">
                          {image.category}
                        </span>
                        <span className="w-1 h-1 rounded-full bg-primary hidden sm:block" />
                        <span className="text-[10px] sm:text-xs text-primary hidden sm:inline">View</span>
                      </div>
                    </div>

                    {/* Corner Accents - Hidden on mobile */}
                    <div className="absolute top-1.5 left-1.5 w-4 h-4 sm:w-6 sm:h-6 border-l-2 border-t-2 border-primary/40 rounded-tl-lg 
                                  opacity-0 group-hover:opacity-100 transition-opacity duration-500 hidden sm:block" />
                    <div className="absolute top-1.5 right-1.5 w-4 h-4 sm:w-6 sm:h-6 border-r-2 border-t-2 border-primary/40 rounded-tr-lg 
                                  opacity-0 group-hover:opacity-100 transition-opacity duration-500 hidden sm:block" />
                    <div className="absolute bottom-1.5 left-1.5 w-4 h-4 sm:w-6 sm:h-6 border-l-2 border-b-2 border-primary/40 rounded-bl-lg 
                                  opacity-0 group-hover:opacity-100 transition-opacity duration-500 hidden sm:block" />
                    <div className="absolute bottom-1.5 right-1.5 w-4 h-4 sm:w-6 sm:h-6 border-r-2 border-b-2 border-primary/40 rounded-br-lg 
                                  opacity-0 group-hover:opacity-100 transition-opacity duration-500 hidden sm:block" />
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>

        {/* View More CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="text-center mt-14"
        >
          <a
            href="/contact"
            className="inline-flex items-center gap-3 px-8 py-4 rounded-full
                     bg-gradient-to-r from-primary/10 to-rose-gold/10 
                     border-2 border-primary/30 text-foreground font-semibold
                     hover:border-primary hover:shadow-xl hover:shadow-primary/20
                     transition-all duration-300 group"
          >
            <span>Want to See More?</span>
            <span className="text-primary group-hover:translate-x-1 transition-transform">→</span>
          </a>
        </motion.div>
      </div>

      {/* Enhanced Lightbox */}
      <AnimatePresence>
        {lightboxImage !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-charcoal/98 backdrop-blur-xl flex items-center justify-center"
            onClick={() => setLightboxImage(null)}
          >
            {/* Top Bar */}
            <div className="absolute top-0 left-0 right-0 p-4 flex items-center justify-between z-20">
              <div className="text-ivory">
                <span className="text-ivory/60">{lightboxImage + 1}</span>
                <span className="mx-2 text-ivory/40">/</span>
                <span className="text-ivory/60">{filteredImages.length}</span>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={(e) => { e.stopPropagation(); toggleLike(lightboxImage, e); }}
                  className={`w-10 h-10 rounded-full backdrop-blur-md flex items-center justify-center 
                            transition-all duration-300 ${
                    likedImages.has(lightboxImage) 
                      ? 'bg-red-500 text-white' 
                      : 'bg-ivory/10 text-ivory hover:bg-red-500/80'
                  }`}
                >
                  <Heart className={`w-5 h-5 ${likedImages.has(lightboxImage) ? 'fill-current' : ''}`} />
                </button>
                <button
                  onClick={(e) => e.stopPropagation()}
                  className="w-10 h-10 rounded-full bg-ivory/10 backdrop-blur-md
                           flex items-center justify-center text-ivory hover:bg-ivory/20 transition-colors"
                >
                  <Share2 className="w-5 h-5" />
                </button>
                <button
                  onClick={(e) => e.stopPropagation()}
                  className="w-10 h-10 rounded-full bg-ivory/10 backdrop-blur-md
                           flex items-center justify-center text-ivory hover:bg-ivory/20 transition-colors"
                >
                  <Download className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setLightboxImage(null)}
                  className="w-10 h-10 rounded-full bg-ivory/10 backdrop-blur-md
                           flex items-center justify-center text-ivory hover:bg-primary transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Navigation Buttons */}
            <button
              onClick={(e) => { e.stopPropagation(); navigateLightbox("prev"); }}
              className="absolute left-4 md:left-8 top-1/2 -translate-y-1/2 w-14 h-14 rounded-full 
                       bg-ivory/10 backdrop-blur-md flex items-center justify-center text-ivory 
                       hover:bg-primary transition-all duration-300 hover:scale-110 z-20"
            >
              <ChevronLeft className="w-7 h-7" />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); navigateLightbox("next"); }}
              className="absolute right-4 md:right-8 top-1/2 -translate-y-1/2 w-14 h-14 rounded-full 
                       bg-ivory/10 backdrop-blur-md flex items-center justify-center text-ivory 
                       hover:bg-primary transition-all duration-300 hover:scale-110 z-20"
            >
              <ChevronRight className="w-7 h-7" />
            </button>

            {/* Main Image */}
            <motion.div
              key={lightboxImage}
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: -20 }}
              transition={{ duration: 0.3 }}
              className="max-w-6xl max-h-[85vh] px-4 md:px-20"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="relative rounded-2xl overflow-hidden shadow-2xl">
                <img
                  src={filteredImages[lightboxImage].src}
                  alt={filteredImages[lightboxImage].title}
                  className="max-w-full max-h-[75vh] object-contain mx-auto"
                />
                
                {/* Image Info */}
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="absolute bottom-0 left-0 right-0 p-6 md:p-8 
                           bg-gradient-to-t from-charcoal via-charcoal/80 to-transparent"
                >
                  <div className="flex items-end justify-between">
                    <div>
                      <span className="inline-block px-3 py-1 rounded-full bg-primary/20 text-primary 
                                     text-xs font-medium mb-2 uppercase tracking-wider">
                        {filteredImages[lightboxImage].category}
                      </span>
                      <h3 className="font-serif text-2xl md:text-3xl text-ivory font-bold">
                        {filteredImages[lightboxImage].title}
                      </h3>
                    </div>
                    {filteredImages[lightboxImage].featured && (
                      <span className="hidden md:flex items-center gap-2 px-4 py-2 rounded-full 
                                     bg-primary text-primary-foreground text-sm font-semibold">
                        <Heart className="w-4 h-4" />
                        Featured Work
                      </span>
                    )}
                  </div>
                </motion.div>
              </div>
            </motion.div>

            {/* Thumbnail Strip */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 px-4 py-2 
                          rounded-full bg-charcoal/80 backdrop-blur-md overflow-x-auto max-w-[90vw]">
              {filteredImages.slice(0, 8).map((img, idx) => (
                <button
                  key={idx}
                  onClick={(e) => { e.stopPropagation(); setLightboxImage(idx); }}
                  className={`w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 
                            transition-all duration-300 ${
                    idx === lightboxImage 
                      ? 'ring-2 ring-primary scale-110' 
                      : 'opacity-50 hover:opacity-100'
                  }`}
                >
                  <img src={img.src} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
};

export default GallerySection;
