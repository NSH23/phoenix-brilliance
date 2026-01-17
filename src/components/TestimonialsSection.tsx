import { motion, useMotionValue, useTransform, animate, PanInfo } from "framer-motion";
import { useState, useEffect, useRef } from "react";
import { Star, Quote, ChevronLeft, ChevronRight } from "lucide-react";

const testimonials = [
  {
    name: "Priya & Rahul Sharma",
    event: "Wedding Celebration",
    rating: 5,
    quote: "Phoenix Events turned our dream wedding into reality. Every detail was perfect, from the stunning mandap to the flawless coordination. Our guests are still talking about it!",
    image: "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=200&h=200&fit=crop&crop=faces",
  },
  {
    name: "Ananya Kapoor",
    event: "50th Birthday Gala",
    rating: 5,
    quote: "They exceeded all expectations! The attention to detail and personalized touches made my father's milestone birthday absolutely unforgettable. Truly world-class service.",
    image: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&h=200&fit=crop&crop=faces",
  },
  {
    name: "Arjun & Kavya Patel",
    event: "Engagement Ceremony",
    rating: 5,
    quote: "From the romantic décor to the seamless flow of events, everything was magical. Phoenix Events understood our vision and brought it to life beautifully.",
    image: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200&h=200&fit=crop&crop=faces",
  },
  {
    name: "Rohit & Sneha Desai",
    event: "Wedding Reception",
    rating: 5,
    quote: "Absolutely spectacular! The team at Phoenix Events made our wedding reception unforgettable. Every moment was perfectly orchestrated. Highly recommended!",
    image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop&crop=faces",
  },
  {
    name: "Aditya & Pooja Mehta",
    event: "Sangeet Night",
    rating: 5,
    quote: "The Sangeet night was beyond our expectations! The stage setup, lighting, and music coordination was flawless. Our families are still raving about it!",
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=faces",
  },
];

