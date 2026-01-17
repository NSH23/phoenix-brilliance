import { motion } from "framer-motion";
import { MessageCircle, Phone, Calendar } from "lucide-react";
import { Link } from "react-router-dom";

const MobileCTA = () => {
  return (
    <motion.div
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 1.5, duration: 0.5 }}
      className="fixed bottom-0 left-0 right-0 z-40 md:hidden"
    >
      {/* Instagram-style bottom action bar */}
      <div className="bg-background/95 backdrop-blur-xl border-t border-border/50 
                    px-4 py-3 shadow-[0_-4px_30px_rgba(0,0,0,0.1)]">
        <div className="flex items-center justify-between gap-3">
          {/* WhatsApp Button - Primary */}
          <a
            href="https://wa.me/917066763276?text=Hi! I'm interested in your event services."
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3.5 
                     bg-gradient-to-r from-[#25D366] to-[#128C7E] text-white 
                     rounded-2xl font-semibold text-sm shadow-lg shadow-[#25D366]/30
                     active:scale-95 transition-transform duration-200"
          >
            <MessageCircle className="w-5 h-5 fill-current" />
            <span>WhatsApp</span>
          </a>

          {/* Call Button */}
          <a
            href="tel:+917066763276"
            className="flex items-center justify-center w-14 h-14 
                     bg-muted rounded-2xl border border-border
                     active:scale-95 transition-transform duration-200"
          >
            <Phone className="w-5 h-5 text-foreground" />
          </a>

          {/* Book Now Button */}
          <Link
            to="/contact"
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3.5 
                     bg-gradient-to-r from-primary to-rose-gold text-primary-foreground 
                     rounded-2xl font-semibold text-sm shadow-lg shadow-primary/30
                     active:scale-95 transition-transform duration-200"
          >
            <Calendar className="w-5 h-5" />
            <span>Book Now</span>
          </Link>
        </div>
      </div>
    </motion.div>
  );
};

export default MobileCTA;
