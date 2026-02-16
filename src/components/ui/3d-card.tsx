import React, { useState, useEffect } from 'react';

// Component for the individual photo cards
interface PhotoCardProps {
    src: string;
    alt: string;
    rotation: number;
    text: string;
    index: number;
    style?: React.CSSProperties;
}

const PhotoCard = ({ src, alt, rotation, text, index, style = {} }: PhotoCardProps) => {
    const [isLoaded, setIsLoaded] = useState(false);
    const [isHovered, setIsHovered] = useState(false);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        setIsVisible(true);
    }, []);

    const cardStyle: React.CSSProperties = {
        position: 'absolute',
        transform: `rotate(${rotation}deg) ${isHovered ? `rotate(${rotation}deg) scale(1.05)` : `rotate(${rotation}deg) scale(1)`}`,
        zIndex: isHovered ? 20 : (index === 1 ? 2 : 1),
        transition: 'all 0.3s ease-out',
        opacity: isVisible ? 1 : 0,
        ...style
    };

    return (
        <div
            className="w-[180px] h-[260px] md:w-[220px] md:h-[300px] bg-white p-4 rounded-sm shadow-2xl cursor-pointer"
            style={cardStyle}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <div className="w-full h-[85%] bg-muted rounded-sm overflow-hidden">
                <img
                    src={src}
                    alt={alt}
                    className="w-full h-full object-cover transition-transform duration-300"
                    style={{ transform: isHovered ? 'scale(1.02)' : 'scale(1)' }}
                    onLoad={() => setIsLoaded(true)}
                    onError={(e) => {
                        // @ts-ignore
                        e.target.onerror = null;
                        // @ts-ignore
                        e.target.src = 'https://placehold.co/162x200/e2e8f0/94a3b8?text=Image';
                        setIsLoaded(true);
                    }}
                />
            </div>
            <div className="h-[15%] flex items-center justify-center">
                <p className="text-sm text-muted-foreground tracking-tighter text-center font-handwriting">
                    {text}
                </p>
            </div>
        </div>
    );
};

// Animated Gradient Grid Background Component
export const AnimatedGrid = () => {
    const [offset, setOffset] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setOffset(prev => (prev + 0.5) % 40);
        }, 80);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-3xl opacity-50">
            {/* Main grid with gradient fade - Light theme */}
            <div
                className="absolute inset-0 dark:hidden"
                style={{
                    background: `
            radial-gradient(circle at 50% 50%, transparent 0%, #ffffff 50%, #ffffff 100%),
            linear-gradient(#e5e7eb 1px, transparent 1px),
            linear-gradient(90deg, #e5e7eb 1px, transparent 1px)
          `,
                    backgroundSize: 'cover, 40px 40px, 40px 40px',
                    backgroundPosition: `center, ${offset}px ${offset}px, ${offset}px ${offset}px`,
                }}
            />
        </div>
    );
};

export interface ThreeDCardStackProps {
    items: { src: string; alt: string; text: string }[];
}

export const ThreeDCardStack = ({ items }: ThreeDCardStackProps) => {
    // We allow 1 or 2 items.
    const validItems = items.slice(0, 2);
    if (validItems.length === 0) return null;

    const isSingle = validItems.length === 1;

    return (
        <div className="relative w-full h-[350px] flex items-center justify-center group">
            {/* Add Font manually if not in global css */}
            <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Zeyada&display=swap');
        .font-handwriting { font-family: 'Zeyada', cursive; }
      `}</style>

            {/* Animated Background */}
            <AnimatedGrid />

            {/* Photo Cards Container */}
            <div className={`relative flex items-center justify-center z-10 ${isSingle ? 'w-[260px] h-[340px]' : 'w-[240px] h-[300px]'}`}>

                {isSingle ? (
                    /* Single Card - Centered, larger, slight rotation */
                    <PhotoCard
                        src={validItems[0].src}
                        alt={validItems[0].alt}
                        rotation={2}
                        text={validItems[0].text}
                        index={0}
                        style={{ top: '10px' }}
                    />
                ) : (
                    <>
                        {/* Back Photo Card - rotated left (-8deg) */}
                        <PhotoCard
                            src={validItems[0].src}
                            alt={validItems[0].alt}
                            rotation={-8}
                            text={validItems[0].text}
                            index={0}
                            style={{ top: '20px', left: '-20px' }}
                        />

                        {/* Front Photo Card - rotated right (15deg) */}
                        <PhotoCard
                            src={validItems[1].src}
                            alt={validItems[1].alt}
                            rotation={15}
                            text={validItems[1].text}
                            index={1}
                            style={{ top: '10px', right: '-20px' }}
                        />
                    </>
                )}
            </div>
        </div>
    );
}
