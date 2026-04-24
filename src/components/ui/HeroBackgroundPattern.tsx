import { useEffect, useMemo, useState, type CSSProperties } from "react";

const DESKTOP_PARTICLE_COUNT = 15;

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
    const [animationsPaused, setAnimationsPaused] = useState(false);

    const particleCount = useMemo(() => {
        if (typeof window === "undefined") return DESKTOP_PARTICLE_COUNT;
        const isMobile = window.innerWidth < 768;
        const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        if (prefersReduced || isMobile) return 0;
        return DESKTOP_PARTICLE_COUNT;
    }, []);

    useEffect(() => {
        setMounted(true);

        const newParticles = Array.from({ length: particleCount }).map((_, i) => ({
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
    }, [particleCount]);

    useEffect(() => {
        const onVisibility = () => {
            setAnimationsPaused(document.visibilityState !== "visible");
        };
        onVisibility();
        document.addEventListener("visibilitychange", onVisibility);
        return () => document.removeEventListener("visibilitychange", onVisibility);
    }, []);

    if (!mounted) return null;
    if (particleCount === 0) return null;

    return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none select-none z-0">
            {particles.map((particle) => (
                <div
                    key={particle.id}
                    className="absolute rounded-full bg-[#9F1239] dark:bg-foreground opacity-[0.4] dark:opacity-[0.15] animate-hero-particle-drift"
                    style={
                        {
                            left: `${particle.left}%`,
                            top: `${particle.top}%`,
                            width: particle.size,
                            height: particle.size,
                            "--dx": `${particle.xDrift}px`,
                            "--dy": `${particle.yDrift}px`,
                            "--hero-dur": `${particle.duration}s`,
                            animationDelay: `${particle.delay}s`,
                            animationPlayState: animationsPaused ? "paused" : "running",
                        } as CSSProperties
                    }
                />
            ))}
        </div>
    );
}
