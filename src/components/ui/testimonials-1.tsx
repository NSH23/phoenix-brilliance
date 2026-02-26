import { Card, CardHeader, CardFooter, CardContent } from "@/components/ui/card";
import { Star } from "lucide-react";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

export interface Testimonial {
    name: string;
    role: string;
    text: string;
    avatar: string;
    rating?: number;
}

interface TestimonialsSectionProps {
    title?: string;
    subtitle?: string;
    badgeText?: string;
    testimonials: Testimonial[];
    className?: string; // Added className prop for flexibility
}

export function TestimonialsSection({
    title = "Trusted by thousands of teams",
    subtitle = "See what our customers have to say about us.",
    badgeText = "Testimonials",
    testimonials,
    className,
}: TestimonialsSectionProps) {
    const [currentIndex, setCurrentIndex] = useState(0);

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentIndex((prev) => (prev + 1) % testimonials.length);
        }, 5000);

        return () => clearInterval(timer);
    }, [testimonials.length]);

    return (
        <section id="testimonials" className={`w-full py-4 md:py-10 lg:py-12 ${className || ""}`}>
            <div className="container px-4 mx-auto max-w-7xl">
                {/* Header – editorial left-accent (same as Events, Services, Reels) */}
                <header className="pl-5 md:pl-6 border-l-4 border-primary mb-8 md:mb-10 space-y-1">
                    <p className="text-primary font-sans font-semibold text-xs md:text-sm tracking-[0.2em] uppercase">
                        {badgeText}
                    </p>
                    <h2 className="font-serif font-medium leading-tight text-3xl md:text-4xl lg:text-5xl text-foreground dark:text-white">
                        {title}
                    </h2>
                    {subtitle && (
                        <p className="mt-4 max-w-xl text-muted-foreground dark:text-white/70 text-base md:text-lg leading-relaxed font-sans">
                            {subtitle}
                        </p>
                    )}
                </header>

                {/* Desktop Grid View - Exact same grid as before */}
                <div className="hidden md:grid mx-auto max-w-7xl gap-4 py-4 grid-cols-2 lg:grid-cols-3">
                    {testimonials.map((t, i) => (
                        <TestimonialCard key={i} testimonial={t} />
                    ))}
                </div>

                {/* Mobile Carousel View */}
                <div className="block md:hidden mx-auto max-w-sm py-4 h-[300px] relative">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={currentIndex}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ duration: 0.3 }}
                            className="absolute inset-0"
                        >
                            <TestimonialCard testimonial={testimonials[currentIndex]} />
                        </motion.div>
                    </AnimatePresence>

                    {/* Dots Indicator */}
                    <div className="absolute -bottom-8 left-0 right-0 flex justify-center gap-2">
                        {testimonials.map((_, index) => (
                            <button
                                key={index}
                                onClick={() => setCurrentIndex(index)}
                                className={`w-2 h-2 rounded-full transition-all ${index === currentIndex
                                    ? 'bg-primary w-4'
                                    : 'bg-muted-foreground/30'
                                    }`}
                                aria-label={`Go to testimonial ${index + 1}`}
                            />
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}

function getInitials(name: string): string {
    return name
        .split(/\s+/)
        .map((part) => part[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
}

function TestimonialCard({ testimonial }: { testimonial: Testimonial }) {
    const stars = typeof testimonial.rating === "number" ? testimonial.rating : 5;
    const hasRealAvatar = testimonial.avatar && !testimonial.avatar.includes("unsplash.com") && !testimonial.avatar.includes("ui-avatars.com");

    return (
        <Card className="testimonial-card-item flex flex-col h-full rounded-2xl border-2 border-white/50 dark:border-white/20 bg-white/20 dark:bg-card/80 backdrop-blur-2xl shadow-[0_8px_32px_rgba(0,0,0,0.08),inset_0_1px_0_rgba(255,255,255,0.7)] dark:shadow-elevation-1-dark transition-all duration-300 ease-out hover:border-white/70 dark:hover:border-primary/40 hover:shadow-[0_12px_40px_rgba(0,0,0,0.1),inset_0_1px_0_rgba(255,255,255,0.8)] hover:-translate-y-1">
            <CardHeader className="p-4">
                <div className="flex items-center gap-2">
                    <div className="flex">
                        {Array.from({ length: 5 }).map((_, idx) => (
                            <Star
                                key={idx}
                                className={`h-4 w-4 ${idx < stars
                                    ? "fill-primary text-primary"
                                    : "text-muted fill-muted/20 text-muted-foreground/20"
                                    }`}
                            />
                        ))}
                    </div>
                </div>
            </CardHeader>
            <CardContent className="p-4 pt-0 flex-grow">
                <p className="text-muted-foreground italic line-clamp-4">"{testimonial.text}"</p>
            </CardContent>
            <CardFooter className="mt-auto p-4 pt-0">
                <div className="flex items-center gap-4">
                    {hasRealAvatar ? (
                        <img
                            src={testimonial.avatar}
                            alt={testimonial.name}
                            className="rounded-full w-10 h-10 object-cover border border-border"
                            loading="lazy"
                            decoding="async"
                        />
                    ) : (
                        <div
                            className="rounded-full w-10 h-10 flex items-center justify-center border border-border bg-primary/10 text-primary text-sm font-medium"
                            aria-hidden
                        >
                            {getInitials(testimonial.name)}
                        </div>
                    )}
                    <div className="text-left">
                        <p className="text-sm font-semibold text-foreground">{testimonial.name}</p>
                        <p className="text-xs text-muted-foreground">{testimonial.role}</p>
                    </div>
                </div>
            </CardFooter>
        </Card>
    );
}
