import React, { useCallback, useEffect, useRef, useState } from "react"
import useEmblaCarousel from "embla-carousel-react"
import type { EmblaCarouselType } from "embla-carousel"
import { ChevronLeft, ChevronRight, Play } from "lucide-react"
import { getYouTubeId, getYouTubeThumbnail, isYouTubeValue } from "@/lib/youtube"

const EXCLUSIVE_VIDEO_EVENT = "reels-exclusive-play"
/** Fired when a page-level reel/hero handoff is done so another player may resume (e.g. hero after a reel ends). */
const VIDEO_EXCLUSIVE_RELEASE = "video-exclusive-release"

const REELS_VIDEO_SELECTOR = ".embla-reels__slide video"

const EMBLA_REELS_OPTIONS = {
    loop: true,
    align: "center" as const,
    containScroll: false as const,
    duration: 45,
}

let youTubeApiPromise: Promise<void> | null = null

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
        const existing = document.querySelector('script[src="https://www.youtube.com/iframe_api"]') as HTMLScriptElement | null
        if (!existing) {
            const script = document.createElement("script")
            script.src = "https://www.youtube.com/iframe_api"
            script.async = true
            document.body.appendChild(script)
        }
        w.onYouTubeIframeAPIReady = () => resolve()
    })

    return youTubeApiPromise
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
    window.dispatchEvent(new CustomEvent(VIDEO_EXCLUSIVE_RELEASE))
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

    useEffect(() => {
        if (!requestPlay || !isCenter) return
        const video = videoRef.current
        if (!video) return
        window.dispatchEvent(new CustomEvent("video-exclusive-play", { detail: { origin: "reels-carousel" } }))
        window.dispatchEvent(new CustomEvent(EXCLUSIVE_VIDEO_EVENT, { detail: { slideId } }))
        document.querySelectorAll(REELS_VIDEO_SELECTOR).forEach((v) => {
            if (v !== video) (v as HTMLVideoElement).pause()
        })
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
                unlockCarouselPlayback(carouselApiRef.current)
                emitVideoExclusiveRelease()
            })
    }, [requestPlay, isCenter, onPlayStarted, carouselApiRef, slideId])

    const handleClick = () => {
        if (!isCenter) {
            if (sequenceActive) carouselApiRef.current?.scrollTo(index)
            return
        }
        const video = videoRef.current
        if (!video) return

        if (video.paused) {
            window.dispatchEvent(new CustomEvent("video-exclusive-play", { detail: { origin: "reels-carousel" } }))
            window.dispatchEvent(new CustomEvent(EXCLUSIVE_VIDEO_EVENT, { detail: { slideId } }))
            document.querySelectorAll(REELS_VIDEO_SELECTOR).forEach((v) => {
                if (v !== video) (v as HTMLVideoElement).pause()
            })
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
                    unlockCarouselPlayback(carouselApiRef.current)
                    emitVideoExclusiveRelease()
                })
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
                    /* ignore */
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
                        /* ignore */
                    }
                    unlockCarouselPlayback(carouselApiRef.current)
                }
                return false
            })
        }
    }, [isCenter, carouselApiRef])

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
                            modestbranding: 1,
                            controls: 1,
                        },
                        events: {
                            onReady: () => {
                                normalizeYouTubeIframe(playerRef.current)
                            },
                            onStateChange: (ev: any) => {
                                const isEnded = ev?.data === w.YT.PlayerState.ENDED
                                const isPaused = ev?.data === w.YT.PlayerState.PAUSED
                                const isPlayingNow = ev?.data === w.YT.PlayerState.PLAYING
                                if (isPlayingNow) {
                                    setIsPlaying(true)
                                    return
                                }
                                if (isPaused) {
                                    setIsPlaying(false)
                                    unlockCarouselPlayback(carouselApiRef.current)
                                    onPaused()
                                    return
                                }
                                if (!isEnded) return
                                if (endedHandledRef.current) return
                                endedHandledRef.current = true

                                setIsPlaying(false)
                                unlockCarouselPlayback(carouselApiRef.current)
                                onEnded()
                            },
                        },
                    })
                } else {
                    try {
                        normalizeYouTubeIframe(playerRef.current)
                        playerRef.current.loadVideoById(videoId)
                        playerRef.current.playVideo()
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
    }, [isPlaying, videoId, slideId, onEnded, onPaused, carouselApiRef])

    useEffect(() => {
        if (!requestPlay || !isCenter) return
        setIsPlaying((prev) => {
            if (prev) return prev
            window.dispatchEvent(new CustomEvent(EXCLUSIVE_VIDEO_EVENT, { detail: { slideId } }))
            window.dispatchEvent(new CustomEvent("video-exclusive-play", { detail: { origin: "youtube-slide" } }))
            document.querySelectorAll(REELS_VIDEO_SELECTOR).forEach((v) => (v as HTMLVideoElement).pause())
            lockCarouselPlayback(carouselApiRef.current)
            onPlayStarted()
            return true
        })
    }, [requestPlay, isCenter, slideId, onPlayStarted, carouselApiRef])

    const handleClick = () => {
        if (!isCenter) {
            if (sequenceActive) carouselApiRef.current?.scrollTo(index)
            return
        }
        setIsPlaying((prev) => {
            const next = !prev
            if (next) {
                window.dispatchEvent(new CustomEvent(EXCLUSIVE_VIDEO_EVENT, { detail: { slideId } }))
                window.dispatchEvent(new CustomEvent("video-exclusive-play", { detail: { origin: "youtube-slide" } }))
                document.querySelectorAll(REELS_VIDEO_SELECTOR).forEach((v) => (v as HTMLVideoElement).pause())
                lockCarouselPlayback(carouselApiRef.current)
                onPlayStarted()
            } else {
                unlockCarouselPlayback(carouselApiRef.current)
                onPaused()
            }
            return next
        })
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
  .embla-reels { width: 100%; padding-bottom: 24px; }
  .embla-reels.embla-reels--pagination-spaced { padding-bottom: 56px; }
  .embla-reels__viewport { overflow: hidden; width: 100%; }
  .embla-reels__container { display: flex; flex-direction: row; margin-left: -50px; }
  .embla-reels__slide { flex: 0 0 420px; min-width: 0; padding-left: 50px; background-position: center; background-size: cover; }
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

    const startAutoplay = useCallback(() => {
        stopAutoplay()
        if (!emblaApi || reelsSequenceActive || !inViewRef.current) return
        autoplayRef.current = setInterval(() => {
            emblaApi.scrollNext()
        }, Math.max(1200, autoplayDelay))
    }, [autoplayDelay, emblaApi, reelsSequenceActive, stopAutoplay])

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
        stopAutoplay()
        startAutoplay()
        return stopAutoplay
    }, [emblaApi, reelsSequenceActive, startAutoplay, stopAutoplay, images.length])

    const handleVideoEnded = () => {
        const n = images.length
        if (n === 0) return
        const current = carouselApiRef.current?.selectedScrollSnap() ?? activeIndex
        const nextIndex = (current + 1) % n
        setNextShouldPlayIndex(nextIndex)
        carouselApiRef.current?.scrollNext()
    }

    const handleVideoPaused = useCallback(() => {
        setNextShouldPlayIndex(null)
        setReelsSequenceActive(false)
        unlockCarouselPlayback(carouselApiRef.current)
        startAutoplay()
    }, [startAutoplay])

    const handlePlayStarted = () => {
        setNextShouldPlayIndex(null)
        setReelsSequenceActive(true)
    }

    useEffect(() => {
        const handleExclusivePlay = (e: Event) => {
            const customEvent = e as CustomEvent
            if (customEvent.detail?.origin !== "reels-carousel" && customEvent.detail?.origin !== "youtube-slide") {
                window.dispatchEvent(new CustomEvent(EXCLUSIVE_VIDEO_EVENT, { detail: { closeAll: true } }))
                document.querySelectorAll(REELS_VIDEO_SELECTOR).forEach((v) => {
                    ;(v as HTMLVideoElement).pause()
                })
                unlockCarouselPlayback(carouselApiRef.current)
                setReelsSequenceActive(false)
            }
        }
        window.addEventListener("video-exclusive-play", handleExclusivePlay)
        return () => window.removeEventListener("video-exclusive-play", handleExclusivePlay)
    }, [])

    useEffect(() => {
        const el = sectionRef.current
        if (!el) return
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (!entry.isIntersecting) {
                        inViewRef.current = false
                        stopAutoplay()
                        document.querySelectorAll(REELS_VIDEO_SELECTOR).forEach((v) => (v as HTMLVideoElement).pause())
                        window.dispatchEvent(new CustomEvent(EXCLUSIVE_VIDEO_EVENT, { detail: { closeAll: true } }))
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
                className={`mx-auto w-full rounded-2xl border border-border/80 bg-card/75 dark:bg-card/20 backdrop-blur-sm p-4 md:p-6 shadow-[0_10px_28px_rgba(0,0,0,0.08)] dark:shadow-elevation-1-dark ${fullWidth ? "max-w-none" : "max-w-6xl"}`}
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
                                            <div className="embla-reels__slide" key={`${index}-${image.src}`}>
                                                <div className="group size-full rounded-[2rem] overflow-hidden aspect-[3/4] relative bg-black/85 border border-white/15 dark:border-white/20 shadow-[0_18px_40px_rgba(0,0,0,0.22)] ring-1 ring-white/10">
                                                    <div className="pointer-events-none absolute inset-0 z-10 rounded-[2rem] border border-white/20 opacity-70" />
                                                    <div className="pointer-events-none absolute inset-[2px] z-10 rounded-[calc(2rem-2px)] border border-white/10 opacity-80" />
                                                    <div className="pointer-events-none absolute inset-0 z-10 rounded-[2rem] bg-gradient-to-b from-white/12 via-transparent to-black/30" />
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
                                                    <div className="absolute inset-0 z-10 bg-black/8 group-hover:bg-black/0 transition-all duration-300 pointer-events-none" />
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