const TestimonialsSection = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isAutoPlaying || isDragging) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % testimonials.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [isAutoPlaying, isDragging]);

  const navigate = (direction: "prev" | "next") => {
    setIsAutoPlaying(false);
    if (direction === "prev") {
      setCurrentIndex((prev) => (prev === 0 ? testimonials.length - 1 : prev - 1));
    } else {
      setCurrentIndex((prev) => (prev + 1) % testimonials.length);
    }
  };

  const handleDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    setIsDragging(false);
    const threshold = 50;
    if (info.offset.x > threshold) {
      navigate("prev");
    } else if (info.offset.x < -threshold) {
      navigate("next");
    }
  };

  return (
    <section className="py-16 sm:py-24 bg-background relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] sm:w-[600px] h-[400px] sm:h-[600px] 
                      bg-primary/5 rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-4 relative">
        {/* Section Header - Compact on mobile */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center mb-8 sm:mb-16"
        >
          <span className="inline-block px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-primary/10 text-primary text-xs sm:text-sm font-medium mb-3 sm:mb-4">
            Testimonials
          </span>
          <h2 className="section-title mb-3 sm:mb-4 text-2xl sm:text-3xl md:text-4xl">
            What Our <span className="text-gradient-gold">Clients Say</span>
          </h2>
          <p className="section-subtitle text-sm sm:text-base max-w-lg mx-auto">
            Hear from those who trusted us with their special moments.
          </p>
        </motion.div>

        {/* Mobile: Swipeable Card Carousel */}
        <div className="sm:hidden">
          <div className="relative overflow-hidden" ref={containerRef}>
            <motion.div
              key={currentIndex}
              initial={{ opacity: 0, x: 100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -100 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.2}
              onDragStart={() => setIsDragging(true)}
              onDragEnd={handleDragEnd}
              className="cursor-grab active:cursor-grabbing touch-pan-y"
            >
              {/* Compact Mobile Card */}
              <div className="bg-gradient-to-br from-card via-card to-primary/5 rounded-3xl p-5 
                            border border-border/50 shadow-lg relative overflow-hidden">
                {/* Decorative quote */}
                <div className="absolute -top-2 -right-2 opacity-5">
                  <Quote className="w-20 h-20 text-primary" />
                </div>

                {/* Stars */}
                <div className="flex gap-0.5 mb-3">
                  {Array.from({ length: testimonials[currentIndex].rating }).map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-primary text-primary" />
                  ))}
                </div>

                {/* Quote - Compact */}
                <blockquote className="font-serif text-base text-foreground leading-relaxed mb-4 line-clamp-4">
                  "{testimonials[currentIndex].quote}"
                </blockquote>

                {/* Author - Compact inline */}
                <div className="flex items-center gap-3 pt-3 border-t border-border/30">
                  <img
                    src={testimonials[currentIndex].image}
                    alt={testimonials[currentIndex].name}
                    className="w-10 h-10 rounded-full object-cover ring-2 ring-primary/30"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-foreground text-sm truncate">
                      {testimonials[currentIndex].name}
                    </p>
                    <p className="text-xs text-primary truncate">
                      {testimonials[currentIndex].event}
                    </p>
                  </div>
                </div>

                {/* Swipe hint */}
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-1 
                              text-[10px] text-muted-foreground opacity-50">
                  <ChevronLeft className="w-3 h-3" />
                  <span>Swipe</span>
                  <ChevronRight className="w-3 h-3" />
                </div>
              </div>
            </motion.div>

            {/* Mobile Dots - Instagram style */}
            <div className="flex justify-center gap-1.5 mt-4">
              {testimonials.map((_, index) => (
                <button
                  key={index}
                  onClick={() => { setIsAutoPlaying(false); setCurrentIndex(index); }}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    index === currentIndex 
                      ? "bg-primary w-6" 
                      : "bg-muted w-1.5"
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Mobile: Quick nav thumbnails */}
          <div className="flex justify-center gap-2 mt-4 overflow-x-auto pb-2 scrollbar-hide">
            {testimonials.map((testimonial, index) => (
              <button
                key={index}
                onClick={() => { setIsAutoPlaying(false); setCurrentIndex(index); }}
                className={`flex-shrink-0 w-12 h-12 rounded-full overflow-hidden 
                          transition-all duration-300 ${
                  index === currentIndex 
                    ? "ring-2 ring-primary scale-110" 
                    : "opacity-50 hover:opacity-75"
                }`}
              >
                <img
                  src={testimonial.image}
                  alt={testimonial.name}
                  className="w-full h-full object-cover"
                />
              </button>
            ))}
          </div>
        </div>

        {/* Desktop: Original Carousel */}
        <div className="hidden sm:block max-w-4xl mx-auto relative">
          {/* Navigation Buttons */}
          <button
            onClick={() => navigate("prev")}
            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 md:-translate-x-16 z-10
                     w-12 h-12 rounded-full bg-card border border-border shadow-lg
                     flex items-center justify-center hover:bg-primary hover:text-primary-foreground 
                     transition-colors duration-300"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={() => navigate("next")}
            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 md:translate-x-16 z-10
                     w-12 h-12 rounded-full bg-card border border-border shadow-lg
                     flex items-center justify-center hover:bg-primary hover:text-primary-foreground 
                     transition-colors duration-300"
          >
            <ChevronRight className="w-5 h-5" />
          </button>

          {/* Testimonial Card */}
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.5 }}
            className="glass-card p-8 md:p-12"
          >
            {/* Quote Icon */}
            <div className="absolute top-6 right-8 opacity-10">
              <Quote className="w-24 h-24 text-primary" />
            </div>

            {/* Content */}
            <div className="relative">
              {/* Stars */}
              <div className="flex gap-1 mb-6">
                {Array.from({ length: testimonials[currentIndex].rating }).map((_, i) => (
                  <Star key={i} className="w-5 h-5 fill-primary text-primary" />
                ))}
              </div>

              {/* Quote */}
              <blockquote className="font-serif text-xl md:text-2xl text-foreground leading-relaxed mb-8 italic">
                "{testimonials[currentIndex].quote}"
              </blockquote>

              {/* Author */}
              <div className="flex items-center gap-4">
                <img
                  src={testimonials[currentIndex].image}
                  alt={testimonials[currentIndex].name}
                  className="w-14 h-14 rounded-full object-cover border-2 border-primary"
                />
                <div>
                  <p className="font-semibold text-foreground">{testimonials[currentIndex].name}</p>
                  <p className="text-sm text-primary">{testimonials[currentIndex].event}</p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Dots Indicator */}
          <div className="flex justify-center gap-2 mt-8">
            {testimonials.map((_, index) => (
              <button
                key={index}
                onClick={() => { setIsAutoPlaying(false); setCurrentIndex(index); }}
                className={`w-3 h-3 rounded-full transition-all duration-300 ${
                  index === currentIndex 
                    ? "bg-primary w-8" 
                    : "bg-muted hover:bg-primary/50"
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;
