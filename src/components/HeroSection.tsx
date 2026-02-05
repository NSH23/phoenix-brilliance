import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import HeroStatsBlock from "./HeroStatsBlock";

const HeroSection = () => {
  const [isDark, setIsDark] = useState(false);
  
  useEffect(() => {
    const checkTheme = () => {
      const darkMode = document.documentElement.classList.contains('dark');
      setIsDark(darkMode);
    };
    checkTheme();
    const observer = new MutationObserver(checkTheme);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  return (
    <section
      id="home"
      className="relative min-h-[85vh] sm:min-h-[90vh] flex flex-col items-center justify-center overflow-hidden"
    >
      {/* Elegant abstract gradient mesh background */}
      <div className="absolute inset-0" aria-hidden>
        {/* Base gradient layer - adapts to theme (dark unchanged) */}
        {isDark ? (
          <div className="absolute inset-0 bg-gradient-to-br from-[#0f172a] via-[#1a1f3a] to-[#2d1b3d]" />
        ) : (
          <div className="absolute inset-0 bg-gradient-champagne" />
        )}
        
        {/* Dark: rose/champagne mesh. Light: Heritage gold/champagne mesh only */}
        <motion.div
          className={`absolute inset-0 ${isDark ? 'opacity-60' : 'opacity-70'}`}
          animate={{
            background: isDark ? [
              "radial-gradient(circle at 20% 30%, rgba(232, 180, 160, 0.4) 0%, transparent 50%)",
              "radial-gradient(circle at 80% 70%, rgba(232, 180, 160, 0.4) 0%, transparent 50%)",
              "radial-gradient(circle at 50% 50%, rgba(232, 180, 160, 0.4) 0%, transparent 50%)",
              "radial-gradient(circle at 20% 30%, rgba(232, 180, 160, 0.4) 0%, transparent 50%)",
            ] : [
              "radial-gradient(ellipse 120% 100% at 10% 20%, rgba(212, 175, 55, 0.12) 0%, transparent 65%)",
              "radial-gradient(ellipse 115% 105% at 30% 35%, rgba(255, 248, 240, 0.5) 0%, transparent 65%)",
              "radial-gradient(ellipse 105% 115% at 60% 60%, rgba(212, 175, 55, 0.1) 0%, transparent 65%)",
              "radial-gradient(ellipse 100% 120% at 90% 80%, rgba(255, 244, 230, 0.5) 0%, transparent 65%)",
              "radial-gradient(ellipse 110% 110% at 70% 50%, rgba(212, 175, 55, 0.08) 0%, transparent 65%)",
              "radial-gradient(ellipse 115% 105% at 40% 25%, rgba(255, 248, 240, 0.5) 0%, transparent 65%)",
              "radial-gradient(ellipse 120% 100% at 10% 20%, rgba(212, 175, 55, 0.12) 0%, transparent 65%)",
            ],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: [0.25, 0.1, 0.25, 1],
          }}
        />
        
        <motion.div
          className={`absolute inset-0 ${isDark ? 'opacity-50' : 'opacity-65'}`}
          animate={{
            background: isDark ? [
              "radial-gradient(circle at 70% 20%, rgba(247, 231, 206, 0.3) 0%, transparent 50%)",
              "radial-gradient(circle at 30% 80%, rgba(247, 231, 206, 0.3) 0%, transparent 50%)",
              "radial-gradient(circle at 60% 40%, rgba(247, 231, 206, 0.3) 0%, transparent 50%)",
              "radial-gradient(circle at 70% 20%, rgba(247, 231, 206, 0.3) 0%, transparent 50%)",
            ] : [
              "radial-gradient(ellipse 100% 130% at 80% 15%, rgba(255, 248, 240, 0.4) 0%, transparent 70%)",
              "radial-gradient(ellipse 115% 120% at 60% 30%, rgba(212, 175, 55, 0.08) 0%, transparent 70%)",
              "radial-gradient(ellipse 130% 100% at 20% 85%, rgba(255, 244, 230, 0.4) 0%, transparent 70%)",
              "radial-gradient(ellipse 120% 115% at 45% 70%, rgba(212, 175, 55, 0.06) 0%, transparent 70%)",
              "radial-gradient(ellipse 110% 120% at 55% 45%, rgba(255, 248, 240, 0.35) 0%, transparent 70%)",
              "radial-gradient(ellipse 105% 125% at 75% 20%, rgba(212, 175, 55, 0.07) 0%, transparent 70%)",
              "radial-gradient(ellipse 100% 130% at 80% 15%, rgba(255, 248, 240, 0.4) 0%, transparent 70%)",
            ],
          }}
          transition={{
            duration: 24,
            repeat: Infinity,
            ease: [0.25, 0.1, 0.25, 1],
            delay: 3,
          }}
        />
        
        <motion.div
          className={`absolute inset-0 ${isDark ? 'opacity-40' : 'opacity-60'}`}
          animate={{
            background: isDark ? [
              "radial-gradient(circle at 40% 60%, rgba(232, 180, 160, 0.25) 0%, transparent 60%)",
              "radial-gradient(circle at 60% 40%, rgba(232, 180, 160, 0.25) 0%, transparent 60%)",
              "radial-gradient(circle at 80% 80%, rgba(232, 180, 160, 0.25) 0%, transparent 60%)",
              "radial-gradient(circle at 40% 60%, rgba(232, 180, 160, 0.25) 0%, transparent 60%)",
            ] : [
              "radial-gradient(ellipse 130% 110% at 35% 65%, rgba(212, 175, 55, 0.06) 0%, transparent 75%)",
              "radial-gradient(ellipse 125% 115% at 50% 50%, rgba(255, 248, 240, 0.35) 0%, transparent 75%)",
              "radial-gradient(ellipse 110% 130% at 65% 35%, rgba(212, 175, 55, 0.05) 0%, transparent 75%)",
              "radial-gradient(ellipse 120% 120% at 85% 85%, rgba(255, 244, 230, 0.3) 0%, transparent 75%)",
              "radial-gradient(ellipse 115% 125% at 25% 40%, rgba(255, 248, 240, 0.4) 0%, transparent 75%)",
              "radial-gradient(ellipse 125% 115% at 70% 75%, rgba(212, 175, 55, 0.05) 0%, transparent 75%)",
              "radial-gradient(ellipse 130% 110% at 35% 65%, rgba(212, 175, 55, 0.06) 0%, transparent 75%)",
            ],
          }}
          transition={{
            duration: 28,
            repeat: Infinity,
            ease: [0.25, 0.1, 0.25, 1],
            delay: 6,
          }}
        />
        
        {/* Light theme only: extra gold accent layer (Heritage) - no cyan/purple */}
        {!isDark && (
          <motion.div
            className="absolute inset-0 opacity-40"
            animate={{
              background: [
                "radial-gradient(ellipse 90% 100% at 5% 45%, rgba(212, 175, 55, 0.18) 0%, transparent 55%)",
                "radial-gradient(ellipse 95% 105% at 25% 35%, rgba(212, 175, 55, 0.18) 0%, transparent 55%)",
                "radial-gradient(ellipse 100% 90% at 95% 55%, rgba(212, 175, 55, 0.18) 0%, transparent 55%)",
                "radial-gradient(ellipse 105% 95% at 70% 70%, rgba(212, 175, 55, 0.18) 0%, transparent 55%)",
                "radial-gradient(ellipse 110% 110% at 50% 5%, rgba(212, 175, 55, 0.18) 0%, transparent 55%)",
                "radial-gradient(ellipse 100% 100% at 15% 60%, rgba(212, 175, 55, 0.18) 0%, transparent 55%)",
                "radial-gradient(ellipse 90% 100% at 5% 45%, rgba(212, 175, 55, 0.18) 0%, transparent 55%)",
              ],
            }}
            transition={{
              duration: 26,
              repeat: Infinity,
              ease: [0.25, 0.1, 0.25, 1],
              delay: 4,
            }}
          />
        )}
        
        {/* Subtle overlay for depth - adapts to theme (dark unchanged) */}
        {isDark ? (
          <div className="absolute inset-0 bg-gradient-to-t from-[#0f172a]/40 via-transparent to-transparent" />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-t from-[#FFFBF5]/20 via-transparent to-transparent" />
        )}
      </div>

      {/* Content – centered, max-width 900px */}
      <div className="relative z-10 w-full max-w-[900px] mx-auto px-4 sm:px-6 flex flex-col items-center justify-center text-center min-h-[90vh] py-20">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="flex flex-col items-center"
        >
          {/* 1. Eyebrow – 13px, uppercase, 2–3px letter-spacing */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="typography-eyebrow text-primary mb-5"
          >
            TURNING DREAMS INTO REALITY
          </motion.p>

          {/* 2. Brand name – Hero: 72–80px desktop, 40px mobile, extrabold */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.8 }}
            className="typography-hero text-hero mb-6"
          >
            Phoenix Brilliance
          </motion.h1>

          {/* 3. Tagline – body-lg 18px */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7, duration: 0.6 }}
            className="typography-body-lg text-hero-muted mb-10 max-w-xl mx-auto"
          >
            Luxury Event Management & Production
          </motion.p>

          {/* 4. CTA Buttons – side by side */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9, duration: 0.6 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12"
          >
            <Link
              to="/services"
              className="inline-flex items-center justify-center px-10 py-[18px] rounded-[30px] text-base font-semibold bg-primary text-primary-foreground transition-all duration-300 hover:scale-105 hover:bg-rose-gold hover:shadow-[0_0_30px_hsl(var(--primary)/0.5)] focus:outline-none focus:ring-2 focus:ring-white/50 focus:ring-offset-2 focus:ring-offset-transparent"
            >
              Explore Our Services
            </Link>
            <Link
              to="/gallery"
              className="inline-flex items-center justify-center px-10 py-[18px] rounded-[30px] text-base font-semibold border-2 border-primary/30 text-foreground bg-transparent transition-all duration-300 hover:border-primary/50 hover:bg-primary/5 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-2 focus:ring-offset-transparent"
            >
              View Our Work
            </Link>
          </motion.div>

          {/* 5. Stats Block */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.1, duration: 0.6 }}
            className="w-full"
          >
            <HeroStatsBlock />
          </motion.div>
        </motion.div>
      </div>

    </section>
  );
};

export default HeroSection;
