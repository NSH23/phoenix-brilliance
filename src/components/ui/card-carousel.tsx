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
import { getYouTubeId, getYouTubeThumbnail, isYouTubeValue } from "@/lib/youtube"

const EXCLUSIVE_VIDEO_EVENT = "reels-exclusive-play"
/** Fired when a page-level reel/hero handoff is done so another player may resume (e.g. hero after a reel ends). */
const VIDEO_EXCLUSIVE_RELEASE = "video-exclusive-release"

let youTubeApiPromise: Promise<void> | null = null

// Ensure YT iframe matches our card frame sizing/styling.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normalizeYouTubeIframe(player: any) {
    const iframe = player?.getIframe?.() as HTMLIFrameElement | undefined
    if (!iframe) return
    iframe.style.width = "100%"
    iframe.style.height = "100%"
    iframe.style.display = "block"
    iframe.style.border = "none"
    iframe.style.borderRadius = "0.75rem"
}

function ensureYouTubeIframeApiLoaded(): Promise<void> {
    if (youTubeApiPromise) return youTubeApiPromise
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const w = window as any
    if (w.YT?.Player) {
        youTubeApiPromise = Promise.resolve()
        return youTubeApiPromise
    }

    youTubeApiPromise = new Promise((resolve) => {
        // If script already exists, just resolve on callback.
        const existing = document.querySelector('script[src="https://www.youtube.com/iframe_api"]') as HTMLScriptElement | null
        if (!existing) {
            const script = document.createElement("script")
            script.src = "https://www.youtube.com/iframe_api"
            script.async = true
            document.body.appendChild(script)
        }

        // YouTube calls this global once the API is ready.
        w.onYouTubeIframeAPIReady = () => resolve()
    })

    return youTubeApiPromise
}

function lockCarouselPlayback(swiper: SwiperType | null) {
    if (!swiper) return
    swiper.autoplay.stop()
    const idx = swiper.realIndex
    swiper.slideToLoop(idx, 0)
    swiper.allowTouchMove = false
}

function unlockCarouselPlayback(swiper: SwiperType | null) {
    if (!swiper) return
    swiper.allowTouchMove = true
}

function emitVideoExclusiveRelease() {
    window.dispatchEvent(new CustomEvent(VIDEO_EXCLUSIVE_RELEASE))
}

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
    sequenceActive: boolean
    requestPlay: boolean
    onPlayStarted: () => void
    onEnded: () => void
    swiperRef: React.MutableRefObject<SwiperType | null>
}

