import { motion } from "framer-motion";
import { useState } from "react";
import { X } from "lucide-react";

interface EventCardProps {
  title: string;
  description: string;
  image: string;
  index: number;
}

const EventCard = ({ title, description, image, index }: EventCardProps) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-30px" }}
        transition={{ duration: 0.5, delay: index * 0.05 }}
        onClick={() => setIsModalOpen(true)}
        className="group relative cursor-pointer"
      >
        {/* Photo Frame Effect - Optimized for Mobile */}
        <div className="relative p-1.5 sm:p-2 md:p-3 bg-gradient-to-br from-primary/10 via-rose-gold/10 to-champagne/20 
                      rounded-xl sm:rounded-2xl transition-all duration-500 
                      group-hover:shadow-luxury-lg group-hover:from-primary/20 group-hover:to-rose-gold/20
                      dark:from-primary/5 dark:via-card dark:to-rose-gold/5">
          {/* Inner Frame Border */}
          <div className="absolute inset-1.5 sm:inset-2 border border-primary/20 rounded-lg sm:rounded-xl pointer-events-none" />
          
          {/* Image Container - Consistent aspect ratio for mobile grid */}
          <div className="relative overflow-hidden rounded-lg sm:rounded-xl aspect-[3/4] sm:aspect-[4/5]">
            <img
              src={image}
              alt={title}
              loading="lazy"
              className="w-full h-full object-cover transition-transform duration-700 
                       group-hover:scale-110"
            />
            
            {/* Overlay - Darker for light theme contrast */}
            <div className="absolute inset-0 bg-gradient-to-t from-charcoal/90 via-charcoal/40 to-transparent 
                          opacity-70 group-hover:opacity-85 transition-opacity duration-500" />
            
            {/* Glow Effect on Hover */}
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500
                          bg-gradient-to-t from-primary/30 via-transparent to-transparent" />

            {/* Content - Compact for mobile */}
            <div className="absolute bottom-0 left-0 right-0 p-3 sm:p-4 md:p-6">
              <h3 className="font-serif text-sm sm:text-lg md:text-xl lg:text-2xl font-bold text-ivory mb-0.5 sm:mb-2 
                           transform translate-y-1 sm:translate-y-2 group-hover:translate-y-0 
                           transition-transform duration-500 line-clamp-1">
                {title}
              </h3>
              <p className="hidden sm:block text-ivory/80 text-xs sm:text-sm line-clamp-2 opacity-0 
                          transform translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 
                          transition-all duration-500 delay-100">
                {description}
              </p>
            </div>

            {/* View More Indicator */}
            <div className="absolute top-2 sm:top-4 right-2 sm:right-4 w-7 h-7 sm:w-10 sm:h-10 
                          rounded-full bg-primary/90 backdrop-blur-sm
                          flex items-center justify-center opacity-0 scale-75 
                          group-hover:opacity-100 group-hover:scale-100 transition-all duration-500
                          shadow-lg">
              <span className="text-primary-foreground text-[10px] sm:text-xs font-medium">View</span>
            </div>
          </div>
        </div>

        {/* Decorative Corners - Smaller on mobile */}
        <div className="absolute -top-1 -left-1 sm:-top-2 sm:-left-2 w-4 h-4 sm:w-6 sm:h-6 
                      border-l-2 border-t-2 border-primary/40 rounded-tl-lg 
                      opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        <div className="absolute -bottom-1 -right-1 sm:-bottom-2 sm:-right-2 w-4 h-4 sm:w-6 sm:h-6 
                      border-r-2 border-b-2 border-primary/40 rounded-br-lg
                      opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      </motion.div>

      {/* Modal */}
      {isModalOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 
                   bg-charcoal/95 backdrop-blur-md"
          onClick={() => setIsModalOpen(false)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="relative max-w-3xl w-full bg-card rounded-2xl sm:rounded-3xl 
                     overflow-hidden shadow-luxury-lg max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-3 right-3 sm:top-4 sm:right-4 z-10 w-9 h-9 sm:w-10 sm:h-10 
                       rounded-full bg-background/90 backdrop-blur-sm
                       flex items-center justify-center hover:bg-primary hover:text-primary-foreground 
                       transition-colors shadow-md"
            >
              <X className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
            
            <div className="aspect-[16/10] sm:aspect-video">
              <img src={image} alt={title} className="w-full h-full object-cover" />
            </div>
            
            <div className="p-5 sm:p-6 md:p-8">
              <h3 className="font-serif text-2xl sm:text-3xl font-bold text-foreground mb-3 sm:mb-4">
                {title}
              </h3>
              <p className="text-muted-foreground leading-relaxed text-sm sm:text-base">
                {description}
              </p>
              <a
                href="#contact"
                className="inline-flex mt-5 sm:mt-6 px-5 sm:px-6 py-2.5 sm:py-3 
                         bg-gradient-to-r from-primary to-rose-gold text-primary-foreground 
                         rounded-full font-medium text-sm sm:text-base
                         hover:shadow-lg hover:scale-105 transition-all duration-300"
                onClick={() => setIsModalOpen(false)}
              >
                Plan This Event
              </a>
            </div>
          </motion.div>
        </motion.div>
      )}
    </>
  );
};

export default EventCard;
