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
                                                <video
                                                    src={image.src}
                                                    className="size-full object-cover rounded-xl"
                                                    autoPlay
                                                    loop
                                                    muted
                                                    playsInline
                                                    preload="metadata"
                                                />
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
