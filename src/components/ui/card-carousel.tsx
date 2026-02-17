import React, { useEffect, useRef, useState } from "react"
import { Swiper, SwiperSlide } from "swiper/react"

import "swiper/css"
import "swiper/css/effect-coverflow"
import "swiper/css/pagination"
import "swiper/css/navigation"
import { SparklesIcon, Volume2, VolumeX } from "lucide-react"
import {
    Autoplay,
    EffectCoverflow,
    Navigation,
    Pagination,
} from "swiper/modules"

import type { Swiper as SwiperType } from "swiper"

interface CarouselProps {
    images: { src: string; alt: string }[]
    autoplayDelay?: number
    showPagination?: boolean
    showNavigation?: boolean
    title?: string
    description?: string
}

// Sub-component for individual video slides to handle local state (sound icon)
const VideoSlide = ({ src, swiperRef }: { src: string, swiperRef: React.MutableRefObject<SwiperType | null> }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [isMuted, setIsMuted] = useState(true);

    const handleClick = () => {
        const video = videoRef.current;
        if (!video) return;

        const isPlayingAudio = !video.muted && !video.paused;
        const swiper = swiperRef.current;

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

        if (isPlayingAudio) {
            // Toggle OFF: Go back to normal
            resetAll();
        } else {
            // Toggle ON: Active mode

            // 0. Broadcast exclusive play
            window.dispatchEvent(new CustomEvent('video-exclusive-play', {
                detail: { origin: 'reels-carousel' }
            }));

            // 1. Pause all others
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

            // 3. Play this one unmuted, no loop
            video.muted = false;
            video.loop = false;
            video.currentTime = 0;
            video.play().catch(console.error);
        }
    };

    const handleEnded = () => {
        const video = videoRef.current;
        const swiper = swiperRef.current;
        if (!video) return;

        // Reset this video to silent loop
        video.muted = true;
        video.loop = true;
        video.play().catch(() => { });

        // Restart others?
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
    };

    return (
        <div className="relative w-full h-full cursor-pointer group" onClick={handleClick}>
            <video
                ref={videoRef}
                src={src}
                className="size-full object-cover rounded-xl pointer-events-none"
                autoPlay
                loop
                muted
                playsInline
                preload="metadata"
                onEnded={handleEnded}
                onVolumeChange={(e) => setIsMuted(e.currentTarget.muted)}
            />

            {/* Sound Indicator Icon - Bottom Right */}
            <div className="absolute bottom-4 right-4 z-20">
                <div className="bg-black/40 p-2 rounded-full backdrop-blur-md border border-white/10 shadow-sm transition-all duration-300 group-hover:bg-black/60">
                    {isMuted ? (
                        <VolumeX className="w-4 h-4 text-white/90" />
                    ) : (
                        <Volume2 className="w-4 h-4 text-white" />
                    )}
                </div>
            </div>

            {/* Removing the center SparklesIcon overlay as requested */}
        </div>
    );
};

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
                        // Resume Swiper auto-scroll
                        if (swiper?.autoplay && !swiper.autoplay.running) {
                            swiper.autoplay.start();
                        }
                        // Resume silent loop
                        const allVideos = document.querySelectorAll('.swiper-slide video');
                        allVideos.forEach((v) => {
                            const vid = v as HTMLVideoElement;
                            if (vid.muted) {
                                vid.play().catch(() => { });
                            }
                        });
                    }
                });
            },
            { threshold: 0.1 }
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
    width: 420px;
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

    // Helper to manage ambient video playback
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
        const activeSlides = swiper.el.querySelectorAll('.swiper-slide-active, .swiper-slide-prev, .swiper-slide-next');

        activeSlides.forEach((slide) => {
            const video = slide.querySelector('video');
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
                                    setTimeout(() => {
                                        updateActiveVideos(swiper);
                                    }, 100);
                                }}
                                onSlideChange={(swiper) => updateActiveVideos(swiper)}
                                spaceBetween={50}
                                autoplay={{
                                    delay: 0,
                                    disableOnInteraction: false,
                                    pauseOnMouseEnter: true,
                                }}
                                speed={8000}
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
                                            {image.src.match(/\.(mp4|webm)$/i) ? (
                                                <VideoSlide src={image.src} swiperRef={swiperRef} />
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
