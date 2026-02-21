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
            className="w-full h-full min-h-[80px] rounded-md overflow-hidden bg-muted shadow-sm"
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
            className={`h-full w-full min-h-0 gap-1.5 p-1.5 sm:gap-2 sm:p-2 bg-background/50 backdrop-blur-sm rounded-xl border border-border/20 grid
                ${isMobile ? "grid-cols-2 grid-rows-2 min-h-[240px]" : "grid-cols-4 grid-rows-3"}`}
        >
            {squares.map((sq) => sq)}
        </div>
    );
};
