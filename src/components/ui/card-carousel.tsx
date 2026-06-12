import React, { useCallback, useEffect, useRef, useState } from "react"
import useEmblaCarousel from "embla-carousel-react"
import type { EmblaCarouselType } from "embla-carousel"
import { ChevronLeft, ChevronRight, Play } from "lucide-react"
import { getYouTubeId, getYouTubeThumbnail, isYouTubeValue, YOUTUBE_NOCOOKIE_HOST } from "@/lib/youtube"
import {
    REELS_EXCLUSIVE_EVENT,
    VIDEO_EXCLUSIVE_PLAY,
    claimVideoPlayback,
    closeAllReelsPlayers,
    ensureYouTubeIframeApiLoaded,
    normalizeYouTubeIframe,
    notifyReelsSlidePlay,
    pauseAllSiteVideosExcept,
    releaseVideoPlayback,
} from "@/lib/videoPlaybackCoordinator"

const EXCLUSIVE_VIDEO_EVENT = REELS_EXCLUSIVE_EVENT

const EMBLA_REELS_OPTIONS = {
    loop: true,
    align: "center" as const,
    containScroll: false as const,
    duration: 65,
    dragFree: false,
}

function lockCarouselPlayback(embla: EmblaCarouselType | null) {
    if (!embla) return
    embla.reInit({ ...EMBLA_REELS_OPTIONS, watchDrag: false })
}

function unlockCarouselPlayback(embla: EmblaCarouselType | null) {
    if (!embla) return
    embla.reInit({ ...EMBLA_REELS_OPTIONS, watchDrag: true })
}

function emitVideoExclusiveRelease() {
    releaseVideoPlayback()
}

interface CarouselProps {
    images: { src: string; alt: string }[]
    autoplayDelay?: number
    showPagination?: boolean
    showNavigation?: boolean
    title?: string
    description?: string
    showHeader?: boolean
    fullWidth?: boolean
    paginationSpaced?: boolean
}

interface VideoSlideProps {
    src: string
    index: number
    isCenter: boolean
    sequenceActive: boolean
    requestPlay: boolean
    onPlayStarted: () => void
    onPaused: () => void
    onEnded: () => void
    carouselApiRef: React.MutableRefObject<EmblaCarouselType | null>
}

