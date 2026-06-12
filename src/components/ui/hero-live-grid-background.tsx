import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import {
  getActivePublicTheme,
  subscribePublicTheme,
  type PublicTheme,
} from "@/lib/publicTheme";

/**
 * Animated wavy grid with traveling light pulses — adapted from 21st.dev
 * minhxthanh/grid-hero-animated (background layer only).
 */
type LightParticle = {
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  speed: number;
  brightness: number;
  gridLine: "horizontal" | "vertical";
  progress: number;
};

type GridPalette = {
  grid: string;
  core: (a: number) => string;
  mid: (a: number) => string;
  outer: string;
  dot: (a: number) => string;
};

const PALETTES: Record<PublicTheme, GridPalette> = {
  light: {
    grid: "#D4C9BE",
    core: (a) => `rgba(122, 68, 82, ${a})`,
    mid: (a) => `rgba(122, 68, 82, ${a * 0.45})`,
    outer: "rgba(122, 68, 82, 0)",
    dot: (a) => `rgba(90, 55, 65, ${a})`,
  },
  blush: {
    grid: "#E8D0DC",
    core: (a) => `rgba(192, 38, 122, ${a})`,
    mid: (a) => `rgba(217, 70, 160, ${a * 0.45})`,
    outer: "rgba(192, 38, 122, 0)",
    dot: (a) => `rgba(192, 38, 122, ${a})`,
  },
  dark: {
    grid: "#1E2A42",
    core: (a) => `rgba(232, 175, 193, ${a})`,
    mid: (a) => `rgba(180, 140, 200, ${a * 0.4})`,
    outer: "rgba(100, 80, 140, 0)",
    dot: (a) => `rgba(248, 220, 230, ${a})`,
  },
};

type HeroLiveGridBackgroundProps = {
  className?: string;
  /** When false, renders one static grid frame (no traveling lights or animation loop). */
  animated?: boolean;
};

