import { motion } from "framer-motion";
import { ChevronDown, PlayCircle, Sparkles, Volume2, VolumeX } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import heroImage from "@/assets/hero-wedding.jpg";
import SparkleParticles from "./SparkleParticles";

const HeroSection = () => {
  const [isVideoLoaded, setIsVideoLoaded] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Video URL - a beautiful wedding highlight reel
  const videoUrl = "https://videos.pexels.com/video-files/3327261/3327261-uhd_2560_1440_30fps.mp4";

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.playbackRate = 0.85;
    }
  }, [isVideoLoaded]);

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  return (
    <section id="home" className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Fallback Background Image */}
      <div className="absolute inset-0">
        <img
          src={heroImage}
          alt="Luxury Wedding Venue"
          className={`w-full h-full object-cover transition-opacity duration-1000 ${
            isVideoLoaded ? "opacity-0" : "opacity-100"
          }`}
        />
      </div>

      {/* Video Background */}
      <div className="absolute inset-0">
        <video
          ref={videoRef}
          autoPlay
          loop
          muted={isMuted}
          playsInline
          onLoadedData={() => setIsVideoLoaded(true)}
          className={`w-full h-full object-cover transition-opacity duration-1000 ${
            isVideoLoaded ? "opacity-100" : "opacity-0"
          }`}
        >
          <source src={videoUrl} type="video/mp4" />
        </video>
        
        {/* Adaptive Overlays - Better for light theme readability */}
        <div className="absolute inset-0 bg-gradient-to-b from-charcoal/60 via-charcoal/50 to-charcoal/90" />
        <div className="absolute inset-0 bg-gradient-to-r from-charcoal/40 via-transparent to-charcoal/40" />
        {/* Extra overlay for better text contrast in light theme */}
        <div className="absolute inset-0 bg-charcoal/20 dark:bg-transparent" />
      </div>

      {/* Mute Toggle Button */}
      {isVideoLoaded && (
        <motion.button
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 2, duration: 0.5 }}
          onClick={toggleMute}
          className="absolute bottom-28 sm:bottom-24 right-4 sm:right-6 z-20 w-11 h-11 sm:w-12 sm:h-12 
                   rounded-full bg-charcoal/50 backdrop-blur-md border border-ivory/30
                   flex items-center justify-center text-ivory hover:text-primary
                   hover:bg-charcoal/70 hover:border-primary/50 transition-all duration-300
                   shadow-lg"
          aria-label={isMuted ? "Unmute video" : "Mute video"}
        >
          {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
        </motion.button>
      )}

      {/* Sparkle Particles */}
      <SparkleParticles />

      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 sm:px-6 text-center pt-20 sm:pt-20 pb-24 sm:pb-0">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.2 }}
          className="max-w-5xl mx-auto"
        >
          {/* Badge - Compact on mobile */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5, duration: 0.6 }}
            className="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-5 py-1.5 sm:py-2 rounded-full 
                     bg-primary/30 backdrop-blur-md border border-primary/40 mb-4 sm:mb-8
                     shadow-lg shadow-primary/10"
          >
            <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary" />
            <span className="text-[11px] sm:text-sm font-medium text-ivory tracking-wide">
              Premium Event Management
            </span>
          </motion.div>

          {/* Main Heading - Instagram-style large text on mobile */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7, duration: 0.8 }}
            className="font-serif text-[28px] leading-tight sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl 
                     font-bold text-ivory mb-3 sm:mb-6
                     drop-shadow-[0_2px_10px_rgba(0,0,0,0.3)]"
          >
            Turning Moments Into
            <br />
            <span className="text-gradient-gold drop-shadow-none">Unforgettable Celebrations</span>
          </motion.h1>

          {/* Subtitle - Compact pills on mobile */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9, duration: 0.8 }}
            className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 mb-3 sm:mb-4"
          >
            {["Weddings", "Corporate", "Celebrations"].map((item, idx) => (
              <span
                key={item}
                className="px-3 sm:px-4 py-1 sm:py-1.5 rounded-full text-[11px] sm:text-sm 
                         bg-ivory/10 backdrop-blur-sm border border-ivory/20 text-ivory/90"
              >
                {item}
              </span>
            ))}
          </motion.div>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1, duration: 0.8 }}
            className="text-[13px] sm:text-base lg:text-lg text-ivory/70 mb-6 sm:mb-10 max-w-xl sm:max-w-2xl mx-auto px-2"
          >
            Where every detail matters and every moment becomes a cherished memory.
          </motion.p>

          {/* CTAs - Mobile optimized with WhatsApp */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.2, duration: 0.8 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4"
          >
            {/* Desktop: Plan Your Event */}
            <a
              href="/contact"
              className="hidden sm:inline-flex group relative w-auto px-8 py-4 
                       bg-gradient-to-r from-primary to-rose-gold text-primary-foreground 
                       rounded-full font-semibold text-lg overflow-hidden 
                       transition-all duration-300 hover:shadow-2xl hover:scale-105
                       shadow-[0_4px_30px_rgba(212,175,55,0.4)]"
            >
              <span className="relative z-10">Plan Your Event</span>
              <div className="absolute inset-0 bg-gradient-to-r from-rose-gold via-primary to-rose-gold 
                            bg-[length:200%_100%] animate-shimmer opacity-0 group-hover:opacity-100 transition-opacity" />
            </a>
            
            {/* Desktop: View Our Work */}
            <a
              href="#gallery"
              className="hidden sm:flex group items-center justify-center gap-3 w-auto 
                       px-8 py-4 bg-ivory/10 backdrop-blur-md border-2 border-ivory/40 text-ivory 
                       rounded-full font-semibold text-lg 
                       hover:bg-ivory/20 hover:border-ivory/60 transition-all duration-300"
            >
              <PlayCircle className="w-5 h-5 group-hover:scale-110 transition-transform" />
              <span>View Our Work</span>
            </a>

            {/* Mobile: Compact Action Buttons */}
            <div className="flex sm:hidden items-center gap-3 w-full px-4">
              <a
                href="#gallery"
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3.5 
                         bg-ivory/10 backdrop-blur-md border border-ivory/30 text-ivory 
                         rounded-2xl font-semibold text-sm
                         active:scale-95 transition-transform duration-200"
              >
                <PlayCircle className="w-4 h-4" />
                <span>Our Work</span>
              </a>
              <a
                href="/contact"
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3.5 
                         bg-gradient-to-r from-primary to-rose-gold text-primary-foreground 
                         rounded-2xl font-semibold text-sm shadow-lg shadow-primary/30
                         active:scale-95 transition-transform duration-200"
              >
                <span>Get Started</span>
              </a>
            </div>
          </motion.div>
        </motion.div>
      </div>

      {/* Scroll Indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5, duration: 1 }}
        className="absolute bottom-6 sm:bottom-8 left-1/2 -translate-x-1/2"
      >
        <a href="#events" className="flex flex-col items-center gap-1.5 sm:gap-2 text-ivory/70 hover:text-ivory transition-colors">
          <span className="text-xs sm:text-sm tracking-widest uppercase">Explore</span>
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
          >
            <ChevronDown className="w-5 h-5 sm:w-6 sm:h-6" />
          </motion.div>
        </a>
      </motion.div>

      {/* Decorative Elements */}
      <div className="absolute top-1/4 left-4 sm:left-10 w-20 sm:w-32 h-20 sm:h-32 bg-primary/15 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 right-4 sm:right-10 w-24 sm:w-40 h-24 sm:h-40 bg-rose-gold/15 rounded-full blur-3xl" />
    </section>
  );
};

export default HeroSection;
