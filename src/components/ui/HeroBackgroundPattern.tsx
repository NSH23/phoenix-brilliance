import { motion } from "framer-motion";
import { useEffect, useState } from "react";

// Number of particles to generate
const PARTICLE_COUNT = 60;

interface Particle {
    id: number;
    left: number;
    top: number;
    size: number;
    duration: number;
    delay: number;
    xDrift: number;
    yDrift: number;
}

export function HeroBackgroundPattern() {
    const [mounted, setMounted] = useState(false);
    const [particles, setParticles] = useState<Particle[]>([]);

    useEffect(() => {
        setMounted(true);

        // Generate random particles only on client to avoid hydration mismatch
        const newParticles = Array.from({ length: PARTICLE_COUNT }).map((_, i) => ({
            id: i,
            left: Math.random() * 100, // 0-100% width
            top: Math.random() * 100,  // 0-100% height
            size: Math.random() * 6 + 3, // 3px to 9px size (Much larger for visibility)
            duration: Math.random() * 20 + 10, // 10s - 30s float duration
            delay: Math.random() * 5, // 0-5s start delay
            xDrift: (Math.random() - 0.5) * 120, // Horizontal drift
            yDrift: (Math.random() - 0.5) * 150 - 30, // Mostly upward float
        }));

        setParticles(newParticles);
    }, []);

    if (!mounted) return null;

    return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none select-none z-0">
            {particles.map((particle) => (
                <motion.div
                    key={particle.id}
                    // Light Theme: Deep Rose Wine (#9F1239) with 40% opacity - elegant & visible
                    // Dark Theme: White/Foreground with 15% opacity (unchanged)
                    className="absolute rounded-full bg-[#9F1239] dark:bg-foreground opacity-[0.4] dark:opacity-[0.15]"
                    style={{
                        left: `${particle.left}%`,
                        top: `${particle.top}%`,
                        width: particle.size,
                        height: particle.size,
                    }}
                    animate={{
                        y: [0, particle.yDrift],
                        x: [0, particle.xDrift],
                        opacity: [0.05, 0.15, 0.05], // Breathing opacity
                        scale: [1, 1.5, 0.8, 1], // Breathing size
                    }}
                    transition={{
                        duration: particle.duration,
                        repeat: Infinity,
                        ease: "easeInOut",
                        delay: particle.delay,
                        repeatType: "reverse", // Makes it float back and forth elegantly
                    }}
                />
            ))}
        </div>
    );
}
