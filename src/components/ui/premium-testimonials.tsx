import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect, useRef } from 'react';
import { Quote, Star, ArrowLeft, ArrowRight, Sparkles } from 'lucide-react';

const testimonials = [
    {
        name: "Aarav & Meera",
        role: "Wedding Reception",
        company: "Mumbai",
        avatar: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?q=80&w=600&auto=format&fit=crop",
        rating: 5,
        text: "Phoenix curated every detail of our wedding with so much heart. The décor, flow, and emotions they created are memories we will cherish forever.",
        results: ["Unforgettable Moments", "Flawless Execution", "Dream Decor"]
    },
    {
        name: "Riya Sharma",
        role: "Sangeet & Mehendi",
        company: "Pune",
        avatar: "https://images.unsplash.com/photo-1524504388940-1e4fd709849c?q=80&w=600&auto=format&fit=crop",
        rating: 5,
        text: "From our first meeting to the last goodbye, the team handled everything with calm precision. We could truly be present with our families.",
        results: ["Stress-free Planning", "Precision Timing", "Family Focus"]
    },
    {
        name: "Karan & Diya",
        role: "Intimate Wedding",
        company: "Goa",
        avatar: "https://images.unsplash.com/photo-1525134479668-1bee5c7c6845?q=80&w=600&auto=format&fit=crop",
        rating: 5,
        text: "They transformed a simple venue into a dreamscape. Every corner felt intentional and beautifully aligned with our story.",
        results: ["Venue Transformation", "Personalized Story", "Magical Ambience"]
    },
    {
        name: "Rohit Verma",
        role: "Corporate Gala",
        company: "Bangalore",
        avatar: "https://images.unsplash.com/photo-1525130413817-d45c1d127c42?q=80&w=600&auto=format&fit=crop",
        rating: 5,
        text: "Our corporate gala felt warm, elevated, and absolutely seamless. Guests still talk about the ambience and experience.",
        results: ["Seamless Flow", "Brand Elevation", "Guest Experience"]
    },
    {
        name: "Ishita & Nikhil",
        role: "Wedding Celebrations",
        company: "Udaipur",
        avatar: "https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=600&auto=format&fit=crop",
        rating: 5,
        text: "They balanced traditions and modern design perfectly. The pheras, the décor, the music — everything felt like us.",
        results: ["Modern Tradition", "Perfect Balance", "Authentic Vibe"]
    }
];

