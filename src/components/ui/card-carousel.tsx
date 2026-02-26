import React, { useEffect, useRef, useState } from "react"
import { Swiper, SwiperSlide } from "swiper/react"

import "swiper/css"
import "swiper/css/effect-coverflow"
import "swiper/css/pagination"
import "swiper/css/navigation"
import { Play } from "lucide-react"
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
    /** When true, title and description are not rendered (e.g. when section provides its own header) */
    showHeader?: boolean
    /** When true, container spans full width (no max-width constraint) */
    fullWidth?: boolean
    /** When true, adds extra space above pagination dots (~1cm) */
    paginationSpaced?: boolean
}

interface VideoSlideProps {
    src: string
    index: number
    isCenter: boolean
    requestPlay: boolean
    onPlayStarted: () => void
    onEnded: () => void
    swiperRef: React.MutableRefObject<SwiperType | null>
}

const VideoSlide = ({ src, index, isCenter, requestPlay, onPlayStarted, onEnded, swiperRef }: VideoSlideProps) => {
    const videoRef = useRef<HTMLVideoElement>(null)
    const [isPlaying, setIsPlaying] = useState(false)

    // When parent requests play (e.g. after previous video ended), play this video
    useEffect(() => {
        if (!requestPlay || !isCenter) return
        const video = videoRef.current
        if (!video) return
        window.dispatchEvent(new CustomEvent('video-exclusive-play', { detail: { origin: 'reels-carousel' } }))
        const allVideos = document.querySelectorAll('.swiper-slide video')
        allVideos.forEach((v) => {
            if (v !== video) (v as HTMLVideoElement).pause()
        })
        if (swiperRef.current?.autoplay?.running) swiperRef.current.autoplay.stop()
        video.muted = false
        video.currentTime = 0
        video.play().then(() => {
            setIsPlaying(true)
            onPlayStarted()
        }).catch(() => {})
    }, [requestPlay, isCenter, onPlayStarted, swiperRef])

    const handleClick = () => {
        if (!isCenter) return
        const video = videoRef.current
        if (!video) return

        if (video.paused) {
            window.dispatchEvent(new CustomEvent('video-exclusive-play', { detail: { origin: 'reels-carousel' } }))
            const allVideos = document.querySelectorAll('.swiper-slide video')
            allVideos.forEach((v) => {
                if (v !== video) (v as HTMLVideoElement).pause()
            })
            if (swiperRef.current?.autoplay?.running) swiperRef.current.autoplay.stop()
            video.muted = false
            video.currentTime = 0
            video.play().then(() => setIsPlaying(true)).catch(() => {})
        } else {
            video.pause()
            setIsPlaying(false)
            if (swiperRef.current?.autoplay && !swiperRef.current.autoplay.running) {
                swiperRef.current.autoplay.start()
            }
        }
    }

    const handleEnded = () => {
        const video = videoRef.current
        if (!video) return
        setIsPlaying(false)
        video.currentTime = 0
        video.pause()
        onEnded()
    }

    useEffect(() => {
        const v = videoRef.current
        if (!v) return
        const onPause = () => setIsPlaying(false)
        const onPlay = () => setIsPlaying(true)
        v.addEventListener('pause', onPause)
        v.addEventListener('play', onPlay)
        return () => {
            v.removeEventListener('pause', onPause)
            v.removeEventListener('play', onPlay)
        }
    }, [])

    return (
        <div className="relative w-full h-full group" onClick={handleClick}>
            <video
                ref={videoRef}
                src={src}
                className="size-full object-cover rounded-xl pointer-events-none"
                loop={false}
                muted
                playsInline
                preload="metadata"
                onEnded={handleEnded}
            />
            {/* Play icon only on center slide; hide when playing */}
            {isCenter && !isPlaying && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/10 backdrop-blur-[1px] transition-all duration-300 group-hover:bg-black/20 z-20 cursor-pointer">
                    <div className="flex items-center justify-center w-16 h-16 rounded-full bg-black/30 backdrop-blur-md border-2 border-white/30 shadow-xl transition-transform duration-300 group-hover:scale-105 group-active:scale-95">
                        <Play className="w-7 h-7 text-white fill-white ml-0.5" />
                    </div>
                </div>
            )}
        </div>
    )
}

