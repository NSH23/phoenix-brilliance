import { motion } from "framer-motion";
import { Heart, Instagram, Facebook, Twitter, Youtube, ArrowUp } from "lucide-react";

const Footer = () => {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <footer className="bg-charcoal text-ivory relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-rose-gold rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-4 sm:px-6 relative">
        {/* Main Footer */}
        <div className="py-8 sm:py-12 lg:py-16 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 lg:gap-10">
          {/* Brand */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center">
                <span className="font-serif font-bold text-primary-foreground text-2xl">P</span>
              </div>
              <div>
                <span className="font-serif text-xl font-bold">Phoenix</span>
                <span className="block text-xs text-ivory/60 tracking-widest uppercase">Events & Production</span>
              </div>
            </div>
            <p className="text-ivory/70 leading-relaxed mb-4 sm:mb-6 text-sm sm:text-base">
              Turning your dreams into magnificent celebrations. Where every moment becomes a cherished memory.
            </p>
            <div className="flex gap-2 sm:gap-3">
              {[Instagram, Facebook, Twitter, Youtube].map((Icon, index) => (
                <a
                  key={index}
                  href="#"
                  className="w-10 h-10 rounded-full bg-ivory/10 flex items-center justify-center
                           hover:bg-primary hover:scale-110 transition-all duration-300"
                >
                  <Icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </motion.div>

          {/* Quick Links */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            <h4 className="font-serif text-base sm:text-lg font-semibold mb-4 sm:mb-6">Quick Links</h4>
            <ul className="space-y-2 sm:space-y-3">
              {["Home", "Events", "Services", "Gallery", "Why Us", "Contact"].map((link) => (
                <li key={link}>
                  <a
                    href={`#${link.toLowerCase().replace(" ", "-")}`}
                    className="text-ivory/70 hover:text-primary transition-colors duration-300 flex items-center gap-2 group"
                  >
                    <span className="w-0 h-0.5 bg-primary group-hover:w-4 transition-all duration-300" />
                    {link}
                  </a>
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Events */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <h4 className="font-serif text-base sm:text-lg font-semibold mb-4 sm:mb-6">Our Events</h4>
            <ul className="space-y-2 sm:space-y-3">
              {["Weddings", "Birthdays", "Engagements", "Corporate", "Sangeet", "Traditional"].map((event) => (
                <li key={event}>
                  <a
                    href="#events"
                    className="text-ivory/70 hover:text-primary transition-colors duration-300 flex items-center gap-2 group"
                  >
                    <span className="w-0 h-0.5 bg-primary group-hover:w-4 transition-all duration-300" />
                    {event}
                  </a>
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Contact */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <h4 className="font-serif text-base sm:text-lg font-semibold mb-4 sm:mb-6">Get In Touch</h4>
            <ul className="space-y-3 sm:space-y-4 text-ivory/70">
              <li>
                <p className="font-medium text-ivory text-sm sm:text-base">Address</p>
                <p className="text-xs sm:text-sm">Shop no 1, Phoenix Events and Production,<br />Kailas kondiba Dange Plot, Unit 4,<br />Dange Chowk Rd, Pune, Maharashtra 411033</p>
              </li>
              <li>
                <p className="font-medium text-ivory text-sm sm:text-base">Phone</p>
                <p className="text-xs sm:text-sm">+91 70667 63276</p>
              </li>
              <li>
                <p className="font-medium text-ivory text-sm sm:text-base">Email</p>
                <p className="text-xs sm:text-sm">hello@phoenixevents.com</p>
              </li>
            </ul>
          </motion.div>
        </div>

        {/* Bottom Bar */}
        <div className="py-4 sm:py-6 border-t border-ivory/10 flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4">
          <p className="text-ivory/60 text-xs sm:text-sm flex items-center gap-2 text-center sm:text-left">
            © 2024 Phoenix Events & Production. Made with 
            <Heart className="w-3 h-3 sm:w-4 sm:h-4 text-primary fill-primary" /> 
            in India
          </p>
          
          <button
            onClick={scrollToTop}
            className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-primary/20 hover:bg-primary flex items-center justify-center
                     transition-all duration-300 hover:scale-110 group"
          >
            <ArrowUp className="w-4 h-4 sm:w-5 sm:h-5 group-hover:-translate-y-1 transition-transform" />
          </button>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
