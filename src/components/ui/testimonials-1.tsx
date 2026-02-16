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
            <div className="container px-4 md:px-6">
                <div className="flex flex-col items-center justify-center space-y-4 text-center">
                    <div className="space-y-2">
                        <div className="inline-block rounded-lg bg-primary px-3 py-1 text-sm text-primary-foreground">
                            {badgeText}
                        </div>
                        <h2 className="text-3xl font-bold tracking-tighter md:text-4xl/tight">
                            {title}
                        </h2>
                        <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed hidden md:block">
                            {subtitle}
                        </p>
                    </div>
                </div>

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

function TestimonialCard({ testimonial }: { testimonial: Testimonial }) {
    const stars = typeof testimonial.rating === "number" ? testimonial.rating : 5;

    return (
        <Card className="flex flex-col h-full bg-rose-50/50 dark:bg-navy/50 border-border/50 shadow-sm hover:shadow-md transition-all duration-300">
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
                    <img
                        src={testimonial.avatar}
                        alt={testimonial.name}
                        className="rounded-full w-10 h-10 object-cover border border-border"
                    />
                    <div className="text-left">
                        <p className="text-sm font-semibold text-foreground">{testimonial.name}</p>
                        <p className="text-xs text-muted-foreground">{testimonial.role}</p>
                    </div>
                </div>
            </CardFooter>
        </Card>
    );
}
