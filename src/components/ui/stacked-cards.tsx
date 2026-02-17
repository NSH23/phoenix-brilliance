"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Volume2, VolumeX } from "lucide-react";
import { cn } from "@/lib/utils";

interface StackedCardsProps {
    items: string[];
    className?: string; // wrapper class
    autoplay?: boolean; // Default true
}

export const StackedCards = ({ items, className, autoplay = true }: StackedCardsProps) => {
    const [activeVideoIndex, setActiveVideoIndex] = useState(0);
    const [isMuted, setIsMuted] = useState(false); // Default sound ON (if browser allows)
    const [isHovered, setIsHovered] = useState(false);
    const activeVideoRef = useRef<HTMLVideoElement | null>(null);

    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 768);
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    // Helper to check if file is video
    const isVideo = (src: string) => {
        if (!src) return false;
        const lower = src.toLowerCase();
        return lower.endsWith(".mp4") || lower.endsWith(".webm") || lower.endsWith(".mov");
    };

    // Handle Autoplay with Sound logic for the active video
    useEffect(() => {
        if (!items || items.length === 0 || !autoplay) return;

        const currentSrc = items[activeVideoIndex];
        if (!isVideo(currentSrc)) return;

        const video = activeVideoRef.current;
        if (!video) return;

        const playPromise = video.play();
        if (playPromise !== undefined) {
            playPromise
                .then(() => {
                    // Autoplay started!
                    // We don't force un-mute here if user explicitly muted, but initially it starts based on state
                    if (!isMuted) {
                        video.muted = false;
                    }
                })
                .catch((error) => {
                    console.log("Autoplay with sound blocked. Falling back to muted.", error);
                    video.muted = true;
                    video.play().catch(e => console.error("Force play failed", e));
                    setIsMuted(true);
                });
        }
    }, [activeVideoIndex, items, autoplay]); // Dependency on activeVideoIndex to replay when switching

    // Listen for other components playing video with sound
    useEffect(() => {
        const handleExclusivePlay = (e: Event) => {
            const customEvent = e as CustomEvent;
            if (customEvent.detail?.origin !== 'hero-stacked-cards') {
                setIsMuted(true);
                if (activeVideoRef.current) {
                    activeVideoRef.current.muted = true;
                }
            }
        };

        window.addEventListener('video-exclusive-play', handleExclusivePlay);
        return () => window.removeEventListener('video-exclusive-play', handleExclusivePlay);
    }, []);

    // Performance: Pause active video when out of view
    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (!entry.isIntersecting) {
                        // Pause active video if playing
                        if (activeVideoRef.current && !activeVideoRef.current.paused) {
                            activeVideoRef.current.pause();
                        }
                    } else {
                        // Resume if it was supposed to be playing?
                        // Autoplay logic handles initial play.
                        // If we are back in view, and it's the active item, maybe resume?
                        // Let's resume if it matches active index.
                        if (activeVideoRef.current && activeVideoRef.current.paused) {
                            activeVideoRef.current.play().catch(() => { });
                        }
                    }
                });
            },
            { threshold: 0.2 }
        );

        const container = activeVideoRef.current?.closest('.perspective-1000'); // targeting the container
        if (container) {
            observer.observe(container);
        } else {
            // Fallback: observe the parent of the first video found, or just the component wrapper if ref available
            // We don't have a ref for the wrapper div but we can find it
            // For now, let's try finding by class since we are inside the component
            const el = document.querySelector('.perspective-1000');
            if (el) observer.observe(el);
        }

        return () => observer.disconnect();
    }, [activeVideoIndex]); // Re-attach if index changes? properties might change. Actually observer is stable.

    // Handle mute toggle
    const toggleMute = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (activeVideoRef.current) {
            const newMutedState = !activeVideoRef.current.muted;
            activeVideoRef.current.muted = newMutedState;
            setIsMuted(newMutedState);

            // If we are unmuting, broadcast to others
            if (!newMutedState) {
                window.dispatchEvent(new CustomEvent('video-exclusive-play', {
                    detail: { origin: 'hero-stacked-cards' }
                }));
            }
        }
    };

    const handleItemClick = (index: number) => {
        if (index !== activeVideoIndex) {
            setActiveVideoIndex(index);
            // Reset mute state? Or keep persistent? Persistent seems better UX.
        }
    };

    const handleVideoEnd = () => {
        setActiveVideoIndex((prev) => (prev + 1) % items.length);
    };


    if (!items || items.length === 0) return null;

    return (
        <div
            className={cn("relative w-full h-full perspective-1000 flex items-center justify-center group", className)}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            {/* Decorative Glow - Added for Visual Balance */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-primary/20 blur-[100px] rounded-full opacity-60 pointer-events-none -z-10" />

            {/* Container for the cards to center them */}
            <div className="relative w-full h-full">
                {items.map((src, index) => {
                    // Calculate relative index ensuring it's always positive and cyclic
                    // This logic ensures: 0 is Active, 1 is Left, 2 is Right
                    // Based closely on HeroSection logic
                    let relativeIndex = (index - activeVideoIndex + items.length) % items.length;

                    // Stacked Cards Interaction Logic
                    const isFirst = relativeIndex === 0;

                    // Hover Effect: Increase spread and rotation
                    // Mobile: Tight spread (40px, 4deg)
                    // Desktop: Wide spread (80px, 12deg hovered / 50px, 6deg default)
                    const spreadDistance = isMobile ? 30 : (isHovered ? 80 : 50);
                    const rotationAngle = isMobile ? 3 : (isHovered ? 12 : 6);

                    let xOffset = 0;
                    let rotation = 0;
                    let scale = 1;
                    let zIndex = 0;

                    if (isFirst) {
                        zIndex = 10;
                        scale = 1;
                    } else if (relativeIndex === 1) {
                        // Second card goes left
                        xOffset = -spreadDistance;
                        rotation = -rotationAngle;
                        zIndex = 5;
                        scale = 0.95;
                    } else if (relativeIndex === 2) {
                        // Third card goes right OR if only 2 items, maybe treat differently?
                        // Hero logic: relativeIndex 2 goes right.
                        // If we have 2 items: index 0 (active), index 1 (left). That's it.
                        // If we have 3 items: index 0 (active), index 1 (left), index 2 (right).
                        xOffset = spreadDistance;
                        rotation = rotationAngle;
                        zIndex = 5;
                        scale = 0.95;
                    } else {
                        // For any other items (3+), hide them or stack behind center
                        zIndex = 0;
                        scale = 0.9;
                        xOffset = 0;
                    }

                    const isItemVideo = isVideo(src);

                    return (
                        <motion.div
                            // layoutId Removed to prevent conflict between multiple StackedCards instances using same image URLs
                            key={`${src}-${index}`}
                            className={cn(
                                "absolute inset-0 rounded-[2rem] overflow-hidden shadow-2xl transition-all duration-500 ease-out border-4 border-white/20 bg-black",
                                isFirst ? 'cursor-default' : 'cursor-pointer hover:brightness-110'
                            )}
                            style={{
                                zIndex,
                                transformOrigin: "center bottom",
                            }}
                            animate={{
                                x: xOffset,
                                rotate: rotation,
                                scale: scale,
                                opacity: relativeIndex > 2 ? 0 : 1, // Minimize if not in top 3
                            }}
                            transition={{
                                duration: 0.4, // Slower for smoother hover effect
                                ease: "backOut", // Bouncy effect on hover
                            }}
                            onClick={() => handleItemClick(index)}
                        >
                            {isItemVideo ? (
                                <video
                                    ref={isFirst ? activeVideoRef : null}
                                    src={src}
                                    className="w-full h-full object-cover"
                                    muted={isMuted} // Controlled by state
                                    playsInline
                                    loop={false}
                                    onEnded={isFirst ? handleVideoEnd : undefined}
                                />
                            ) : (
                                <img
                                    src={src}
                                    alt="Gallery Media"
                                    className="w-full h-full object-cover"
                                />
                            )}

                            {/* Overlay for non-active items */}
                            {!isFirst && <div className="absolute inset-0 bg-black/30 pointer-events-none" />}

                            {/* Controls/Overlay for active video only */}
                            {isFirst && isItemVideo && (
                                <div className="absolute inset-0 pointer-events-none">
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-60" />
                                    <button
                                        onClick={toggleMute}
                                        className="pointer-events-auto absolute bottom-6 right-6 w-12 h-12 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center text-white hover:bg-white/20 transition-all duration-300 z-20 hover:scale-110"
                                        aria-label={isMuted ? "Unmute video" : "Mute video"}
                                    >
                                        {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
                                    </button>
                                </div>
                            )}
                        </motion.div>
                    );
                })}
            </div>
        </div>
    );
};
