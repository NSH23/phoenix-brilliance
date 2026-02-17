"use client"

import React from "react"
// import Image from "next/image" // Removed for Vite compatibility
import { Swiper, SwiperSlide } from "swiper/react"

import "swiper/css"
import "swiper/css/effect-coverflow"
import "swiper/css/pagination"
import "swiper/css/navigation"
import { SparklesIcon } from "lucide-react"
import {
    Autoplay,
    EffectCoverflow,
    Navigation,
    Pagination,
} from "swiper/modules"

import { useEffect, useRef } from "react"
import type { Swiper as SwiperType } from "swiper"
import { Badge } from "@/components/ui/badge"

interface CarouselProps {
    images: { src: string; alt: string }[]
    autoplayDelay?: number
    showPagination?: boolean
    showNavigation?: boolean
    title?: string
    description?: string
}

export const CardCarousel: React.FC<CarouselProps> = ({
    images,
    autoplayDelay = 1500,
    showPagination = true,
    showNavigation = true,
    title = "Card Carousel",
    description = "Seamless Images carousel animation."
}) => {
    const swiperRef = useRef<SwiperType | null>(null);

    // Listen for global exclusive play events
    useEffect(() => {
        const handleExclusivePlay = (e: Event) => {
            const customEvent = e as CustomEvent;
            // If the event came from somewhere else (like Hero), reset us!
            if (customEvent.detail?.origin !== 'reels-carousel') {
                const swiper = swiperRef.current;
                const allVideos = document.querySelectorAll('.swiper-slide video');
                allVideos.forEach((v) => {
                    const vid = v as HTMLVideoElement;
                    vid.muted = true;
                    vid.loop = true;
                    vid.play().catch(() => { });
                });
                if (swiper?.autoplay && !swiper.autoplay.running) {
                    swiper.autoplay.start();
                }
            }
        };

        window.addEventListener('video-exclusive-play', handleExclusivePlay);
        return () => window.removeEventListener('video-exclusive-play', handleExclusivePlay);
    }, []);

    // Performance: Pause when out of view
    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    const swiper = swiperRef.current;
                    if (!entry.isIntersecting) {
                        // Pause Swiper
                        if (swiper?.autoplay?.running) {
                            swiper.autoplay.stop();
                        }
                        // Pause ALL videos
                        const allVideos = document.querySelectorAll('.swiper-slide video');
                        allVideos.forEach((v) => (v as HTMLVideoElement).pause());
                    } else {
                        // Resume Swiper auto-scroll (but keep videos muted/default unless user interacted? Default is auto-play silent)
                        if (swiper?.autoplay && !swiper.autoplay.running) {
                            swiper.autoplay.start();
                        }
                        // Resume silent loop for visible slides?
                        // Ideally we only play visible ones, but simpler is to play all that were looping.
                        // For now, let's just resume the silent loop behavior.
                        const allVideos = document.querySelectorAll('.swiper-slide video');
                        allVideos.forEach((v) => {
                            const vid = v as HTMLVideoElement;
                            // Only play if it was meant to be playing (we don't track that state easily globally, so reset to default silent loop)
                            if (vid.muted) {
                                vid.play().catch(() => { });
                            }
                        });
                    }
                });
            },
            { threshold: 0.1 } // 10% visibility triggers it
        );

        const section = document.querySelector('.swiper')?.closest('section');
        if (section) {
            observer.observe(section);
        }

        return () => observer.disconnect();
    }, []);

    const css = `
  .swiper {
    width: 100%;
    padding-bottom: 50px;
  }
  
  .swiper-slide {
    background-position: center;
    background-size: cover;
    width: 420px; /* Reduced from 450px */
    /* height: 300px; */
    /* margin: 20px; */
  }

  @media (max-width: 768px) {
    .swiper-slide {
      width: 300px;
    }
  }
  
  .swiper-slide img {
    display: block;
    width: 100%;
  }

  .swiper-slide video {
    display: block;
    width: 100%;
  }


  
  .swiper-3d .swiper-slide-shadow-left {
    background-image: none;
  }
  .swiper-3d .swiper-slide-shadow-right{
    background: none;
  }
  `


    // Helper to manage ambient video playback: only play Center, Left (Prev), and Right (Next)
    const updateActiveVideos = (swiper: SwiperType) => {
        if (!swiper || !swiper.el) return;

        // 1. Pause ALL videos first (unless they are unmuted/interactive)
        const allVideos = swiper.el.querySelectorAll('video');
        allVideos.forEach((v) => {
            if (v.muted && !v.paused) {
                v.pause();
            }
        });

        // 2. Play only the active 3 (Active, Prev, Next)
        // Swiper adds specific classes to these slides.
        const activeSlides = swiper.el.querySelectorAll('.swiper-slide-active, .swiper-slide-prev, .swiper-slide-next');

        activeSlides.forEach((slide) => {
            const video = slide.querySelector('video');
            // Only play if it's meant to be ambient (muted)
            if (video && video.muted) {
                video.play().catch((e) => {
                    // console.log("Auto-play prevented", e);
                });
            }
        });
    };

    return (
        <section className="w-full space-y-4">
            <style>{css}</style>
            <div className="mx-auto w-full rounded-[24px] border border-black/5 p-2 shadow-sm md:rounded-t-[44px]">
                <div className="relative mx-auto flex w-full flex-col rounded-[24px] border border-black/5 bg-neutral-800/5 p-2 shadow-sm md:items-start md:gap-8 md:rounded-b-[20px] md:rounded-t-[40px] md:p-2">

                    <div className="flex flex-col justify-center pb-2 pl-4 pt-14 md:items-center w-full">
                        <div className="flex gap-2 text-center">
                            <div>
                                <h3 className="text-4xl md:text-5xl font-bold tracking-tight text-primary mb-2">
                                    {title}
                                </h3>
                                <p className="text-lg md:text-xl text-muted-foreground dark:text-muted-foreground/80 max-w-2xl mx-auto">{description}</p>
                            </div>
                        </div>
                    </div>

                    <div className="flex w-full items-center justify-center gap-4">
                        <div className="w-full">
                            <Swiper
                                onSwiper={(swiper) => {
                                    swiperRef.current = swiper;
                                    // Initial Playback Check
                                    setTimeout(() => {
                                        updateActiveVideos(swiper);
                                    }, 100);
                                }}
                                onSlideChange={(swiper) => updateActiveVideos(swiper)}
                                spaceBetween={50}
                                // Continuous Autoplay Config
                                autoplay={{
                                    delay: 0, // No pause
                                    disableOnInteraction: false,
                                    pauseOnMouseEnter: true, // Allow user to stop it by hovering
                                }}
                                speed={8000} // Slow continuous speed
                                effect={"coverflow"}
                                grabCursor={true}
                                centeredSlides={true}
                                loop={true}
                                slidesPerView={"auto"}
                                coverflowEffect={{
                                    rotate: 0,
                                    stretch: 0,
                                    depth: 100,
                                    modifier: 2.5,
                                }}
                                pagination={showPagination}
                                navigation={
                                    showNavigation
                                        ? {
                                            nextEl: ".swiper-button-next",
                                            prevEl: ".swiper-button-prev",
                                        }
                                        : undefined
                                }
                                modules={[EffectCoverflow, Autoplay, Pagination, Navigation]}
                            >
                                {images.map((image, index) => (
                                    <SwiperSlide key={index}>
                                        <div className="size-full rounded-3xl overflow-hidden aspect-[3/4] relative group bg-black">
                                            {/* Support video if src ends in mp4/webm etc, otherwise img */}
                                            {image.src.match(/\.(mp4|webm)$/i) ? (
                                                <div
                                                    className="relative w-full h-full cursor-pointer"
                                                    onClick={(e) => {
                                                        const container = e.currentTarget;
                                                        const video = container.querySelector('video');
                                                        if (!video) return;

                                                        const isPlayingAudio = !video.muted && !video.paused;
                                                        const swiper = swiperRef.current; // Use the ref for Swiper instance

                                                        // Helper to reset all videos to silent loop
                                                        const resetAll = () => {
                                                            const allVideos = document.querySelectorAll('.swiper-slide video');
                                                            allVideos.forEach((v) => {
                                                                const vid = v as HTMLVideoElement;
                                                                vid.muted = true;
                                                                vid.loop = true;
                                                                vid.play().catch(() => { });
                                                            });
                                                            if (swiper?.autoplay && !swiper.autoplay.running) {
                                                                swiper.autoplay.start();
                                                            }
                                                        };

                                                        // Listen for external exclusive play events (e.g. from Hero)
                                                        // This needs to be attached once, but here we are in a click handler.
                                                        // Better to just dispatch here and have a separate useEffect for listening.
                                                        // See below for the useEffect injection.

                                                        if (isPlayingAudio) {
                                                            // Toggle OFF: Go back to normal
                                                            resetAll();
                                                        } else {
                                                            // Toggle ON: Active mode

                                                            // 0. Broadcast exclusive play to other components (like Hero)
                                                            window.dispatchEvent(new CustomEvent('video-exclusive-play', {
                                                                detail: { origin: 'reels-carousel' }
                                                            }));

                                                            // 1. Pause all others IN THIS COMPONENT
                                                            const allVideos = document.querySelectorAll('.swiper-slide video');
                                                            allVideos.forEach(v => {
                                                                if (v !== video) {
                                                                    (v as HTMLVideoElement).pause();
                                                                }
                                                            });

                                                            // 2. Stop Swiper
                                                            if (swiper?.autoplay?.running) {
                                                                swiper.autoplay.stop();
                                                            }

                                                            // 3. Play this one unmuted, no loop (to catch end)
                                                            video.muted = false;
                                                            video.loop = false;
                                                            video.currentTime = 0; // Optional: restart or continue? User didn't specify, but restart is cleaner for "playing a moment". Let's simply unmute and ensure playing.
                                                            // actually if it was already looping silently, continuing is better.
                                                            video.play().catch(console.error);
                                                        }
                                                    }}
                                                >
                                                    <video
                                                        src={image.src}
                                                        className="size-full object-cover rounded-xl pointer-events-none"
                                                        autoPlay
                                                        loop
                                                        muted
                                                        playsInline
                                                        preload="metadata"
                                                        onEnded={(e) => {
                                                            // When finished, go back to normal
                                                            const video = e.currentTarget;
                                                            const swiper = swiperRef.current; // Use the ref for Swiper instance

                                                            // Reset this video to silent loop
                                                            video.muted = true;
                                                            video.loop = true;
                                                            video.play().catch(() => { });

                                                            // Restart others?
                                                            // User: "when playing is off then other should start behaving normally"
                                                            const allVideos = document.querySelectorAll('.swiper-slide video');
                                                            allVideos.forEach((v) => {
                                                                if (v !== video) {
                                                                    const vid = v as HTMLVideoElement;
                                                                    vid.muted = true;
                                                                    vid.loop = true;
                                                                    vid.play().catch(() => { });
                                                                }
                                                            });

                                                            // Restart Swiper
                                                            if (swiper?.autoplay && !swiper.autoplay.running) {
                                                                swiper.autoplay.start();
                                                            }
                                                        }}
                                                    />
                                                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <div className="bg-black/50 p-3 rounded-full backdrop-blur-sm">
                                                            <SparklesIcon className="w-6 h-6 text-white" />
                                                        </div>
                                                    </div>
                                                </div>
                                            ) : (
                                                <img
                                                    src={image.src}
                                                    className="size-full object-cover rounded-xl"
                                                    alt={image.alt}
                                                />
                                            )}
                                            <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-all duration-300 pointer-events-none" />
                                        </div>
                                    </SwiperSlide>
                                ))}
                            </Swiper>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    )
}
