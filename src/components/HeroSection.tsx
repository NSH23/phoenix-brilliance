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
      videoRef.current.playbackRate = 0.85; // Slightly slower for cinematic effect
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
        {/* Video Overlays */}
        <div className="absolute inset-0 bg-gradient-to-b from-charcoal/50 via-charcoal/40 to-charcoal/80" />
        <div className="absolute inset-0 bg-gradient-to-r from-charcoal/50 via-transparent to-charcoal/50" />
      </div>

      {/* Mute Toggle Button */}
      {isVideoLoaded && (
        <motion.button
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 2, duration: 0.5 }}
          onClick={toggleMute}
          className="absolute bottom-24 right-6 z-20 w-12 h-12 rounded-full 
                   bg-charcoal/40 backdrop-blur-sm border border-ivory/20
                   flex items-center justify-center text-ivory/80 hover:text-ivory
                   hover:bg-charcoal/60 transition-all duration-300"
          aria-label={isMuted ? "Unmute video" : "Mute video"}
        >
          {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
        </motion.button>
      )}

      {/* Sparkle Particles */}
      <SparkleParticles />

      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 text-center">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.2 }}
          className="max-w-5xl mx-auto"
        >
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5, duration: 0.6 }}
            className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-primary/20 backdrop-blur-sm 
                     border border-primary/30 mb-8"
          >
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-ivory tracking-wide">Premium Event Management</span>
          </motion.div>

          {/* Main Heading */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7, duration: 0.8 }}
            className="font-serif text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-ivory mb-6 leading-tight"
          >
            Turning Moments Into
            <br />
            <span className="text-gradient-gold">Unforgettable Celebrations</span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9, duration: 0.8 }}
            className="text-lg sm:text-xl md:text-2xl text-ivory/80 mb-4 font-light"
          >
            Weddings • Corporate Events • Grand Celebrations
          </motion.p>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1, duration: 0.8 }}
            className="text-base sm:text-lg text-ivory/60 mb-10 max-w-2xl mx-auto"
          >
            Where every detail matters and every moment becomes a cherished memory. 
            We craft bespoke events that reflect your unique story.
          </motion.p>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.2, duration: 0.8 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <a
              href="#contact"
              className="group relative px-8 py-4 bg-primary text-primary-foreground rounded-full font-semibold
                       text-lg overflow-hidden transition-all duration-300 hover:shadow-2xl hover:scale-105
                       shadow-[0_4px_30px_rgba(212,175,55,0.4)]"
            >
              <span className="relative z-10">Plan Your Event</span>
              <div className="absolute inset-0 bg-gradient-to-r from-primary via-gold-light to-primary 
                            bg-[length:200%_100%] animate-shimmer opacity-0 group-hover:opacity-100 transition-opacity" />
            </a>
            
            <a
              href="#gallery"
              className="group flex items-center gap-3 px-8 py-4 border-2 border-ivory/40 text-ivory rounded-full 
                       font-semibold text-lg hover:bg-ivory/10 hover:border-ivory/60 transition-all duration-300"
            >
              <PlayCircle className="w-5 h-5 group-hover:scale-110 transition-transform" />
              <span>View Our Work</span>
            </a>
          </motion.div>
        </motion.div>
      </div>

      {/* Scroll Indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5, duration: 1 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
      >
        <a href="#events" className="flex flex-col items-center gap-2 text-ivory/60 hover:text-ivory transition-colors">
          <span className="text-sm tracking-widest uppercase">Explore</span>
          <motion.div
            animate={{ y: [0, 10, 0] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
          >
            <ChevronDown className="w-6 h-6" />
          </motion.div>
        </a>
      </motion.div>

      {/* Decorative Elements */}
      <div className="absolute top-1/4 left-10 w-32 h-32 bg-primary/10 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 right-10 w-40 h-40 bg-rose-gold/10 rounded-full blur-3xl" />
    </section>
  );
};

export default HeroSection;