const VideoSlide = ({ src, index, isCenter, sequenceActive, requestPlay, onPlayStarted, onEnded, swiperRef }: VideoSlideProps) => {
    const videoRef = useRef<HTMLVideoElement>(null)
    const [isPlaying, setIsPlaying] = useState(false)
    const slideId = `${index}-${src}`

    // When parent requests play (e.g. after previous video ended), play this video
    useEffect(() => {
        if (!requestPlay || !isCenter) return
        const video = videoRef.current
        if (!video) return
        window.dispatchEvent(new CustomEvent('video-exclusive-play', { detail: { origin: 'reels-carousel' } }))
        window.dispatchEvent(new CustomEvent(EXCLUSIVE_VIDEO_EVENT, { detail: { slideId } }))
        const allVideos = document.querySelectorAll('.swiper-slide video')
        allVideos.forEach((v) => {
            if (v !== video) (v as HTMLVideoElement).pause()
        })
        lockCarouselPlayback(swiperRef.current)
        video.muted = false
        video.currentTime = 0
        video.play().then(() => {
            setIsPlaying(true)
            onPlayStarted()
        }).catch(() => {
            unlockCarouselPlayback(swiperRef.current)
            emitVideoExclusiveRelease()
        })
    }, [requestPlay, isCenter, onPlayStarted, swiperRef])

    const handleClick = () => {
        if (!isCenter) {
            // If a reel is currently playing, clicking another one should bring it to center.
            if (sequenceActive) swiperRef.current?.slideToLoop(index, 2000)
            return
        }
        const video = videoRef.current
        if (!video) return

        if (video.paused) {
            window.dispatchEvent(new CustomEvent('video-exclusive-play', { detail: { origin: 'reels-carousel' } }))
            window.dispatchEvent(new CustomEvent(EXCLUSIVE_VIDEO_EVENT, { detail: { slideId } }))
            const allVideos = document.querySelectorAll('.swiper-slide video')
            allVideos.forEach((v) => {
                if (v !== video) (v as HTMLVideoElement).pause()
            })
            lockCarouselPlayback(swiperRef.current)
            video.muted = false
            video.currentTime = 0
            video.play().then(() => setIsPlaying(true)).catch(() => {
                unlockCarouselPlayback(swiperRef.current)
                emitVideoExclusiveRelease()
            })
        } else {
            video.pause()
            setIsPlaying(false)
            unlockCarouselPlayback(swiperRef.current)
            // User intentionally stopped the reel; move forward and start the next one.
            video.currentTime = 0
            onEnded()
        }
    }

    const handleEnded = () => {
        const video = videoRef.current
        if (!video) return
        setIsPlaying(false)
        video.currentTime = 0
        video.pause()
        unlockCarouselPlayback(swiperRef.current)
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

interface YouTubeSlideProps {
    src: string
    alt: string
    isCenter: boolean
    index: number
    sequenceActive: boolean
    requestPlay: boolean
    onPlayStarted: () => void
    onEnded: () => void
    swiperRef: React.MutableRefObject<SwiperType | null>
}

const YouTubeSlide = ({ src, alt, isCenter, index, sequenceActive, requestPlay, onPlayStarted, onEnded, swiperRef }: YouTubeSlideProps) => {
    const [isPlaying, setIsPlaying] = useState(false)
    const thumbnailSrc = getYouTubeThumbnail(src)
    const slideId = `${index}-${src}`
    const mountRef = useRef<HTMLDivElement | null>(null)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const playerRef = useRef<any>(null)
    const endedHandledRef = useRef(false)
    const videoId = getYouTubeId(src)

    useEffect(() => {
        endedHandledRef.current = false
    }, [slideId])

    useEffect(() => {
        const handler = (e: Event) => {
            const customEvent = e as CustomEvent
            if (customEvent.detail?.closeAll) {
                try {
                    playerRef.current?.stopVideo?.()
                } catch {
                    // ignore
                }
                setIsPlaying(false)
                return
            }
            const incomingSlideId = customEvent.detail?.slideId as string | undefined
            if (!incomingSlideId) return
            if (incomingSlideId !== slideId) setIsPlaying(false)
        }
        window.addEventListener(EXCLUSIVE_VIDEO_EVENT, handler)
        return () => window.removeEventListener(EXCLUSIVE_VIDEO_EVENT, handler)
    }, [slideId])

    useEffect(() => {
        if (!isCenter) {
            setIsPlaying((wasPlaying) => {
                if (wasPlaying) {
                    try {
                        playerRef.current?.pauseVideo?.()
                    } catch {
                        // ignore
                    }
                    unlockCarouselPlayback(swiperRef.current)
                }
                return false
            })
        }
    }, [isCenter, swiperRef])

    // When this YouTube iframe is playing, use the IFrame API to detect "ended"
    // and auto-advance to the next reel.
    useEffect(() => {
        if (!isPlaying || !videoId) return
        if (!mountRef.current) return

        let cancelled = false
        const w = window as any

        ensureYouTubeIframeApiLoaded()
            .then(() => {
                if (cancelled) return
                if (!mountRef.current) return

                endedHandledRef.current = false

                if (!playerRef.current) {
                    playerRef.current = new w.YT.Player(mountRef.current, {
                        videoId,
                        playerVars: {
                            autoplay: 1,
                            playsinline: 1,
                            rel: 0,
                            controls: 0,
                        },
                        events: {
                            onReady: () => {
                                normalizeYouTubeIframe(playerRef.current)
                            },
                            onStateChange: (ev: any) => {
                                const isEnded = ev?.data === w.YT.PlayerState.ENDED
                                if (!isEnded) return
                                if (endedHandledRef.current) return
                                endedHandledRef.current = true

                                setIsPlaying(false)
                                unlockCarouselPlayback(swiperRef.current)
                                onEnded()
                            },
                        },
                    })
                } else {
                    // Reuse existing player instance.
                    try {
                        normalizeYouTubeIframe(playerRef.current)
                        playerRef.current.loadVideoById(videoId)
                        playerRef.current.playVideo()
                    } catch {
                        // ignore
                    }
                }
            })
            .catch(() => {
                // If API fails, we still render the iframe with autoplay=1;
                // but auto-advance on END won't be available.
            })

        return () => {
            cancelled = true
            try {
                playerRef.current?.pauseVideo?.()
            } catch {
                // ignore
            }
        }
    }, [isPlaying, videoId, slideId, onEnded, swiperRef])

    // Auto-start this YouTube reel when the parent requests it (e.g. after previous reel ends,
    // or when the user navigates to the next slide while a reel is playing).
    useEffect(() => {
        if (!requestPlay || !isCenter) return
        setIsPlaying((prev) => {
            if (prev) return prev
            window.dispatchEvent(new CustomEvent(EXCLUSIVE_VIDEO_EVENT, { detail: { slideId } }))
            window.dispatchEvent(new CustomEvent("video-exclusive-play", { detail: { origin: "youtube-slide" } }))
            document.querySelectorAll(".swiper-slide video").forEach((v) => (v as HTMLVideoElement).pause())
            lockCarouselPlayback(swiperRef.current)
            onPlayStarted()
            return true
        })
    }, [requestPlay, isCenter, slideId, onPlayStarted, swiperRef])

    const handleClick = () => {
        if (!isCenter) {
            if (sequenceActive) swiperRef.current?.slideToLoop(index, 2000)
            return
        }
        setIsPlaying((prev) => {
            const next = !prev
            if (next) {
                window.dispatchEvent(new CustomEvent(EXCLUSIVE_VIDEO_EVENT, { detail: { slideId } }))
                window.dispatchEvent(new CustomEvent("video-exclusive-play", { detail: { origin: "youtube-slide" } }))
                document.querySelectorAll(".swiper-slide video").forEach((v) => (v as HTMLVideoElement).pause())
                lockCarouselPlayback(swiperRef.current)
                onPlayStarted()
            } else {
                unlockCarouselPlayback(swiperRef.current)
                onEnded()
            }
            return next
        })
    }

    return (
        <div className="relative w-full h-full group" onClick={handleClick}>
            {/* YouTube IFrame API will create and manage its own iframe inside this mount div. */}
            <div ref={mountRef} className="absolute inset-0" />

            {!isPlaying && (
                <>
                    {thumbnailSrc ? (
                        <img
                            src={thumbnailSrc}
                            className="size-full object-cover rounded-xl pointer-events-none"
                            alt={alt || "YouTube thumbnail"}
                            loading="lazy"
                            decoding="async"
                        />
                    ) : (
                        <div className="size-full rounded-xl bg-black/20 pointer-events-none" />
                    )}

                    {isCenter && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/10 backdrop-blur-[1px] transition-all duration-300 group-hover:bg-black/20 z-20 cursor-pointer">
                            <div className="flex items-center justify-center w-16 h-16 rounded-full bg-black/30 backdrop-blur-md border-2 border-white/30 shadow-xl transition-transform duration-300 group-hover:scale-105 group-active:scale-95">
                                <Play className="w-7 h-7 text-white fill-white ml-0.5" />
                            </div>
                        </div>
                    )}
                </>
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
    // When a reel is actively playing, user slide navigation should auto-start the newly centered reel.
    const [reelsSequenceActive, setReelsSequenceActive] = useState(false)

    const handleVideoEnded = () => {
        const n = images.length
        if (n === 0) return
        const nextIndex = (activeIndex + 1) % n
        setNextShouldPlayIndex(nextIndex)
        swiperRef.current?.slideNext()
    }

    const handlePlayStarted = () => {
        setNextShouldPlayIndex(null)
        setReelsSequenceActive(true)
    }

    useEffect(() => {
        const handleExclusivePlay = (e: Event) => {
            const customEvent = e as CustomEvent
            if (customEvent.detail?.origin !== 'reels-carousel' && customEvent.detail?.origin !== 'youtube-slide') {
                window.dispatchEvent(new CustomEvent(EXCLUSIVE_VIDEO_EVENT, { detail: { closeAll: true } }))
                const allVideos = document.querySelectorAll('.swiper-slide video')
                allVideos.forEach((v) => {
                    (v as HTMLVideoElement).pause()
                })
                unlockCarouselPlayback(swiperRef.current)
                setReelsSequenceActive(false)
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
                        window.dispatchEvent(new CustomEvent(EXCLUSIVE_VIDEO_EVENT, { detail: { closeAll: true } }))
                        unlockCarouselPlayback(swiper ?? null)
                        setReelsSequenceActive(false)
                        emitVideoExclusiveRelease()
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
  .swiper-slide img, .swiper-slide video, .swiper-slide iframe { display: block; width: 100%; }
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
                                onSlideChange={(swiper) => {
                                    const nextRealIndex = swiper.realIndex
                                    setActiveIndex(nextRealIndex)
                                    if (reelsSequenceActive && nextRealIndex !== activeIndex) {
                                        setNextShouldPlayIndex(nextRealIndex)
                                    }
                                }}
                                spaceBetween={50}
                                autoplay={{
                                    delay: 0,
                                    disableOnInteraction: false,
                                    pauseOnMouseEnter: true,
                                }}
                                speed={
                                    !reelsSequenceActive
                                        ? 8000
                                        : nextShouldPlayIndex === null
                                            ? 0
                                            : 2000
                                }
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
                                    const isYouTube = isYouTubeValue(image.src)
                                    const isVideo = isYouTube || /\.(mp4|webm|mov)(\?|$)/i.test(image.src) || image.src.includes('/video') || image.src.includes('content-media');
                                    return (
                                    <SwiperSlide key={`${index}-${image.src}`}>
                                        <div className="group size-full rounded-3xl overflow-hidden aspect-[3/4] relative bg-black/80 border border-border/50 dark:border-white/10 shadow-elevation-1 dark:shadow-elevation-1-dark">
                                            {isVideo ? (
                                                isYouTube ? (
                                                <YouTubeSlide
                                                        src={image.src}
                                                        alt={image.alt}
                                                        isCenter={activeIndex === index}
                                                        index={index}
                                                        sequenceActive={reelsSequenceActive}
                                                        requestPlay={nextShouldPlayIndex === index}
                                                        onPlayStarted={handlePlayStarted}
                                                        onEnded={handleVideoEnded}
                                                        swiperRef={swiperRef}
                                                    />
                                                ) : (
                                                    <VideoSlide
                                                        src={image.src}
                                                        index={index}
                                                        isCenter={activeIndex === index}
                                                        sequenceActive={reelsSequenceActive}
                                                        requestPlay={nextShouldPlayIndex === index}
                                                        onPlayStarted={handlePlayStarted}
                                                        onEnded={handleVideoEnded}
                                                        swiperRef={swiperRef}
                                                    />
                                                )
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
