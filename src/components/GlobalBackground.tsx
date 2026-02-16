import { motion } from "framer-motion";

/** Sakura Petal Configuration */
const PETAL_COUNT = 40;
const PETALS = Array.from({ length: PETAL_COUNT }).map((_, i) => ({
    id: i,
    left: Math.random() * 100,
    delay: Math.random() * 10,
    duration: 10 + Math.random() * 10,
    size: 10 + Math.random() * 15,
    rotation: Math.random() * 360,
    sway: (Math.random() - 0.5) * 50,
}));

/** Gold Sparkle Configuration */
const SPARKLE_COUNT = 30;
const SPARKLES = Array.from({ length: SPARKLE_COUNT }).map((_, i) => ({
    id: i,
    left: Math.random() * 100,
    top: Math.random() * 100,
    delay: Math.random() * 5,
    scale: 0.5 + Math.random() * 0.5,
    color: Math.random() > 0.5 ? "#fbbf24" : "#f59e0b", // Amber-400 or Amber-500
}));

const GlobalBackground = () => {
    return (
        <div className="fixed inset-0 z-[-1] overflow-hidden pointer-events-none bg-transparent">
            {/* 1. Gradient Mesh Background - REMOVED per user request (whitish blur) */}

            {/* 2. Sakura Particles - REMOVED per user request */}

            {/* 3. Gold Sparkle Particles */}
            <div className="absolute inset-0">
                {SPARKLES.map((sparkle) => (
                    <motion.div
                        key={sparkle.id}
                        initial={{ opacity: 0, scale: 0 }}
                        animate={{ opacity: [0, 1, 0], scale: [0, sparkle.scale, 0] }}
                        transition={{
                            duration: 2 + Math.random() * 2,
                            repeat: Infinity,
                            delay: sparkle.delay,
                            ease: "easeInOut",
                        }}
                        style={{
                            left: `${sparkle.left}%`,
                            top: `${sparkle.top}%`,
                            backgroundColor: sparkle.color
                        }}
                        className="absolute w-1 h-1 rounded-full blur-[0.5px] shadow-[0_0_4px_rgba(251,191,36,0.5)]"
                    />
                ))}
            </div>
        </div>
    );
};

export default GlobalBackground;
