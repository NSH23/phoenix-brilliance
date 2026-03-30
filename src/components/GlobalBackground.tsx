/** Gold Sparkle Configuration */
const SPARKLE_COUNT = 30;
const SPARKLES = Array.from({ length: SPARKLE_COUNT }).map((_, i) => ({
    id: i,
    left: Math.random() * 100,
    top: Math.random() * 100,
    delay: Math.random() * 5,
    duration: 2 + Math.random() * 2,
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
                    <div
                        key={sparkle.id}
                        className="sparkle absolute w-1 h-1 rounded-full blur-[0.5px] shadow-[0_0_4px_rgba(251,191,36,0.5)]"
                        style={{
                            left: `${sparkle.left}%`,
                            top: `${sparkle.top}%`,
                            backgroundColor: sparkle.color,
                            animationDuration: `${sparkle.duration}s`,
                            animationDelay: `${sparkle.delay}s`,
                            // Used by the CSS keyframes so each sparkle can have its own peak scale.
                            ["--sparkle-peak-scale" as any]: sparkle.scale,
                        }}
                    />
                ))}
            </div>
        </div>
    );
};

export default GlobalBackground;
