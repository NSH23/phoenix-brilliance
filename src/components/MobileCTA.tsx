import { motion } from "framer-motion";
import { Phone } from "lucide-react";

const MobileCTA = () => {
  return (
    <motion.div
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 1.5, duration: 0.5 }}
      className="fixed bottom-0 left-0 right-0 z-40 md:hidden"
    >
      <div className="bg-background/90 backdrop-blur-lg border-t border-border p-4 shadow-[0_-4px_20px_rgba(0,0,0,0.1)]">
        <a
          href="#contact"
          className="flex items-center justify-center gap-3 w-full px-6 py-4 bg-primary text-primary-foreground 
                   rounded-full font-semibold text-lg shadow-lg"
        >
          <Phone className="w-5 h-5" />
          <span>Get a Quote</span>
        </a>
      </div>
    </motion.div>
  );
};

export default MobileCTA;
