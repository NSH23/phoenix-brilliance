"use client";

import { motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { getAllGalleryImages, type GalleryImage } from "@/services/gallery";

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
            className="w-full h-full rounded-md overflow-hidden bg-muted shadow-sm"
            style={{
                backgroundImage: `url(${sq.url})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
            }}
        ></motion.div>
    ));
};

export const ShuffleGrid = () => {
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);
    const [data, setData] = useState<GalleryImage[]>([]);
    const [squares, setSquares] = useState<JSX.Element[]>([]);

    useEffect(() => {
        const loadImages = async () => {
            try {
                const images = await getAllGalleryImages();
                // Take the first 12 images or all if less than 12, or strictly 12 as requested?
                // The constraint is on upload, so we just take what is there.
                // If there are less than 12, the grid might look empty? The grid is 4x3 = 12 cells.
                // If less than 12, we might simply repeat them or show blank.
                // For now, let's just use what we have.
                setData(images.slice(0, 12));
                setSquares(generateSquares(images.slice(0, 12)));
            } catch (error) {
                console.error("Failed to load gallery images", error);
            }
        };
        loadImages();
    }, []);

    useEffect(() => {
        if (data.length === 0) return;

        const shuffleSquares = () => {
            setSquares(generateSquares(data));
            timeoutRef.current = setTimeout(shuffleSquares, 3000);
        };

        shuffleSquares();

        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, [data]);

    return (
        <div className="grid grid-cols-4 grid-rows-3 h-full gap-1.5 p-1.5 bg-background/50 backdrop-blur-sm rounded-xl border border-border/20">
            {squares.map((sq) => sq)}
        </div>
    );
};
