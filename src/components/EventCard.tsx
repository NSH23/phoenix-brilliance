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
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-50px" }}
        transition={{ duration: 0.6, delay: index * 0.1 }}
        onClick={() => setIsModalOpen(true)}
        className="group relative cursor-pointer"
      >
        {/* Photo Frame Effect */}
        <div className="relative p-3 bg-gradient-to-br from-primary/10 via-rose-gold/10 to-champagne/20 
                      rounded-2xl transition-all duration-500 group-hover:shadow-luxury-lg 
                      group-hover:from-primary/20 group-hover:to-rose-gold/20">
          {/* Inner Frame Border */}
          <div className="absolute inset-2 border border-primary/20 rounded-xl pointer-events-none" />
          
          {/* Image Container */}
          <div className="relative overflow-hidden rounded-xl aspect-[4/5]">
            <img
              src={image}
              alt={title}
              className="w-full h-full object-cover transition-transform duration-700 
                       group-hover:scale-110"
            />
            
            {/* Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-charcoal/80 via-charcoal/20 to-transparent 
                          opacity-60 group-hover:opacity-80 transition-opacity duration-500" />
            
            {/* Glow Effect on Hover */}
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500
                          bg-gradient-to-t from-primary/20 via-transparent to-transparent" />

            {/* Content */}
            <div className="absolute bottom-0 left-0 right-0 p-6">
              <h3 className="font-serif text-2xl font-bold text-ivory mb-2 
                           transform translate-y-2 group-hover:translate-y-0 transition-transform duration-500">
                {title}
              </h3>
              <p className="text-ivory/70 text-sm line-clamp-2 opacity-0 transform translate-y-4 
                          group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-500 delay-100">
                {description}
              </p>
            </div>

            {/* View More Indicator */}
            <div className="absolute top-4 right-4 w-10 h-10 rounded-full bg-primary/80 backdrop-blur-sm
                          flex items-center justify-center opacity-0 scale-75 
                          group-hover:opacity-100 group-hover:scale-100 transition-all duration-500">
              <span className="text-primary-foreground text-xs font-medium">View</span>
            </div>
          </div>
        </div>

        {/* Decorative Corner */}
        <div className="absolute -top-2 -left-2 w-6 h-6 border-l-2 border-t-2 border-primary/40 rounded-tl-lg" />
        <div className="absolute -bottom-2 -right-2 w-6 h-6 border-r-2 border-b-2 border-primary/40 rounded-br-lg" />
      </motion.div>

      {/* Modal */}
      {isModalOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-charcoal/90 backdrop-blur-sm"
          onClick={() => setIsModalOpen(false)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="relative max-w-3xl w-full bg-card rounded-3xl overflow-hidden shadow-luxury-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-background/80 backdrop-blur-sm
                       flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            
            <div className="aspect-video">
              <img src={image} alt={title} className="w-full h-full object-cover" />
            </div>
            
            <div className="p-8">
              <h3 className="font-serif text-3xl font-bold text-foreground mb-4">{title}</h3>
              <p className="text-muted-foreground leading-relaxed">{description}</p>
              <a
                href="#contact"
                className="inline-flex mt-6 px-6 py-3 bg-primary text-primary-foreground rounded-full 
                         font-medium hover:shadow-lg transition-all duration-300"
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