const VideoSlide = ({ src, index, isCenter, sequenceActive, requestPlay, onPlayStarted, onPaused, onEnded, carouselApiRef }: VideoSlideProps) => {
    const videoRef = useRef<HTMLVideoElement>(null)
    const [isPlaying, setIsPlaying] = useState(false)
    const slideId = `${index}-${src}`
    const suppressPauseCallbackRef = useRef(false)

    const beginPlayback = useCallback(() => {
        const video = videoRef.current
        if (!video) return
        claimVideoPlayback("reels-carousel", { slideId })
        notifyReelsSlidePlay(slideId)
        pauseAllSiteVideosExcept(video)
        closeAllReelsPlayers(slideId)
        lockCarouselPlayback(carouselApiRef.current)
        video.muted = false
        video.currentTime = 0
        video
            .play()
            .then(() => {
                setIsPlaying(true)
                onPlayStarted()
            })
            .catch(() => {
                video.muted = true
                video
                    .play()
                    .then(() => {
                        setIsPlaying(true)
                        onPlayStarted()
                    })
                    .catch(() => {
                        unlockCarouselPlayback(carouselApiRef.current)
                        emitVideoExclusiveRelease()
                    })
            })
    }, [carouselApiRef, onPlayStarted, slideId])

    useEffect(() => {
        const onExclusive = (e: Event) => {
            const origin = (e as CustomEvent).detail?.origin as string | undefined
            if (origin === "reels-carousel") return
            videoRef.current?.pause()
            setIsPlaying(false)
        }
        const onReelsEvent = (e: Event) => {
            const detail = (e as CustomEvent).detail as { closeAll?: boolean; exceptSlideId?: string; slideId?: string }
            if (detail?.exceptSlideId === slideId) return
            if (detail?.slideId === slideId) return
            videoRef.current?.pause()
            setIsPlaying(false)
        }
        window.addEventListener(VIDEO_EXCLUSIVE_PLAY, onExclusive)
        window.addEventListener(EXCLUSIVE_VIDEO_EVENT, onReelsEvent)
        return () => {
            window.removeEventListener(VIDEO_EXCLUSIVE_PLAY, onExclusive)
            window.removeEventListener(EXCLUSIVE_VIDEO_EVENT, onReelsEvent)
        }
    }, [slideId])

    useEffect(() => {
        if (!isCenter) {
            videoRef.current?.pause()
            setIsPlaying(false)
        }
    }, [isCenter])

    useEffect(() => {
        if (!requestPlay || !isCenter) return
        beginPlayback()
    }, [requestPlay, isCenter, beginPlayback])

    const handleClick = () => {
        if (!isCenter) {
            if (sequenceActive) carouselApiRef.current?.scrollTo(index)
            return
        }
        const video = videoRef.current
        if (!video) return

        if (video.paused) {
            beginPlayback()
        } else {
            suppressPauseCallbackRef.current = true
            video.pause()
            setIsPlaying(false)
            unlockCarouselPlayback(carouselApiRef.current)
            onPaused()
        }
    }

    const handleEnded = () => {
        const video = videoRef.current
        if (!video) return
        setIsPlaying(false)
        video.currentTime = 0
        suppressPauseCallbackRef.current = true
        video.pause()
        unlockCarouselPlayback(carouselApiRef.current)
        releaseVideoPlayback()
        onEnded()
    }

    useEffect(() => {
        const v = videoRef.current
        if (!v) return
        const onPause = () => {
            setIsPlaying(false)
            unlockCarouselPlayback(carouselApiRef.current)
            if (suppressPauseCallbackRef.current) {
                suppressPauseCallbackRef.current = false
                return
            }
            onPaused()
        }
        const onPlay = () => {
            setIsPlaying(true)
            onPlayStarted()
        }
        v.addEventListener("pause", onPause)
        v.addEventListener("play", onPlay)
        return () => {
            v.removeEventListener("pause", onPause)
            v.removeEventListener("play", onPlay)
        }
    }, [carouselApiRef, onPaused, onPlayStarted])

    return (
        <div className="relative w-full h-full group" onClick={handleClick}>
            <video
                ref={videoRef}
                data-site-video
                src={src}
                className="size-full object-cover rounded-xl pointer-events-none"
                loop={false}
                muted
                playsInline
                preload="metadata"
                onEnded={handleEnded}
            />
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
    onPaused: () => void
    onEnded: () => void
    carouselApiRef: React.MutableRefObject<EmblaCarouselType | null>
}

const YouTubeSlide = ({
    src,
    alt,
    isCenter,
    index,
    sequenceActive,
    requestPlay,
    onPlayStarted,
    onPaused,
    onEnded,
    carouselApiRef,
}: YouTubeSlideProps) => {
    const [isPlaying, setIsPlaying] = useState(false)
    const thumbnailSrc = getYouTubeThumbnail(src)
    const slideId = `${index}-${src}`
    const mountRef = useRef<HTMLDivElement | null>(null)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const playerRef = useRef<any>(null)
    const endedHandledRef = useRef(false)
    const startSideEffectsDoneRef = useRef(false)
    const wantsAudioRef = useRef(false)
    const suppressPauseRef = useRef(true)
    const onPlayStartedRef = useRef(onPlayStarted)
    const onPausedRef = useRef(onPaused)
    const onEndedRef = useRef(onEnded)
    const videoId = getYouTubeId(src)

    useEffect(() => {
        onPlayStartedRef.current = onPlayStarted
    }, [onPlayStarted])

    useEffect(() => {
        onPausedRef.current = onPaused
    }, [onPaused])

    useEffect(() => {
        onEndedRef.current = onEnded
    }, [onEnded])

    useEffect(() => {
        endedHandledRef.current = false
    }, [slideId])

    useEffect(() => {
        const handler = (e: Event) => {
            const customEvent = e as CustomEvent
            const detail = customEvent.detail as {
                closeAll?: boolean
                exceptSlideId?: string
                slideId?: string
            }
            if (detail?.exceptSlideId === slideId) return
            if (detail?.closeAll) {
                try {
                    playerRef.current?.stopVideo?.()
                } catch {
                    /* ignore */
                }
                setIsPlaying(false)
                startSideEffectsDoneRef.current = false
                return
            }
            const incomingSlideId = detail?.slideId
            if (!incomingSlideId || incomingSlideId === slideId) return
            try {
                playerRef.current?.pauseVideo?.()
            } catch {
                /* ignore */
            }
            setIsPlaying(false)
            startSideEffectsDoneRef.current = false
        }
        window.addEventListener(EXCLUSIVE_VIDEO_EVENT, handler)
        return () => window.removeEventListener(EXCLUSIVE_VIDEO_EVENT, handler)
    }, [slideId])

    useEffect(() => {
        const onExclusive = (e: Event) => {
            const origin = (e as CustomEvent).detail?.origin as string | undefined
            if (origin === "youtube-slide" || origin === "reels-carousel") return
            try {
                playerRef.current?.pauseVideo?.()
            } catch {
                /* ignore */
            }
            setIsPlaying(false)
            startSideEffectsDoneRef.current = false
        }
        window.addEventListener(VIDEO_EXCLUSIVE_PLAY, onExclusive)
        return () => window.removeEventListener(VIDEO_EXCLUSIVE_PLAY, onExclusive)
    }, [])

    useEffect(() => {
        if (isCenter) return
        startSideEffectsDoneRef.current = false
        setIsPlaying(false)
        try {
            playerRef.current?.pauseVideo?.()
        } catch {
            /* ignore */
        }
        unlockCarouselPlayback(carouselApiRef.current)
    }, [isCenter, carouselApiRef])

    useEffect(() => {
        if (!requestPlay || !isCenter) return
        wantsAudioRef.current = true
        suppressPauseRef.current = true
        setIsPlaying(true)
    }, [requestPlay, isCenter, slideId])

    // Side effects when playback starts — never inside setState updaters.
    useEffect(() => {
        if (!isPlaying || !isCenter) {
            startSideEffectsDoneRef.current = false
            return
        }
        if (startSideEffectsDoneRef.current) return
        startSideEffectsDoneRef.current = true

        claimVideoPlayback("youtube-slide", { slideId })
        notifyReelsSlidePlay(slideId)
        pauseAllSiteVideosExcept()
        closeAllReelsPlayers(slideId)
        lockCarouselPlayback(carouselApiRef.current)
        onPlayStartedRef.current()
    }, [isPlaying, isCenter, slideId, carouselApiRef])

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
                        host: YOUTUBE_NOCOOKIE_HOST,
                        videoId,
                        playerVars: {
                            autoplay: 1,
                            mute: 1,
                            playsinline: 1,
                            rel: 0,
                            modestbranding: 1,
                            controls: 1,
                            enablejsapi: 1,
                        },
                        events: {
                            onReady: () => {
                                normalizeYouTubeIframe(playerRef.current)
                                if (wantsAudioRef.current) {
                                    try {
                                        playerRef.current?.unMute?.()
                                    } catch {
                                        /* ignore */
                                    }
                                }
                            },
                            onStateChange: (ev: any) => {
                                const isEnded = ev?.data === w.YT.PlayerState.ENDED
                                const isPaused = ev?.data === w.YT.PlayerState.PAUSED
                                const isPlayingNow = ev?.data === w.YT.PlayerState.PLAYING
                                if (isPlayingNow) {
                                    suppressPauseRef.current = false
                                    setIsPlaying(true)
                                    if (wantsAudioRef.current) {
                                        try {
                                            playerRef.current?.unMute?.()
                                        } catch {
                                            /* ignore */
                                        }
                                    }
                                    return
                                }
                                if (isPaused) {
                                    if (suppressPauseRef.current) return
                                    setIsPlaying(false)
                                    unlockCarouselPlayback(carouselApiRef.current)
                                    onPausedRef.current()
                                    return
                                }
                                if (!isEnded) return
                                if (endedHandledRef.current) return
                                endedHandledRef.current = true

                                setIsPlaying(false)
                                unlockCarouselPlayback(carouselApiRef.current)
                                releaseVideoPlayback()
                                onEndedRef.current()
                            },
                        },
                    })
                } else {
                    try {
                        normalizeYouTubeIframe(playerRef.current)
                        suppressPauseRef.current = true
                        playerRef.current.loadVideoById(videoId)
                        playerRef.current.playVideo()
                        if (wantsAudioRef.current) {
                            playerRef.current.unMute?.()
                        }
                    } catch {
                        /* ignore */
                    }
                }
            })
            .catch(() => {})

        return () => {
            cancelled = true
            try {
                playerRef.current?.pauseVideo?.()
            } catch {
                /* ignore */
            }
        }
    }, [isPlaying, videoId, slideId, carouselApiRef])

    const handleClick = () => {
        if (!isCenter) {
            if (sequenceActive) carouselApiRef.current?.scrollTo(index)
            return
        }
        if (isPlaying) {
            suppressPauseRef.current = true
            setIsPlaying(false)
            try {
                playerRef.current?.pauseVideo?.()
            } catch {
                /* ignore */
            }
            unlockCarouselPlayback(carouselApiRef.current)
            onPausedRef.current()
            return
        }
        wantsAudioRef.current = true
        suppressPauseRef.current = true
        setIsPlaying(true)
    }

    return (
        <div className="relative w-full h-full group" onClick={handleClick}>
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

const CAROUSEL_CSS = `
  .embla-reels { width: 100%; padding-bottom: 8px; }
  .embla-reels.embla-reels--pagination-spaced { padding-bottom: 40px; }
  .embla-reels__viewport { overflow: hidden; width: 100%; }
  .embla-reels__container { display: flex; flex-direction: row; margin-left: -50px; }
  .embla-reels__slide {
    flex: 0 0 420px;
    min-width: 0;
    padding-left: 50px;
    background-position: center;
    background-size: cover;
  }
  .embla-reels__slide .embla-reels__frame {
    transition: transform 0.55s cubic-bezier(0.22, 1, 0.36, 1);
    transform: scale(0.94);
    will-change: transform;
  }
  .embla-reels__slide.is-active .embla-reels__frame {
    transform: scale(1);
  }
  @media (max-width: 768px) {
    .embla-reels__slide { flex-basis: 340px; }
  }
  .embla-reels__slide img, .embla-reels__slide video, .embla-reels__slide iframe { display: block; width: 100%; }
  `

export const CardCarousel: React.FC<CarouselProps> = ({
    images,
    autoplayDelay = 8000,
    showPagination = true,
    showNavigation = true,
    title = "Card Carousel",
    description = "Seamless Images carousel animation.",
    showHeader = true,
    fullWidth = false,
    paginationSpaced = false,
}) => {
    const carouselApiRef = useRef<EmblaCarouselType | null>(null)
    const [emblaRef, emblaApi] = useEmblaCarousel(EMBLA_REELS_OPTIONS)
    const [activeIndex, setActiveIndex] = useState(0)
    const [nextShouldPlayIndex, setNextShouldPlayIndex] = useState<number | null>(null)
    const [reelsSequenceActive, setReelsSequenceActive] = useState(false)
    const reelsSequenceActiveRef = useRef(false)
    const autoplayRef = useRef<ReturnType<typeof setInterval> | null>(null)
    const sectionRef = useRef<HTMLElement | null>(null)
    const hoverPausedRef = useRef(false)
    const inViewRef = useRef(true)

    useEffect(() => {
        carouselApiRef.current = emblaApi
    }, [emblaApi])

    const stopAutoplay = useCallback(() => {
        if (autoplayRef.current) {
            clearInterval(autoplayRef.current)
            autoplayRef.current = null
        }
    }, [])

    useEffect(() => {
        reelsSequenceActiveRef.current = reelsSequenceActive
    }, [reelsSequenceActive])

    const startAutoplay = useCallback(() => {
        stopAutoplay()
        if (!emblaApi || !inViewRef.current) return
        unlockCarouselPlayback(emblaApi)
        autoplayRef.current = setInterval(() => {
            if (hoverPausedRef.current || reelsSequenceActiveRef.current) return
            emblaApi.scrollNext()
        }, Math.max(3500, autoplayDelay))
    }, [autoplayDelay, emblaApi, stopAutoplay])

    useEffect(() => {
        if (!emblaApi) return
        const onSelect = () => {
            const i = emblaApi.selectedScrollSnap()
            setActiveIndex(i)
            if (reelsSequenceActive) setNextShouldPlayIndex(i)
        }
        emblaApi.on("select", onSelect)
        onSelect()
        return () => {
            emblaApi.off("select", onSelect)
        }
    }, [emblaApi, reelsSequenceActive])

    useEffect(() => {
        if (reelsSequenceActive) {
            stopAutoplay()
            return stopAutoplay
        }
        startAutoplay()
        return stopAutoplay
    }, [emblaApi, reelsSequenceActive, startAutoplay, stopAutoplay, images.length])

    const handleVideoEnded = useCallback(() => {
        const n = images.length
        if (n === 0) return
        const current = carouselApiRef.current?.selectedScrollSnap() ?? activeIndex
        const nextIndex = (current + 1) % n
        reelsSequenceActiveRef.current = true
        setReelsSequenceActive(true)
        stopAutoplay()
        carouselApiRef.current?.scrollNext()
        window.setTimeout(() => {
            setNextShouldPlayIndex(nextIndex)
        }, 280)
    }, [activeIndex, images.length, stopAutoplay])

    const handleVideoPaused = useCallback(() => {
        setNextShouldPlayIndex(null)
        reelsSequenceActiveRef.current = false
        setReelsSequenceActive(false)
        unlockCarouselPlayback(carouselApiRef.current)
        releaseVideoPlayback()
        startAutoplay()
    }, [startAutoplay])

    const handlePlayStarted = () => {
        setNextShouldPlayIndex(null)
        reelsSequenceActiveRef.current = true
        setReelsSequenceActive(true)
        stopAutoplay()
    }

    useEffect(() => {
        const handleExclusivePlay = (e: Event) => {
            const customEvent = e as CustomEvent
            const origin = customEvent.detail?.origin as string | undefined
            if (origin !== "reels-carousel" && origin !== "youtube-slide") {
                closeAllReelsPlayers()
                pauseAllSiteVideosExcept()
                unlockCarouselPlayback(carouselApiRef.current)
                reelsSequenceActiveRef.current = false
                setReelsSequenceActive(false)
                setNextShouldPlayIndex(null)
                startAutoplay()
            }
        }
        window.addEventListener(VIDEO_EXCLUSIVE_PLAY, handleExclusivePlay)
        return () => window.removeEventListener(VIDEO_EXCLUSIVE_PLAY, handleExclusivePlay)
    }, [startAutoplay])

    useEffect(() => {
        const el = sectionRef.current
        if (!el) return
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (!entry.isIntersecting) {
                        inViewRef.current = false
                        stopAutoplay()
                        pauseAllSiteVideosExcept()
                        closeAllReelsPlayers()
                        unlockCarouselPlayback(carouselApiRef.current)
                        setReelsSequenceActive(false)
                        emitVideoExclusiveRelease()
                    } else {
                        inViewRef.current = true
                        startAutoplay()
                    }
                })
            },
            { threshold: 0.1 }
        )
        observer.observe(el)
        return () => observer.disconnect()
    }, [startAutoplay, stopAutoplay])

    const onViewportMouseEnter = () => {
        hoverPausedRef.current = true
    }

    const onViewportMouseLeave = () => {
        hoverPausedRef.current = false
    }

    const scrollSnaps = emblaApi?.scrollSnapList() ?? []

    const css = CAROUSEL_CSS

    return (
        <section ref={sectionRef} className="w-full space-y-2">
            <style>{css}</style>
            <div
                className={
                    fullWidth
                        ? "mx-auto w-full max-w-none py-1"
                        : "mx-auto w-full max-w-6xl rounded-2xl border border-border/80 bg-card/75 p-4 shadow-[0_10px_28px_rgba(0,0,0,0.08)] backdrop-blur-sm dark:bg-card/20 dark:shadow-elevation-1-dark md:p-6"
                }
            >
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
                    <div className="relative flex w-full items-center justify-center gap-4">
                        {showNavigation && (
                            <button
                                type="button"
                                aria-label="Previous slide"
                                className="absolute left-0 z-10 hidden md:flex h-10 w-10 items-center justify-center rounded-full border border-border/60 bg-card/80 text-foreground shadow-sm hover:bg-card"
                                onClick={() => emblaApi?.scrollPrev()}
                            >
                                <ChevronLeft className="h-5 w-5" />
                            </button>
                        )}
                        <div className={`embla-reels w-full ${paginationSpaced ? "embla-reels--pagination-spaced" : ""}`}>
                            <div
                                className="embla-reels__viewport"
                                ref={emblaRef}
                                onMouseEnter={onViewportMouseEnter}
                                onMouseLeave={onViewportMouseLeave}
                            >
                                <div className="embla-reels__container">
                                    {images.map((image, index) => {
                                        const isYouTube = isYouTubeValue(image.src)
                                        const isVideo =
                                            isYouTube ||
                                            /\.(mp4|webm|mov)(\?|$)/i.test(image.src) ||
                                            image.src.includes("/video") ||
                                            image.src.includes("content-media")
                                        return (
                                            <div
                                                className={`embla-reels__slide${activeIndex === index ? " is-active" : ""}`}
                                                key={`${index}-${image.src}`}
                                            >
                                                <div className="embla-reels__frame group size-full rounded-[2rem] overflow-hidden aspect-[3/4] relative border border-border/40 bg-black shadow-[0_16px_36px_rgba(0,0,0,0.18)] dark:border-white/15">
                                                    <div className="pointer-events-none absolute inset-0 z-10 rounded-[2rem] bg-gradient-to-b from-black/10 via-transparent to-black/35" />
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
                                                                onPaused={handleVideoPaused}
                                                                onEnded={handleVideoEnded}
                                                                carouselApiRef={carouselApiRef}
                                                            />
                                                        ) : (
                                                            <VideoSlide
                                                                src={image.src}
                                                                index={index}
                                                                isCenter={activeIndex === index}
                                                                sequenceActive={reelsSequenceActive}
                                                                requestPlay={nextShouldPlayIndex === index}
                                                                onPlayStarted={handlePlayStarted}
                                                                onPaused={handleVideoPaused}
                                                                onEnded={handleVideoEnded}
                                                                carouselApiRef={carouselApiRef}
                                                            />
                                                        )
                                                    ) : (
                                                        <img
                                                            src={image.src}
                                                            className="size-full object-cover rounded-xl"
                                                            alt={image.alt}
                                                            loading="lazy"
                                                            decoding="async"
                                                        />
                                                    )}
                                                    <div className="pointer-events-none absolute inset-0 z-10 bg-black/5 transition-all duration-300 group-hover:bg-black/0" />
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>
                        </div>
                        {showNavigation && (
                            <button
                                type="button"
                                aria-label="Next slide"
                                className="absolute right-0 z-10 hidden md:flex h-10 w-10 items-center justify-center rounded-full border border-border/60 bg-card/80 text-foreground shadow-sm hover:bg-card"
                                onClick={() => emblaApi?.scrollNext()}
                            >
                                <ChevronRight className="h-5 w-5" />
                            </button>
                        )}
                    </div>
                    {showPagination && scrollSnaps.length > 0 && (
                        <div className="flex justify-center gap-2 pt-1">
                            {scrollSnaps.map((_, i) => (
                                <button
                                    key={i}
                                    type="button"
                                    className={`h-2 rounded-full transition-all ${i === activeIndex ? "w-6 bg-primary" : "w-2 bg-primary/30"}`}
                                    aria-label={`Go to slide ${i + 1}`}
                                    onClick={() => emblaApi?.scrollTo(i)}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </section>
    )
}
