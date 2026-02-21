import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle } from "lucide-react";
import { useState } from "react";
import { useSiteConfig } from "@/contexts/SiteConfigContext";

const WhatsAppButton = () => {
  const { contact } = useSiteConfig();
  const [isHovered, setIsHovered] = useState(false);
  const message = "Hello! I'm interested in planning an event with Phoenix Events.";

  const whatsappNumber = contact.phone ? contact.phone.replace(/\D/g, '') : "917066763276";
  const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;

  return (
    <motion.div
      className="fixed bottom-6 right-6 z-40 hidden md:block"
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
              className="absolute right-full mr-3 top-1/2 -translate-y-1/2 whitespace-nowrap
                       bg-card text-foreground px-4 py-2 rounded-xl shadow-lg text-sm font-medium border border-border"
            >
              Chat with us!
              <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1 
                            w-2 h-2 bg-card border-r border-b border-border rotate-45" />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Button */}
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          className="relative flex items-center justify-center w-14 h-14 rounded-full
                   bg-[#25D366] text-white shadow-lg hover:shadow-xl hover:scale-110
                   transition-all duration-300 z-10"
        >
          <MessageCircle className="w-7 h-7" fill="currentColor" />
        </a>

        {/* Blinking Pulse Rings */}
        <motion.div
          className="absolute inset-0 rounded-full bg-[#25D366]"
          animate={{
            scale: [1, 1.5, 1.5],
            opacity: [0.7, 0, 0],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeOut",
          }}
          style={{ zIndex: 0 }}
        />
        <motion.div
          className="absolute inset-0 rounded-full bg-[#25D366]"
          animate={{
            scale: [1, 1.8, 1.8],
            opacity: [0.5, 0, 0],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            delay: 0.5,
            ease: "easeOut",
          }}
          style={{ zIndex: 0 }}
        />
      </div>
    </motion.div>
  );
};

export default WhatsAppButton;
