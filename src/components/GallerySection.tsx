import { motion } from "framer-motion";
import { useState } from "react";
import { X, ChevronLeft, ChevronRight } from "lucide-react";

import weddingImg from "@/assets/wedding-event.jpg";
import birthdayImg from "@/assets/birthday-event.jpg";
import engagementImg from "@/assets/engagement-event.jpg";
import sangeetImg from "@/assets/sangeet-event.jpg";
import haldiImg from "@/assets/haldi-event.jpg";
import mehendiImg from "@/assets/mehendi-event.jpg";
import anniversaryImg from "@/assets/anniversary-event.jpg";
import corporateImg from "@/assets/corporate-event.jpg";
import carOpeningImg from "@/assets/car-opening-event.jpg";
import heroImg from "@/assets/hero-wedding.jpg";

const galleryImages = [
  { src: heroImg, category: "Wedding", title: "Royal Wedding Reception" },
  { src: weddingImg, category: "Wedding", title: "Floral Mandap Setup" },
  { src: engagementImg, category: "Wedding", title: "Romantic Engagement" },
  { src: birthdayImg, category: "Parties", title: "Elegant Birthday Celebration" },
  { src: sangeetImg, category: "Traditional", title: "Vibrant Sangeet Night" },
  { src: haldiImg, category: "Traditional", title: "Traditional Haldi Ceremony" },
  { src: mehendiImg, category: "Traditional", title: "Colorful Mehendi Setup" },
  { src: anniversaryImg, category: "Parties", title: "Romantic Anniversary Dinner" },
  { src: corporateImg, category: "Corporate", title: "Corporate Conference" },
  { src: carOpeningImg, category: "Corporate", title: "Luxury Car Launch" },
];

const categories = ["All", "Wedding", "Corporate", "Traditional", "Parties"];

const GallerySection = () => {
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [lightboxImage, setLightboxImage] = useState<number | null>(null);

  const filteredImages = selectedCategory === "All" 
    ? galleryImages 
    : galleryImages.filter(img => img.category === selectedCategory);

  const navigateLightbox = (direction: "prev" | "next") => {
    if (lightboxImage === null) return;
    const currentIndex = filteredImages.findIndex((_, i) => i === lightboxImage);
    if (direction === "prev") {
      setLightboxImage(currentIndex === 0 ? filteredImages.length - 1 : currentIndex - 1);
    } else {
      setLightboxImage(currentIndex === filteredImages.length - 1 ? 0 : currentIndex + 1);
    }
  };

  return (
    <section id="gallery" className="py-24 bg-background relative overflow-hidden">
      {/* Background */}
      <div className="absolute top-1/2 left-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl -translate-y-1/2" />
      <div className="absolute top-1/2 right-0 w-80 h-80 bg-rose-gold/5 rounded-full blur-3xl -translate-y-1/2" />

      <div className="container mx-auto px-4 relative">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center mb-12"
        >
          <span className="inline-block px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
            Our Portfolio
          </span>
          <h2 className="section-title mb-4">
            Event <span className="text-gradient-gold">Gallery</span>
          </h2>
          <p className="section-subtitle">
            A glimpse into the magical moments we've created. Every frame tells a story of celebration and joy.
          </p>
        </motion.div>

        {/* Category Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="flex flex-wrap justify-center gap-3 mb-12"
        >
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-6 py-2.5 rounded-full text-sm font-medium transition-all duration-300 ${
                selectedCategory === category
                  ? "bg-primary text-primary-foreground shadow-lg"
                  : "bg-muted text-muted-foreground hover:bg-primary/10 hover:text-primary"
              }`}
            >
              {category}
            </button>
          ))}
        </motion.div>

        {/* Masonry Gallery */}
        <div className="columns-1 sm:columns-2 lg:columns-3 gap-6 space-y-6">
          {filteredImages.map((image, index) => (
            <motion.div
              key={`${image.title}-${index}`}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: index * 0.05 }}
              className="break-inside-avoid group cursor-pointer"
              onClick={() => setLightboxImage(index)}
            >
              {/* Polaroid/Frame Style */}
              <div className="relative bg-card p-3 rounded-xl shadow-lg transition-all duration-500 
                            hover:shadow-luxury hover:-translate-y-2 hover:rotate-1">
                {/* Image */}
                <div className="relative overflow-hidden rounded-lg">
                  <img
                    src={image.src}
                    alt={image.title}
                    className={`w-full object-cover transition-transform duration-700 group-hover:scale-110 ${
                      index % 3 === 0 ? "aspect-[4/5]" : index % 3 === 1 ? "aspect-square" : "aspect-[3/4]"
                    }`}
                  />
                  
                  {/* Overlay */}
                  <div className="absolute inset-0 bg-charcoal/0 group-hover:bg-charcoal/40 
                                transition-colors duration-500 flex items-center justify-center">
                    <div className="opacity-0 group-hover:opacity-100 transform scale-75 group-hover:scale-100
                                  transition-all duration-500">
                      <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center">
                        <span className="text-primary-foreground text-xl">+</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Caption */}
                <div className="mt-3 text-center">
                  <p className="font-serif text-foreground font-medium">{image.title}</p>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">{image.category}</p>
                </div>

                {/* Corner Decorations */}
                <div className="absolute top-1 left-1 w-4 h-4 border-l border-t border-primary/30 rounded-tl" />
                <div className="absolute top-1 right-1 w-4 h-4 border-r border-t border-primary/30 rounded-tr" />
                <div className="absolute bottom-1 left-1 w-4 h-4 border-l border-b border-primary/30 rounded-bl" />
                <div className="absolute bottom-1 right-1 w-4 h-4 border-r border-b border-primary/30 rounded-br" />
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Lightbox */}
      {lightboxImage !== null && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-charcoal/95 backdrop-blur-lg flex items-center justify-center p-4"
          onClick={() => setLightboxImage(null)}
        >
          {/* Close Button */}
          <button
            onClick={() => setLightboxImage(null)}
            className="absolute top-4 right-4 w-12 h-12 rounded-full bg-card/20 backdrop-blur-sm
                     flex items-center justify-center text-ivory hover:bg-primary transition-colors z-10"
          >
            <X className="w-6 h-6" />
          </button>

          {/* Navigation */}
          <button
            onClick={(e) => { e.stopPropagation(); navigateLightbox("prev"); }}
            className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-card/20 backdrop-blur-sm
                     flex items-center justify-center text-ivory hover:bg-primary transition-colors"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); navigateLightbox("next"); }}
            className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-card/20 backdrop-blur-sm
                     flex items-center justify-center text-ivory hover:bg-primary transition-colors"
          >
            <ChevronRight className="w-6 h-6" />
          </button>

          {/* Image */}
          <motion.div
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            className="max-w-5xl max-h-[85vh] relative"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={filteredImages[lightboxImage].src}
              alt={filteredImages[lightboxImage].title}
              className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl"
            />
            <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-charcoal/80 to-transparent rounded-b-lg">
              <p className="font-serif text-2xl text-ivory">{filteredImages[lightboxImage].title}</p>
              <p className="text-ivory/60">{filteredImages[lightboxImage].category}</p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </section>
  );
};

export default GallerySection;
