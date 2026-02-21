import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { X, ChevronLeft, ChevronRight, Heart, ZoomIn, Loader2 } from "lucide-react";
import { getGalleryImagesForHomepage, getGalleryCategories, GalleryImage } from "@/services/gallery";
import { getSiteSettingOptional } from "@/services/siteContent";
import { logger } from "@/utils/logger";

const HOMEPAGE_GALLERY_FETCH_LIMIT = 50;

export const PORTFOLIO_TEMPLATES = {
  '1': { id: '1', capacity: 9, name: '3×3 Grid', layout: 'grid-3x3' as const },
  '2': { id: '2', capacity: 10, name: '4+3+3', layout: 'grid-4-3-3' as const },
  '3': { id: '3', capacity: 9, name: 'Collage', layout: 'collage' as const },
} as const;

export type PortfolioTemplateId = keyof typeof PORTFOLIO_TEMPLATES;

const GallerySection = () => {
  const [galleryImages, setGalleryImages] = useState<GalleryImage[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [templateId, setTemplateId] = useState<PortfolioTemplateId>('1');
  const [lightboxImage, setLightboxImage] = useState<number | null>(null);
  const [likedImages, setLikedImages] = useState<Set<string>>(new Set());
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadGallery();
  }, []);

  const loadGallery = async () => {
    try {
      setIsLoading(true);
      const [images, cats, t] = await Promise.all([
        getGalleryImagesForHomepage(HOMEPAGE_GALLERY_FETCH_LIMIT),
        getGalleryCategories(),
        getSiteSettingOptional('homepage_portfolio_template'),
      ]);
      setGalleryImages(images);
      setCategories(['All', ...cats]);
      setTemplateId((t && t in PORTFOLIO_TEMPLATES) ? (t as PortfolioTemplateId) : '1');
    } catch (error: any) {
      logger.error('Error loading gallery', error, { component: 'GallerySection' });
      setGalleryImages([]);
      setCategories(['All']);
    } finally {
      setIsLoading(false);
    }
  };

  const tpl = PORTFOLIO_TEMPLATES[templateId];
  const capacity = tpl.capacity;

  const filteredImages = selectedCategory === "All" 
    ? galleryImages 
    : galleryImages.filter(img => img.category === selectedCategory);

  const displayed = filteredImages.slice(0, capacity);
  const showViewMore = filteredImages.length > capacity;

  const navigateLightbox = useCallback((direction: "prev" | "next") => {
    if (lightboxImage === null) return;
    const len = displayed.length;
    if (direction === "prev") {
      setLightboxImage(lightboxImage === 0 ? len - 1 : lightboxImage - 1);
    } else {
      setLightboxImage(lightboxImage === len - 1 ? 0 : lightboxImage + 1);
    }
  }, [lightboxImage, displayed.length]);

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

  const getItemClassName = (index: number) => {
    if (tpl.layout === 'grid-3x3') return '';
    if (tpl.layout === 'grid-4-3-3') {
      if (index === 4) return 'sm:col-start-2';
      if (index === 5) return 'sm:col-start-3';
      if (index === 6) return 'sm:col-start-4';
      return '';
    }
    if (tpl.layout === 'collage') return index === 0 ? 'sm:col-span-2 sm:row-span-2' : '';
    return '';
  };

  const toggleLike = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setLikedImages(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
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

        {/* Category Filters */}
        {categories.length > 1 && (
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
        )}

        {/* Loading State */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : displayed.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No gallery images available at the moment.</p>
          </div>
        ) : (
          <>
            {/* Grid Gallery - layout depends on template */}
            <motion.div 
              layout
              className={`grid grid-cols-2 gap-3 sm:gap-4 lg:gap-5 ${
                tpl.layout === 'grid-3x3' ? 'sm:grid-cols-3' : 'sm:grid-cols-4'
              }`}
            >
              <AnimatePresence mode="popLayout">
                {displayed.map((image, index) => (
                  <motion.div
                    key={image.id}
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ 
                      duration: 0.3, delay: index * 0.03, layout: { duration: 0.3 }
                    }}
                    className={`relative group cursor-pointer ${getItemClassName(index)}`}
                    onClick={() => setLightboxImage(index)}
                    onMouseEnter={() => setHoveredIndex(index)}
                    onMouseLeave={() => setHoveredIndex(null)}
                  >
                    {/* Card Container */}
                    <div className={`relative h-full w-full rounded-xl sm:rounded-2xl overflow-hidden
                                  bg-gradient-to-br from-primary/10 via-card to-rose-gold/10 p-0.5 sm:p-1
                                  shadow-md sm:shadow-lg transition-all duration-500 
                                  ${hoveredIndex === index ? 'shadow-xl shadow-primary/20 scale-[1.02]' : ''}
                                  ${image.is_featured ? 'ring-1 sm:ring-2 ring-primary/30' : ''}`}
                    >
                      {/* Inner Image Container */}
                      <div className="relative h-full w-full rounded-lg sm:rounded-xl overflow-hidden aspect-[3/4] sm:aspect-auto">
                        <img
                          src={image.url || '/placeholder.svg'}
                          alt={image.title || 'Gallery image'}
                          draggable={false}
                          className={`w-full h-full object-cover transition-all duration-500 
                                    ${hoveredIndex === index ? 'scale-110 brightness-90' : 'scale-100'}`}
                          loading="lazy"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = '/placeholder.svg';
                          }}
                        />
                        
                        {/* Gradient Overlays */}
                        <div className="absolute inset-0 bg-gradient-to-t from-charcoal/80 via-charcoal/30 to-transparent 
                                      opacity-70 group-hover:opacity-85 transition-opacity duration-500" />
                        
                        {/* Featured Badge */}
                        {image.is_featured && (
                          <div className="absolute top-2 right-2 sm:top-3 sm:right-3 px-2 sm:px-3 py-0.5 sm:py-1 rounded-full 
                                       bg-primary/90 backdrop-blur-sm text-[10px] sm:text-xs font-semibold text-primary-foreground
                                       flex items-center gap-1">
                            <span className="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-primary-foreground animate-pulse" />
                            <span className="hidden sm:inline">Featured</span>
                            <span className="sm:hidden">★</span>
                          </div>
                        )}

                        {/* Like Button */}
                        <motion.div 
                          initial={{ opacity: 0 }}
                          animate={{ opacity: hoveredIndex === index ? 1 : 0 }}
                          className="absolute top-2 left-2 sm:top-3 sm:left-3 hidden sm:flex gap-2"
                        >
                          <button
                            onClick={(e) => toggleLike(image.id, e)}
                            className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full backdrop-blur-md 
                                      flex items-center justify-center transition-all duration-300
                                      ${likedImages.has(image.id) 
                                        ? 'bg-red-500 text-white' 
                                        : 'bg-charcoal/50 text-ivory hover:bg-red-500/80 hover:text-white'}`}
                          >
                            <Heart className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${likedImages.has(image.id) ? 'fill-current' : ''}`} />
                          </button>
                        </motion.div>

                        {/* View Icon */}
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

                        {/* Bottom Caption */}
                        <div className="absolute bottom-0 left-0 right-0 p-2.5 sm:p-4">
                          <p className="font-serif text-xs sm:text-base lg:text-lg text-ivory font-medium line-clamp-1">
                            {image.title || 'Untitled'}
                          </p>
                          {image.category && (
                            <div className="flex items-center gap-1.5 sm:gap-2 mt-0.5 sm:mt-1">
                              <span className="text-[10px] sm:text-xs text-ivory/70 uppercase tracking-wider">
                                {image.category}
                              </span>
                              <span className="w-1 h-1 rounded-full bg-primary hidden sm:block" />
                              <span className="text-[10px] sm:text-xs text-primary hidden sm:inline">View</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>

            {/* View More - only when there are more images than the template shows */}
            {showViewMore && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="text-center mt-14"
              >
                <Link
                  to="/gallery"
                  className="inline-flex items-center gap-3 px-8 py-4 rounded-full
                           bg-gradient-to-r from-primary/10 to-rose-gold/10 
                           border-2 border-primary/30 text-foreground font-semibold
                           hover:border-primary hover:shadow-xl hover:shadow-primary/20
                           transition-all duration-300 group"
                >
                  <span>View more</span>
                  <span className="text-primary group-hover:translate-x-1 transition-transform">→</span>
                </Link>
              </motion.div>
            )}
          </>
        )}
      </div>

      {/* Enhanced Lightbox */}
      <AnimatePresence>
        {lightboxImage !== null && displayed.length > 0 && (
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
                <span className="text-ivory/60">{displayed.length}</span>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={(e) => { e.stopPropagation(); toggleLike(displayed[lightboxImage].id, e); }}
                  className={`w-10 h-10 rounded-full backdrop-blur-md flex items-center justify-center 
                            transition-all duration-300 ${
                    likedImages.has(displayed[lightboxImage].id) 
                      ? 'bg-red-500 text-white' 
                      : 'bg-ivory/10 text-ivory hover:bg-red-500/80'
                  }`}
                >
                  <Heart className={`w-5 h-5 ${likedImages.has(displayed[lightboxImage].id) ? 'fill-current' : ''}`} />
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
                  src={displayed[lightboxImage].url || '/placeholder.svg'}
                  alt={displayed[lightboxImage].title || 'Gallery image'}
                  draggable={false}
                  className="max-w-full max-h-[75vh] object-contain mx-auto"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/placeholder.svg';
                  }}
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
                      {displayed[lightboxImage].category && (
                        <span className="inline-block px-3 py-1 rounded-full bg-primary/20 text-primary 
                                       text-xs font-medium mb-2 uppercase tracking-wider">
                          {displayed[lightboxImage].category}
                        </span>
                      )}
                      <h3 className="font-serif text-2xl md:text-3xl text-ivory font-bold">
                        {displayed[lightboxImage].title || 'Untitled'}
                      </h3>
                    </div>
                    {displayed[lightboxImage].is_featured && (
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
              {displayed.slice(0, 8).map((img, idx) => (
                <button
                  key={img.id}
                  onClick={(e) => { e.stopPropagation(); setLightboxImage(idx); }}
                  className={`w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 
                            transition-all duration-300 ${
                    idx === lightboxImage 
                      ? 'ring-2 ring-primary scale-110' 
                      : 'opacity-50 hover:opacity-100'
                  }`}
                >
                  <img src={img.url || '/placeholder.svg'} alt={img.title || 'Gallery image'} draggable={false} className="w-full h-full object-cover" loading="lazy" />
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
