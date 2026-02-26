"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { getGalleryImagesForHomepage, type GalleryImage } from "@/services/gallery";

const shuffle = (array: GalleryImage[]) => {
    let currentIndex = array.length,
        randomIndex;

    while (currentIndex != 0) {
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex--;

        [array[currentIndex], array[randomIndex]] = [
            array[randomIndex],
            array[currentIndex],
        ];
    }

    return array;
};

const generateSquares = (data: GalleryImage[]) => {
    return shuffle([...data]).map((sq) => (
        <motion.div
            key={sq.id}
            layout
            transition={{ duration: 1.5, type: "spring" }}
            className="relative z-10 w-full aspect-square rounded-xl overflow-hidden bg-muted border-2 border-white/80 dark:border-white/10 shadow-lg dark:shadow-elevation-1-dark ring-1 ring-black/10 dark:ring-white/10"
            style={{
                backgroundImage: `url(${sq.url})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
            }}
        ></motion.div>
    ));
};

export const ShuffleGrid = () => {
    const [data, setData] = useState<GalleryImage[]>([]);
    const [squares, setSquares] = useState<JSX.Element[]>([]);
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const check = () => setIsMobile(window.innerWidth < 768);
        check();
        window.addEventListener("resize", check);
        return () => window.removeEventListener("resize", check);
    }, []);

    useEffect(() => {
        const loadImages = async () => {
            try {
                const images = await getGalleryImagesForHomepage(12);
                setData(images);
            } catch (error) {
                console.error("Failed to load gallery images", error);
            }
        };
        loadImages();
    }, []);

    useEffect(() => {
        if (data.length === 0) return;

        const update = () => setSquares(generateSquares(data.slice(0, isMobile ? 4 : 12)));
        update();

        const t = setInterval(update, 3000);
        return () => clearInterval(t);
    }, [data, isMobile]);

    return (
        <div
            className={`h-full w-full min-h-0 gap-1.5 p-2 sm:gap-2 sm:p-2.5 rounded-2xl grid relative overflow-hidden
                border-2 border-primary/40 dark:border-white/30
                shadow-2xl shadow-black/15 dark:shadow-elevation-1-dark
                ring-2 ring-primary/15 dark:ring-white/15
                ${isMobile ? "grid-cols-2 grid-rows-2 min-h-[260px]" : "grid-cols-4 grid-rows-3"}`}
        >
            {/* Overlay so container reads clearly; grid cells sit on top with borders */}
            <div className="absolute inset-0 z-0 rounded-2xl bg-white/75 dark:bg-card/80 pointer-events-none" aria-hidden />
            {squares.map((sq) => sq)}
        </div>
    );
};
