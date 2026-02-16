"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform, MotionValue } from "framer-motion";
import { cn } from "@/lib/utils";

interface ScrollHorizontalCurtainProps {
    children: React.ReactNode;
    className?: string;
    reverse?: boolean; // Option to reveal right-to-left if needed
}

export function ScrollHorizontalCurtain({
    children,
    className,
    reverse = false,
}: ScrollHorizontalCurtainProps) {
    const containerRef = useRef<HTMLDivElement>(null);

    // Track scroll progress of the container relative to the viewport
    // "start 80%": when top of container hits 80% of viewport height (entering)
    // "center center": when center of container hits center of viewport (fully revealed)
    // This ensures it finishes opening while still well within view
    const { scrollYProgress } = useScroll({
        target: containerRef,
        offset: ["start 90%", "center 45%"],
    });

    // Map scroll progress (0 to 1) to clip-path percentage (0% to 100%)
    const clipProgress = useTransform(scrollYProgress, [0, 1], [0, 100]);

    return (
        <div ref={containerRef} className={cn("relative overflow-hidden", className)}>
            {/* Background/Hidden Layer (Optional placeholder or just the container background) */}

            {/* Revealed Content Layer */}
            <motion.div
                className="w-full h-full"
                style={{
                    clipPath: useTransform(clipProgress, (value) =>
                        reverse
                            ? `polygon(${100 - value}% 0, 100% 0, 100% 100%, ${100 - value}% 100%)`
                            : `polygon(0 0, ${value}% 0, ${value}% 100%, 0 100%)`
                    ),
                }}
            >
                {children}
            </motion.div>

            {/* Optional: Curtain Line overlay if desired for the leading edge */}
            <motion.div
                className="absolute inset-y-0 w-1 bg-primary/20 pointer-events-none"
                style={{
                    left: useTransform(clipProgress, (value) => `${value}%`),
                    opacity: useTransform(clipProgress, [0, 90, 100], [1, 1, 0]),
                    display: reverse ? "none" : "block",
                }}
            />
        </div>
    );
}