export function HeroLiveGridBackground({ className, animated = false }: HeroLiveGridBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const lightsRef = useRef<LightParticle[]>([]);
  const themeRef = useRef<PublicTheme>("light");
  const reducedMotionRef = useRef(false);
  const visibleRef = useRef(true);
  const [theme, setTheme] = useState<PublicTheme>("light");

  useEffect(() => {
    setTheme(getActivePublicTheme());
    return subscribePublicTheme(setTheme);
  }, []);

  useEffect(() => {
    themeRef.current = theme;
  }, [theme]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    reducedMotionRef.current = motionQuery.matches;
    const onMotionChange = () => {
      reducedMotionRef.current = motionQuery.matches;
    };
    motionQuery.addEventListener("change", onMotionChange);

    const onVisibility = () => {
      visibleRef.current = document.visibilityState === "visible";
    };
    document.addEventListener("visibilitychange", onVisibility);

    let lastTime = 0;
    const gridSize = 44;

    const resizeCanvas = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const palette = () => PALETTES[themeRef.current];

    const createLight = () => {
      const width = canvas.clientWidth;
      const height = canvas.clientHeight;
      const isHorizontal = Math.random() > 0.5;

      if (isHorizontal) {
        const y = Math.floor(Math.random() * (height / gridSize)) * gridSize;
        return {
          x: 0,
          y,
          targetX: width,
          targetY: y,
          speed: 0.35 + Math.random() * 0.9,
          brightness: 0.55 + Math.random() * 0.35,
          gridLine: "horizontal" as const,
          progress: 0,
        };
      }

      const x = Math.floor(Math.random() * (width / gridSize)) * gridSize;
      return {
        x,
        y: 0,
        targetX: x,
        targetY: height,
        speed: 0.35 + Math.random() * 0.9,
        brightness: 0.55 + Math.random() * 0.35,
        gridLine: "vertical" as const,
        progress: 0,
      };
    };

    const drawGrid = () => {
      const width = canvas.clientWidth;
      const height = canvas.clientHeight;
      const colors = palette();

      ctx.clearRect(0, 0, width, height);
      ctx.strokeStyle = colors.grid;
      ctx.lineWidth = 1;
      ctx.globalAlpha = themeRef.current === "dark" ? 0.85 : 0.55;

      const centerX = width / 2;
      const centerY = height / 2;

      for (let x = -gridSize; x < width + gridSize; x += gridSize) {
        ctx.beginPath();
        for (let y = 0; y <= height; y += 2) {
          const distanceFromCenter = Math.hypot(x - centerX, y - centerY);
          const wave = Math.sin(distanceFromCenter * 0.018) * 14;
          const perspective = 1 - distanceFromCenter / (width * 0.85);
          const adjustedX = x + wave * Math.max(0, perspective);
          if (y === 0) ctx.moveTo(adjustedX, y);
          else ctx.lineTo(adjustedX, y);
        }
        ctx.stroke();
      }

      for (let y = -gridSize; y < height + gridSize; y += gridSize) {
        ctx.beginPath();
        for (let x = 0; x <= width; x += 2) {
          const distanceFromCenter = Math.hypot(x - centerX, y - centerY);
          const wave = Math.sin(distanceFromCenter * 0.018) * 14;
          const perspective = 1 - distanceFromCenter / (height * 0.85);
          const adjustedY = y + wave * Math.max(0, perspective);
          if (x === 0) ctx.moveTo(x, adjustedY);
          else ctx.lineTo(x, adjustedY);
        }
        ctx.stroke();
      }

      ctx.globalAlpha = 1;
    };

    const drawLights = () => {
      const width = canvas.clientWidth;
      const height = canvas.clientHeight;
      const centerX = width / 2;
      const centerY = height / 2;
      const colors = palette();

      lightsRef.current.forEach((light) => {
        const distanceFromCenter = Math.hypot(light.x - centerX, light.y - centerY);
        const wave = Math.sin(distanceFromCenter * 0.018) * 14;

        let adjustedX = light.x;
        let adjustedY = light.y;

        if (light.gridLine === "vertical") {
          const perspective = 1 - distanceFromCenter / (width * 0.85);
          adjustedX = light.x + wave * Math.max(0, perspective);
        } else {
          const perspective = 1 - distanceFromCenter / (height * 0.85);
          adjustedY = light.y + wave * Math.max(0, perspective);
        }

        const gradient = ctx.createRadialGradient(adjustedX, adjustedY, 0, adjustedX, adjustedY, 18);
        gradient.addColorStop(0, colors.core(light.brightness * 0.55));
        gradient.addColorStop(0.5, colors.mid(light.brightness * 0.35));
        gradient.addColorStop(1, colors.outer);

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(adjustedX, adjustedY, 18, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = colors.dot(light.brightness * 0.9);
        ctx.beginPath();
        ctx.arc(adjustedX, adjustedY, 1.75, 0, Math.PI * 2);
        ctx.fill();
      });
    };

    const drawStaticFrame = () => {
      resizeCanvas();
      drawGrid();
    };

    if (!animated) {
      drawStaticFrame();
      window.addEventListener("resize", drawStaticFrame);
      return () => {
        window.removeEventListener("resize", drawStaticFrame);
        motionQuery.removeEventListener("change", onMotionChange);
        document.removeEventListener("visibilitychange", onVisibility);
      };
    }

    const animate = (currentTime: number) => {
      if (!visibleRef.current) {
        animationRef.current = requestAnimationFrame(animate);
        return;
      }

      const deltaTime = currentTime - lastTime;
      lastTime = currentTime;

      if (!reducedMotionRef.current) {
        lightsRef.current.forEach((light, index) => {
          light.progress += light.speed * deltaTime * 0.001;
          if (light.gridLine === "horizontal") light.x = light.progress * light.targetX;
          else light.y = light.progress * light.targetY;
          if (light.progress >= 1) lightsRef.current.splice(index, 1);
        });

        if (Math.random() < 0.018 && window.innerWidth >= 768) {
          lightsRef.current.push(createLight());
        }
        if (lightsRef.current.length > 6) lightsRef.current.shift();
      }

      drawGrid();
      if (!reducedMotionRef.current) drawLights();

      animationRef.current = requestAnimationFrame(animate);
    };

    resizeCanvas();
    animationRef.current = requestAnimationFrame(animate);
    window.addEventListener("resize", resizeCanvas);

    return () => {
      window.removeEventListener("resize", resizeCanvas);
      motionQuery.removeEventListener("change", onMotionChange);
      document.removeEventListener("visibilitychange", onVisibility);
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [animated]);

  useEffect(() => {
    if (animated) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const gridSize = 44;
    const rect = canvas.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const colors = PALETTES[theme];
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;

    ctx.clearRect(0, 0, width, height);
    ctx.strokeStyle = colors.grid;
    ctx.lineWidth = 1;
    ctx.globalAlpha = theme === "dark" ? 0.85 : 0.55;

    const centerX = width / 2;
    const centerY = height / 2;

    for (let x = -gridSize; x < width + gridSize; x += gridSize) {
      ctx.beginPath();
      for (let y = 0; y <= height; y += 2) {
        const distanceFromCenter = Math.hypot(x - centerX, y - centerY);
        const wave = Math.sin(distanceFromCenter * 0.018) * 14;
        const perspective = 1 - distanceFromCenter / (width * 0.85);
        const adjustedX = x + wave * Math.max(0, perspective);
        if (y === 0) ctx.moveTo(adjustedX, y);
        else ctx.lineTo(adjustedX, y);
      }
      ctx.stroke();
    }

    for (let y = -gridSize; y < height + gridSize; y += gridSize) {
      ctx.beginPath();
      for (let x = 0; x <= width; x += 2) {
        const distanceFromCenter = Math.hypot(x - centerX, y - centerY);
        const wave = Math.sin(distanceFromCenter * 0.018) * 14;
        const perspective = 1 - distanceFromCenter / (height * 0.85);
        const adjustedY = y + wave * Math.max(0, perspective);
        if (x === 0) ctx.moveTo(x, adjustedY);
        else ctx.lineTo(x, adjustedY);
      }
      ctx.stroke();
    }

    ctx.globalAlpha = 1;
  }, [theme, animated]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className={cn(
        "hero-live-grid-canvas pointer-events-none absolute inset-0 h-full w-full opacity-[0.72] dark:opacity-90",
        className,
      )}
    />
  );
}

export default HeroLiveGridBackground;