export function PremiumTestimonials() {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [direction, setDirection] = useState(0);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const timer = setInterval(() => {
            setDirection(1);
            setCurrentIndex((prev) => (prev + 1) % testimonials.length);
        }, 8000); // Slower for reading

        return () => clearInterval(timer);
    }, []);

    const slideVariants = {
        enter: (direction: number) => ({
            x: direction > 0 ? 1000 : -1000,
            opacity: 0,
            scale: 0.8,
            rotateY: direction > 0 ? 45 : -45
        }),
        center: {
            zIndex: 1,
            x: 0,
            opacity: 1,
            scale: 1,
            rotateY: 0
        },
        exit: (direction: number) => ({
            zIndex: 0,
            x: direction < 0 ? 1000 : -1000,
            opacity: 0,
            scale: 0.8,
            rotateY: direction < 0 ? 45 : -45
        })
    };

    const fadeInUp = {
        hidden: { opacity: 0, y: 60 },
        visible: {
            opacity: 1,
            y: 0,
            transition: {
                duration: 0.8,
                ease: [0.23, 0.86, 0.39, 0.96]
            }
        }
    };

    const staggerContainer = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1,
                delayChildren: 0.3
            }
        }
    };

    const nextTestimonial = () => {
        setDirection(1);
        setCurrentIndex((prev) => (prev + 1) % testimonials.length);
    };

    const prevTestimonial = () => {
        setDirection(-1);
        setCurrentIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length);
    };

    return (
        <section id="testimonials" className="relative py-32 bg-background text-foreground overflow-hidden">
            {/* Background Image: Removed for Navy Theme consistency */}
            <div className="absolute inset-0 z-0 bg-background/50 backdrop-blur-[2px]" />

            {/* Enhanced Background Effects - Overlaid on image */}
            <div className="absolute inset-0 pointer-events-none z-0">
                {/* Animated gradient mesh - Reduced opacity to blend with image */}
                <motion.div
                    className="absolute inset-0 bg-gradient-to-br from-indigo-500/[0.05] via-purple-500/[0.03] to-rose-500/[0.05]"
                    animate={{
                        backgroundPosition: ['0% 0%', '100% 100%', '0% 0%'],
                    }}
                    transition={{
                        duration: 25,
                        repeat: Infinity,
                        ease: "linear"
                    }}
                    style={{
                        backgroundSize: '400% 400%'
                    }}
                />

                {/* Moving light orbs */}
                <motion.div
                    className="absolute top-1/3 left-1/5 w-72 h-72 bg-primary/10 rounded-full blur-3xl"
                    animate={{
                        x: [0, 150, 0],
                        y: [0, 80, 0],
                        scale: [1, 1.2, 1],
                    }}
                    transition={{
                        duration: 20,
                        repeat: Infinity,
                        ease: "easeInOut"
                    }}
                />
                <motion.div
                    className="absolute bottom-1/3 right-1/5 w-80 h-80 bg-rose-400/10 rounded-full blur-3xl"
                    animate={{
                        x: [0, -100, 0],
                        y: [0, -60, 0],
                        scale: [1, 1.3, 1],
                    }}
                    transition={{
                        duration: 22,
                        repeat: Infinity,
                        ease: "easeInOut"
                    }}
                />

                {/* Floating particles */}
                {[...Array(12)].map((_, i) => (
                    <motion.div
                        key={i}
                        className="absolute w-1 h-1 bg-foreground/30 rounded-full"
                        style={{
                            left: `${15 + (i * 7)}%`,
                            top: `${25 + (i * 5)}%`,
                        }}
                        animate={{
                            y: [0, -50, 0],
                            opacity: [0.2, 1, 0.2],
                            scale: [1, 2, 1],
                        }}
                        transition={{
                            duration: 3 + i * 0.5,
                            repeat: Infinity,
                            ease: "easeInOut",
                            delay: i * 0.3,
                        }}
                    />
                ))}
            </div>

            <motion.div
                ref={containerRef}
                className="relative z-10 max-w-7xl mx-auto px-6"
                variants={staggerContainer}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-100px" }}
            >
                {/* Header */}
                <motion.div
                    className="text-center mb-20"
                    variants={fadeInUp}
                >
                    <motion.div
                        className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-foreground/[0.08] border border-foreground/[0.15] backdrop-blur-sm mb-6"
                        whileHover={{ scale: 1.05, borderColor: "rgba(255, 255, 255, 0.3)" }}
                    >
                        <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                        >
                            <Sparkles className="h-4 w-4 text-primary" />
                        </motion.div>
                        <span className="text-sm font-medium text-foreground/80">
                            Client Love Stories
                        </span>
                        <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                    </motion.div>

                    <motion.h2
                        className="text-4xl sm:text-6xl md:text-7xl font-serif font-semibold mb-8 tracking-tight"
                        variants={fadeInUp}
                    >
                        <span className="bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/80">
                            Moments That
                        </span>
                        <br />
                        <motion.span
                            className="bg-clip-text text-transparent bg-gradient-to-r from-primary via-foreground to-rose-300"
                            animate={{
                                backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
                            }}
                            transition={{
                                duration: 5,
                                repeat: Infinity,
                                ease: "easeInOut"
                            }}
                            style={{
                                backgroundSize: '200% 200%'
                            }}
                        >
                            Last Forever
                        </motion.span>
                    </motion.h2>

                    <motion.p
                        className="text-xl sm:text-2xl text-foreground/60 max-w-4xl mx-auto leading-relaxed"
                        variants={fadeInUp}
                    >
                        Join hundreds of happy couples and clients who trusted Phoenix Events to effectively craft their dream celebrations.
                    </motion.p>
                </motion.div>

                {/* Main Testimonial Display */}
                <div className="relative max-w-6xl mx-auto mb-16">
                    <div className="relative h-[600px] md:h-[450px] perspective-1000">
                        <AnimatePresence initial={false} custom={direction}>
                            <motion.div
                                key={currentIndex}
                                custom={direction}
                                variants={slideVariants}
                                initial="enter"
                                animate="center"
                                exit="exit"
                                transition={{
                                    x: { type: "spring", stiffness: 300, damping: 30 },
                                    opacity: { duration: 0.4 },
                                    scale: { duration: 0.4 },
                                    rotateY: { duration: 0.6 }
                                }}
                                className="absolute inset-0"
                            >
                                <div className="relative h-full bg-gradient-to-br from-foreground/[0.08] to-foreground/[0.02] backdrop-blur-xl rounded-3xl border border-foreground/[0.15] p-8 md:p-12 overflow-hidden group">
                                    {/* Animated background gradient */}
                                    <motion.div
                                        className="absolute inset-0 bg-gradient-to-br from-primary/10 via-purple-500/[0.05] to-rose-500/[0.05] rounded-3xl"
                                        animate={{
                                            backgroundPosition: ['0% 0%', '100% 100%', '0% 0%'],
                                        }}
                                        transition={{
                                            duration: 15,
                                            repeat: Infinity,
                                            ease: "linear"
                                        }}
                                        style={{
                                            backgroundSize: '300% 300%'
                                        }}
                                    />

                                    {/* Quote icon */}
                                    <motion.div
                                        className="absolute top-8 right-8 opacity-20"
                                        animate={{ rotate: [0, 10, 0] }}
                                        transition={{ duration: 4, repeat: Infinity }}
                                    >
                                        <Quote className="w-16 h-16 text-foreground" />
                                    </motion.div>

                                    <div className="relative z-10 h-full flex flex-col md:flex-row items-center gap-8">
                                        {/* User Info */}
                                        <div className="flex-shrink-0 text-center md:text-left">
                                            <motion.div
                                                className="relative mb-6"
                                                whileHover={{ scale: 1.1 }}
                                                transition={{ duration: 0.3 }}
                                            >
                                                <div className="w-24 h-24 mx-auto md:mx-0 rounded-full overflow-hidden border-4 border-foreground/20 relative">
                                                    <img
                                                        src={testimonials[currentIndex].avatar}
                                                        alt={testimonials[currentIndex].name}
                                                        className="w-full h-full object-cover"
                                                        loading="lazy"
                                                        decoding="async"
                                                    />
                                                    <motion.div
                                                        className="absolute inset-0 bg-gradient-to-br from-primary/20 to-rose-400/20"
                                                        animate={{ opacity: [0, 0.3, 0] }}
                                                        transition={{ duration: 3, repeat: Infinity }}
                                                    />
                                                </div>

                                                {/* Floating ring animation */}
                                                <motion.div
                                                    className="absolute inset-0 border-2 border-primary/30 rounded-full"
                                                    animate={{
                                                        scale: [1, 1.4, 1],
                                                        opacity: [0.5, 0, 0.5]
                                                    }}
                                                    transition={{ duration: 2, repeat: Infinity }}
                                                />
                                            </motion.div>

                                            <h3 className="text-2xl font-serif font-semibold text-foreground mb-2">
                                                {testimonials[currentIndex].name}
                                            </h3>
                                            <p className="text-primary mb-1 font-medium">
                                                {testimonials[currentIndex].role}
                                            </p>
                                            <p className="text-foreground/60 mb-4">
                                                {testimonials[currentIndex].company}
                                            </p>

                                            {/* Star Rating */}
                                            <div className="flex justify-center md:justify-start gap-1 mb-6">
                                                {[...Array(testimonials[currentIndex].rating)].map((_, i) => (
                                                    <motion.div
                                                        key={i}
                                                        initial={{ opacity: 0, scale: 0 }}
                                                        animate={{ opacity: 1, scale: 1 }}
                                                        transition={{ delay: i * 0.1, duration: 0.3 }}
                                                    >
                                                        <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                                                    </motion.div>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Content */}
                                        <div className="flex-1">
                                            <motion.blockquote
                                                className="text-xl md:text-2xl text-foreground/90 leading-relaxed mb-8 font-light italic"
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                transition={{ delay: 0.3, duration: 0.8 }}
                                            >
                                                "{testimonials[currentIndex].text}"
                                            </motion.blockquote>

                                            {/* Results */}
                                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                                {testimonials[currentIndex].results.map((result, i) => (
                                                    <motion.div
                                                        key={i}
                                                        className="bg-foreground/[0.05] rounded-lg p-3 border border-foreground/[0.1] backdrop-blur-sm"
                                                        initial={{ opacity: 0, y: 20 }}
                                                        animate={{ opacity: 1, y: 0 }}
                                                        transition={{ delay: 0.5 + i * 0.1, duration: 0.5 }}
                                                        whileHover={{ backgroundColor: "rgba(255, 255, 255, 0.1)" }}
                                                    >
                                                        <span className="text-sm text-foreground/70 font-medium">
                                                            {result}
                                                        </span>
                                                    </motion.div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        </AnimatePresence>
                    </div>

                    {/* Navigation Controls */}
                    <div className="flex justify-center items-center gap-6 mt-8">
                        <motion.button
                            onClick={prevTestimonial}
                            className="p-3 rounded-full bg-foreground/[0.08] border border-foreground/[0.15] backdrop-blur-sm text-foreground hover:bg-foreground/[0.15] transition-all"
                            whileHover={{ scale: 1.1, backgroundColor: "rgba(255, 255, 255, 0.15)" }}
                            whileTap={{ scale: 0.95 }}
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </motion.button>

                        {/* Dots Indicator */}
                        <div className="flex gap-3">
                            {testimonials.map((_, index) => (
                                <motion.button
                                    key={index}
                                    onClick={() => {
                                        setDirection(index > currentIndex ? 1 : -1);
                                        setCurrentIndex(index);
                                    }}
                                    className={`w-3 h-3 rounded-full transition-all ${index === currentIndex
                                        ? 'bg-primary scale-125'
                                        : 'bg-foreground/30 hover:bg-foreground/50'
                                        }`}
                                    whileHover={{ scale: 1.2 }}
                                    whileTap={{ scale: 0.9 }}
                                />
                            ))}
                        </div>

                        <motion.button
                            onClick={nextTestimonial}
                            className="p-3 rounded-full bg-foreground/[0.08] border border-foreground/[0.15] backdrop-blur-sm text-foreground hover:bg-foreground/[0.15] transition-all"
                            whileHover={{ scale: 1.1, backgroundColor: "rgba(255, 255, 255, 0.15)" }}
                            whileTap={{ scale: 0.95 }}
                        >
                            <ArrowRight className="w-5 h-5" />
                        </motion.button>
                    </div>
                </div>

                {/* Stats Section */}
                <motion.div
                    className="grid grid-cols-2 md:grid-cols-4 gap-8"
                    variants={staggerContainer}
                >
                    {[
                        { number: "500+", label: "Happy Couples" },
                        { number: "98%", label: "Satisfaction Rate" },
                        { number: "12+", label: "Years Experience" },
                        { number: "100%", label: "Memorable Events" }
                    ].map((stat, index) => (
                        <motion.div
                            key={index}
                            className="text-center group"
                            variants={fadeInUp}
                            whileHover={{ scale: 1.05 }}
                        >
                            <motion.div
                                className="text-3xl md:text-4xl font-serif font-semibold bg-gradient-to-r from-primary to-rose-300 bg-clip-text text-transparent mb-2"
                                animate={{ opacity: [0.7, 1, 0.7] }}
                                transition={{ duration: 2, repeat: Infinity, delay: index * 0.5 }}
                            >
                                {stat.number}
                            </motion.div>
                            <div className="text-foreground/60 text-sm font-medium group-hover:text-foreground/80 transition-colors">
                                {stat.label}
                            </div>
                        </motion.div>
                    ))}
                </motion.div>
            </motion.div>
        </section>
    );
}