export const CardCarousel: React.FC<CarouselProps> = ({
    images,
    autoplayDelay = 1500,
    showPagination = true,
    showNavigation = true,
    title = "Card Carousel",
    description = "Seamless Images carousel animation.",
    showHeader = true,
    fullWidth = false,
    paginationSpaced = false,
}) => {
    const swiperRef = useRef<SwiperType | null>(null)
    const [activeIndex, setActiveIndex] = useState(0)
    const [nextShouldPlayIndex, setNextShouldPlayIndex] = useState<number | null>(null)

    const handleVideoEnded = () => {
        const n = images.length
        if (n === 0) return
        const nextIndex = (activeIndex + 1) % n
        setNextShouldPlayIndex(nextIndex)
        swiperRef.current?.slideNext()
    }

    const handlePlayStarted = () => {
        setNextShouldPlayIndex(null)
    }

    useEffect(() => {
        const handleExclusivePlay = (e: Event) => {
            const customEvent = e as CustomEvent
            if (customEvent.detail?.origin !== 'reels-carousel') {
                const allVideos = document.querySelectorAll('.swiper-slide video')
                allVideos.forEach((v) => {
                    (v as HTMLVideoElement).pause()
                })
                if (swiperRef.current?.autoplay && !swiperRef.current.autoplay.running) {
                    swiperRef.current.autoplay.start()
                }
            }
        }
        window.addEventListener('video-exclusive-play', handleExclusivePlay)
        return () => window.removeEventListener('video-exclusive-play', handleExclusivePlay)
    }, [])

    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    const swiper = swiperRef.current
                    if (!entry.isIntersecting) {
                        if (swiper?.autoplay?.running) swiper.autoplay.stop()
                        document.querySelectorAll('.swiper-slide video').forEach((v) => (v as HTMLVideoElement).pause())
                    } else {
                        if (swiper?.autoplay && !swiper.autoplay.running) swiper.autoplay.start()
                    }
                })
            },
            { threshold: 0.1 }
        )
        const section = document.querySelector('.swiper')?.closest('section')
        if (section) observer.observe(section)
        return () => observer.disconnect()
    }, [])

    const css = `
  .swiper { width: 100%; padding-bottom: 24px; }
  .swiper.reels-pagination-spaced { padding-bottom: 56px; }
  .swiper-slide { background-position: center; background-size: cover; width: 420px; }
  @media (max-width: 768px) { .swiper-slide { width: 300px; } }
  .swiper-slide img, .swiper-slide video { display: block; width: 100%; }
  .swiper-3d .swiper-slide-shadow-left, .swiper-3d .swiper-slide-shadow-right { background: none; }
  `

    return (
        <section className="w-full space-y-2">
            <style>{css}</style>
            <div className={`mx-auto w-full rounded-2xl border border-border/60 bg-card/40 dark:bg-card/20 backdrop-blur-sm p-4 md:p-6 shadow-elevation-1 dark:shadow-elevation-1-dark ${fullWidth ? "max-w-none" : "max-w-6xl"}`}>
                <div className="relative mx-auto flex w-full flex-col gap-4 md:gap-6">
                    {showHeader && (title || description) && (
                        <div className="flex flex-col justify-center pb-1 pl-0 pt-0 md:items-center w-full">
                            <div className="flex gap-2 text-center">
                                <div>
                                    <h3 className="text-4xl md:text-5xl font-serif font-semibold tracking-tight text-primary mb-2">{title}</h3>
                                    <p className="text-lg md:text-xl text-muted-foreground dark:text-muted-foreground/80 max-w-2xl mx-auto">{description}</p>
                                </div>
                            </div>
                        </div>
                    )}
                    <div className="flex w-full items-center justify-center gap-4">
                        <div className="w-full">
                            <Swiper
                                className={paginationSpaced ? "reels-pagination-spaced" : undefined}
                                onSwiper={(swiper) => { swiperRef.current = swiper }}
                                onSlideChange={(swiper) => setActiveIndex(swiper.realIndex)}
                                spaceBetween={50}
                                autoplay={{
                                    delay: 0,
                                    disableOnInteraction: false,
                                    pauseOnMouseEnter: true,
                                }}
                                speed={8000}
                                effect="coverflow"
                                grabCursor={true}
                                centeredSlides={true}
                                loop={true}
                                slidesPerView="auto"
                                coverflowEffect={{
                                    rotate: 0,
                                    stretch: 0,
                                    depth: 100,
                                    modifier: 2.5,
                                }}
                                pagination={showPagination}
                                navigation={
                                    showNavigation
                                        ? { nextEl: ".swiper-button-next", prevEl: ".swiper-button-prev" }
                                        : undefined
                                }
                                modules={[EffectCoverflow, Autoplay, Pagination, Navigation]}
                            >
                                {images.map((image, index) => {
                                    const isVideo = /\.(mp4|webm|mov)(\?|$)/i.test(image.src) || image.src.includes('/video') || image.src.includes('content-media');
                                    return (
                                    <SwiperSlide key={`${index}-${image.src}`}>
                                        <div className="group size-full rounded-3xl overflow-hidden aspect-[3/4] relative bg-black/80 border border-border/50 dark:border-white/10 shadow-elevation-1 dark:shadow-elevation-1-dark">
                                            {isVideo ? (
                                                <VideoSlide
                                                    src={image.src}
                                                    index={index}
                                                    isCenter={activeIndex === index}
                                                    requestPlay={nextShouldPlayIndex === index}
                                                    onPlayStarted={handlePlayStarted}
                                                    onEnded={handleVideoEnded}
                                                    swiperRef={swiperRef}
                                                />
                                            ) : (
                                                <img src={image.src} className="size-full object-cover rounded-xl" alt={image.alt} loading="lazy" decoding="async" />
                                            )}
                                            <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-all duration-300 pointer-events-none" />
                                        </div>
                                    </SwiperSlide>
                                ); })}
                            </Swiper>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    )
}
