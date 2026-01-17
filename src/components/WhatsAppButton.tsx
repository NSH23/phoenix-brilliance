import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, X } from "lucide-react";
import { useState } from "react";

const WhatsAppButton = () => {
  const [isHovered, setIsHovered] = useState(false);
  const phoneNumber = "917066763276"; // Phoenix Events WhatsApp number
  const message = "Hello! I'm interested in planning an event with Phoenix Events.";

  const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;

  return (
    <motion.div
      className="fixed bottom-6 right-6 z-40"
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ delay: 2, duration: 0.5 }}
    >
      <div className="relative">
        {/* Tooltip */}
        <AnimatePresence>
          {isHovered && (
            <motion.div
              initial={{ opacity: 0, x: 10, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 10, scale: 0.9 }}
              className="absolute right-full mr-3 top-1/2 -translate-y-1/2 whitespace-nowrap z-50
                       bg-card text-foreground px-4 py-2 rounded-xl shadow-lg text-sm font-medium"
            >
              Chat with us!
              <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1 
                            w-2 h-2 bg-card rotate-45" />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Pulse Ring - Behind the button */}
        <div className="absolute inset-0 rounded-full bg-[#25D366] animate-ping opacity-25 pointer-events-none" />

        {/* Button - On top and clickable */}
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          className="relative z-10 flex items-center justify-center w-14 h-14 rounded-full
                   bg-[#25D366] text-white shadow-lg hover:shadow-xl hover:scale-110
                   transition-all duration-300 cursor-pointer"
          aria-label="Chat with us on WhatsApp"
        >
          <MessageCircle className="w-7 h-7" />
        </a>
      </div>
    </motion.div>
  );
};

export default WhatsAppButton;
