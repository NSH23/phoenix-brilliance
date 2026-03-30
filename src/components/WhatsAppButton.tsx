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
    <div className="fixed bottom-6 right-6 z-40 hidden md:block opacity-0 scale-0 animate-wa-pop-in">
      <div className="relative">
        {/* Tooltip */}
        <div
          className={`absolute right-full mr-3 top-1/2 -translate-y-1/2 whitespace-nowrap
                       bg-card text-foreground px-4 py-2 rounded-xl shadow-lg text-sm font-medium border border-border
                       transition-all duration-200 ease-out
                       ${isHovered ? "opacity-100 translate-x-0 scale-100" : "opacity-0 translate-x-2.5 scale-95 pointer-events-none"}`}
        >
          Chat with us!
          <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1 
                            w-2 h-2 bg-card border-r border-b border-border rotate-45" />
        </div>

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
        <div
          className="absolute inset-0 rounded-full bg-[#25D366] animate-ping opacity-70 [animation-duration:2s]"
          style={{ zIndex: 0 }}
        />
        <div
          className="absolute inset-0 rounded-full bg-[#25D366] animate-ping opacity-50 [animation-duration:2s] [animation-delay:500ms]"
          style={{ zIndex: 0 }}
        />
      </div>
    </div>
  );
};

export default WhatsAppButton;
