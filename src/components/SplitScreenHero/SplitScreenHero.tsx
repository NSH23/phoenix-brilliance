/**
 * SplitScreenHero - Premium split-screen hero section
 * Auto-transitioning event showcases for luxury events company
 */

import React, { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { Link } from "react-router-dom";
import { ChevronLeft, ChevronRight, ArrowRight } from "lucide-react";
import CountUp from "@/components/CountUp";
import type { SplitScreenHeroProps, Scene } from "./types";

const EASING = [0.4, 0, 0.2, 1];
const IMAGE_TRANSITION = { duration: 0.7, ease: [0.16, 1, 0.3, 1] };
const CONTENT_OUT = { duration: 0.25, ease: [0.4, 0, 1, 1] };
const CONTENT_IN = { duration: 0.5, delay: 0.1, ease: [0.16, 1, 0.3, 1] };
const BG_TRANSITION = { duration: 1.2, ease: [0.4, 0, 0.2, 1] };

// Dynamic background gradients based on event type and theme
const getBackgroundGradient = (category: string, isDark: boolean): string => {
  if (isDark) {
    switch (category) {
      case "wedding":
        return "radial-gradient(circle at 25% 40%, rgba(74, 50, 70, 0.4) 0%, transparent 60%), radial-gradient(circle at 75% 70%, rgba(58, 42, 62, 0.3) 0%, transparent 60%), radial-gradient(circle at 50% 20%, rgba(212, 175, 55, 0.08) 0%, transparent 50%), linear-gradient(135deg, #1A1A2E 0%, #242438 100%)";
      case "birthday":
        return "radial-gradient(circle at 30% 50%, rgba(77, 41, 66, 0.4) 0%, transparent 60%), radial-gradient(circle at 70% 30%, rgba(93, 44, 75, 0.3) 0%, transparent 60%), radial-gradient(circle at 40% 80%, rgba(212, 175, 55, 0.1) 0%, transparent 50%), linear-gradient(135deg, #1A1A2E 0%, #2A2440 100%)";
      case "corporate":
        return "radial-gradient(circle at 20% 60%, rgba(42, 53, 72, 0.5) 0%, transparent 60%), radial-gradient(circle at 80% 40%, rgba(45, 56, 82, 0.4) 0%, transparent 60%), radial-gradient(circle at 50% 90%, rgba(212, 175, 55, 0.08) 0%, transparent 50%), linear-gradient(135deg, #1A1A2E 0%, #22283E 100%)";
      case "haldi":
        return "radial-gradient(circle at 35% 45%, rgba(74, 56, 26, 0.5) 0%, transparent 60%), radial-gradient(circle at 65% 75%, rgba(90, 67, 32, 0.4) 0%, transparent 60%), radial-gradient(circle at 50% 15%, rgba(212, 175, 55, 0.12) 0%, transparent 50%), linear-gradient(135deg, #1A1A2E 0%, #2A2820 100%)";
      default:
        return "linear-gradient(135deg, #1A1A2E 0%, #242438 100%)";
    }
  } else {
    switch (category) {
      case "wedding":
        return "radial-gradient(circle at 20% 50%, rgba(255, 240, 245, 0.6) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(255, 228, 232, 0.4) 0%, transparent 50%), radial-gradient(circle at 40% 80%, rgba(212, 175, 55, 0.08) 0%, transparent 50%), linear-gradient(135deg, #FEFEFE 0%, #F9F7F5 100%)";
      case "birthday":
        return "radial-gradient(circle at 25% 60%, rgba(255, 224, 240, 0.5) 0%, transparent 50%), radial-gradient(circle at 75% 30%, rgba(255, 182, 193, 0.3) 0%, transparent 50%), radial-gradient(circle at 50% 90%, rgba(212, 175, 55, 0.1) 0%, transparent 50%), linear-gradient(135deg, #FEFEFE 0%, #FFF5FA 100%)";
      case "corporate":
        return "radial-gradient(circle at 30% 40%, rgba(224, 235, 255, 0.5) 0%, transparent 50%), radial-gradient(circle at 70% 70%, rgba(214, 230, 255, 0.4) 0%, transparent 50%), radial-gradient(circle at 50% 10%, rgba(212, 175, 55, 0.08) 0%, transparent 50%), linear-gradient(135deg, #FEFEFE 0%, #F8FAFE 100%)";
      case "haldi":
        return "radial-gradient(circle at 35% 55%, rgba(255, 248, 220, 0.6) 0%, transparent 50%), radial-gradient(circle at 65% 25%, rgba(255, 238, 170, 0.4) 0%, transparent 50%), radial-gradient(circle at 45% 85%, rgba(212, 175, 55, 0.12) 0%, transparent 50%), linear-gradient(135deg, #FEFEFE 0%, #FFFBF0 100%)";
      default:
        return "linear-gradient(135deg, #FEFEFE 0%, #F9F7F5 100%)";
    }
  }
};

const SplitScreenHero = ({
  scenes,
  autoPlayInterval = 5000,
  enableKeyboardNav = true,
  pauseOnHover = true,
  showNavigationDots = true,
  showArrowButtons = false,
  onSceneChange,
  className = "",
  id,
}: SplitScreenHeroProps) => {
  const [currentScene, setCurrentScene] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [pausedByHover, setPausedByHover] = useState(false);
  const [pausedByUser, setPausedByUser] = useState(false);
  const isPaused = pausedByHover || pausedByUser;
  const progressRef = useRef<ReturnType<typeof requestAnimationFrame> | null>(null);
  const startTimeRef = useRef<number>(0);
  const touchStartX = useRef<number>(0);
  const prefersReducedMotion = useReducedMotion();
  const intervalMs = prefersReducedMotion ? 0 : autoPlayInterval;
  const [isDark, setIsDark] = useState(false);

  const scene = scenes[currentScene] ?? scenes[0];
  const totalScenes = scenes.length;

  // Detect dark theme
  useEffect(() => {
    const checkTheme = () => {
      const darkMode = document.documentElement.classList.contains('dark');
      setIsDark(darkMode);
    };
    checkTheme();
    const observer = new MutationObserver(checkTheme);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  const goToScene = useCallback(
    (index: number) => {
      if (index < 0 || index >= totalScenes) return;
      setIsTransitioning(true);
      setCurrentScene(index);
      onSceneChange?.(index);
      setTimeout(() => setIsTransitioning(false), 1000);
    },
    [totalScenes, onSceneChange]
  );

  const nextScene = useCallback(() => {
    goToScene((currentScene + 1) % totalScenes);
  }, [currentScene, totalScenes, goToScene]);

  const prevScene = useCallback(() => {
    goToScene((currentScene - 1 + totalScenes) % totalScenes);
  }, [currentScene, totalScenes, goToScene]);

  const togglePause = useCallback(() => {
    setPausedByUser((p) => !p);
  }, []);

  // Auto-play
  useEffect(() => {
    if (intervalMs === 0 || isPaused) return;

    const startProgress = () => {
      startTimeRef.current = Date.now();
      setProgress(0);
      const tick = () => {
        const elapsed = Date.now() - startTimeRef.current;
        const p = Math.min((elapsed / intervalMs) * 100, 100);
        setProgress(p);
        if (p >= 100) {
          nextScene();
          startTimeRef.current = Date.now();
        }
        progressRef.current = requestAnimationFrame(tick);
      };
      progressRef.current = requestAnimationFrame(tick);
    };

    startProgress();
    return () => {
      if (progressRef.current) cancelAnimationFrame(progressRef.current);
    };
  }, [intervalMs, isPaused, currentScene, nextScene]);

  // Keyboard navigation
  useEffect(() => {
    if (!enableKeyboardNav) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        prevScene();
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        nextScene();
      } else if (e.key === " ") {
        e.preventDefault();
        togglePause();
      } else if (e.key >= "1" && e.key <= "4" && parseInt(e.key, 10) <= totalScenes) {
        e.preventDefault();
        goToScene(parseInt(e.key, 10) - 1);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [enableKeyboardNav, prevScene, nextScene, togglePause, goToScene, totalScenes]);

  // Reduced motion: show first scene only, no auto-play
  const isReduced = !!prefersReducedMotion;

  const handleMouseEnter = useCallback(() => {
    if (pauseOnHover) setPausedByHover(true);
  }, [pauseOnHover]);

  const handleMouseLeave = useCallback(() => {
    if (pauseOnHover) setPausedByHover(false);
  }, [pauseOnHover]);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  }, []);

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      const diff = touchStartX.current - e.changedTouches[0].clientX;
      const threshold = 50;
      if (Math.abs(diff) >= threshold) {
        if (diff > 0) nextScene();
        else prevScene();
      }
    },
    [nextScene, prevScene]
  );

  return (
    <section
      id={id}
      role="region"
      aria-label="Hero carousel with event showcases"
      aria-live="polite"
      className={`relative flex w-full min-h-screen h-[100dvh] lg:h-screen overflow-hidden ${className}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Dynamic Gradient Mesh Background */}
      <div className="absolute inset-0 z-0" aria-hidden>
        {/* Base gradient layer - transitions smoothly when scene changes */}
        <motion.div
          key={`bg-${scene.category}-${isDark}`}
          className="absolute inset-0"
          initial={isReduced ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={BG_TRANSITION}
          style={{
            background: getBackgroundGradient(scene.category, isDark),
          }}
        />
        
        {/* Light theme: Animated gradient mesh layers */}
        {!isDark && !isReduced && (
          <>
            {/* Layer 1: Gold accent blobs - left side focus */}
            <motion.div
              className="absolute inset-0 opacity-70"
              animate={{
                background: [
                  "radial-gradient(ellipse 120% 100% at 10% 20%, rgba(212, 175, 55, 0.15) 0%, transparent 65%)",
                  "radial-gradient(ellipse 115% 105% at 15% 25%, rgba(212, 175, 55, 0.18) 0%, transparent 65%)",
                  "radial-gradient(ellipse 110% 110% at 20% 30%, rgba(212, 175, 55, 0.15) 0%, transparent 65%)",
                  "radial-gradient(ellipse 120% 100% at 10% 20%, rgba(212, 175, 55, 0.15) 0%, transparent 65%)",
                ],
              }}
              transition={{
                duration: 20,
                repeat: Infinity,
                ease: [0.25, 0.1, 0.25, 1],
              }}
            />
            
            {/* Layer 2: Warm cream blobs - left side */}
            <motion.div
              className="absolute inset-0 opacity-65"
              animate={{
                background: [
                  "radial-gradient(ellipse 100% 130% at 5% 15%, rgba(255, 248, 240, 0.5) 0%, transparent 70%)",
                  "radial-gradient(ellipse 105% 125% at 8% 20%, rgba(255, 248, 240, 0.6) 0%, transparent 70%)",
                  "radial-gradient(ellipse 110% 120% at 12% 25%, rgba(255, 248, 240, 0.5) 0%, transparent 70%)",
                  "radial-gradient(ellipse 100% 130% at 5% 15%, rgba(255, 248, 240, 0.5) 0%, transparent 70%)",
                ],
              }}
              transition={{
                duration: 24,
                repeat: Infinity,
                ease: [0.25, 0.1, 0.25, 1],
                delay: 3,
              }}
            />
            
            {/* Layer 3: Soft rose/gold wash - left side */}
            <motion.div
              className="absolute inset-0 opacity-60"
              animate={{
                background: [
                  "radial-gradient(ellipse 130% 110% at 8% 65%, rgba(212, 175, 55, 0.08) 0%, transparent 75%)",
                  "radial-gradient(ellipse 125% 115% at 12% 70%, rgba(255, 248, 246, 0.4) 0%, transparent 75%)",
                  "radial-gradient(ellipse 120% 120% at 15% 75%, rgba(212, 175, 55, 0.06) 0%, transparent 75%)",
                  "radial-gradient(ellipse 130% 110% at 8% 65%, rgba(212, 175, 55, 0.08) 0%, transparent 75%)",
                ],
              }}
              transition={{
                duration: 28,
                repeat: Infinity,
                ease: [0.25, 0.1, 0.25, 1],
                delay: 6,
              }}
            />
            
            {/* Layer 4: Extra gold accent - left side emphasis */}
            <motion.div
              className="absolute inset-0 opacity-40"
              animate={{
                background: [
                  "radial-gradient(ellipse 90% 100% at 3% 45%, rgba(212, 175, 55, 0.2) 0%, transparent 55%)",
                  "radial-gradient(ellipse 95% 105% at 6% 50%, rgba(212, 175, 55, 0.22) 0%, transparent 55%)",
                  "radial-gradient(ellipse 100% 90% at 9% 55%, rgba(212, 175, 55, 0.2) 0%, transparent 55%)",
                  "radial-gradient(ellipse 90% 100% at 3% 45%, rgba(212, 175, 55, 0.2) 0%, transparent 55%)",
                ],
              }}
              transition={{
                duration: 26,
                repeat: Infinity,
                ease: [0.25, 0.1, 0.25, 1],
                delay: 4,
              }}
            />
          </>
        )}
        
        {/* Subtle overlay for depth */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#FDFCFB]/20 via-transparent to-transparent dark:from-[#0f172a]/40 dark:via-transparent dark:to-transparent" />
      </div>

      {/* Desktop: 50/50 split. Mobile: stacked */}
      <div className="relative z-10 flex flex-col lg:flex-row w-full h-full">
        {/* LEFT PANEL - Image with Gallery Frame */}
        <div className="relative w-full lg:w-1/2 min-h-[55vh] lg:min-h-0 h-[55vh] lg:h-full overflow-hidden dark:from-[#1A1A2E] dark:to-[#1A1A2E] flex items-center justify-center p-4 sm:p-6 lg:p-8">
          {/* Light theme: Animated background mesh for left panel */}
          {!isDark && (
            <div className="absolute inset-0 z-0" aria-hidden>
              {/* Base gradient */}
              <div 
                className="absolute inset-0"
                style={{
                  background: "linear-gradient(135deg, #FDFCFB 0%, #F9F7F4 50%, #F5F2ED 100%)"
                }}
              />
              
              {/* Animated mesh layers */}
              {!isReduced && (
                <>
                  <motion.div
                    className="absolute inset-0 opacity-70"
                    animate={{
                      background: [
                        "radial-gradient(ellipse 140% 120% at 15% 25%, rgba(212, 175, 55, 0.12) 0%, transparent 60%)",
                        "radial-gradient(ellipse 135% 125% at 20% 30%, rgba(212, 175, 55, 0.15) 0%, transparent 60%)",
                        "radial-gradient(ellipse 130% 130% at 25% 35%, rgba(212, 175, 55, 0.12) 0%, transparent 60%)",
                        "radial-gradient(ellipse 140% 120% at 15% 25%, rgba(212, 175, 55, 0.12) 0%, transparent 60%)",
                      ],
                    }}
                    transition={{
                      duration: 18,
                      repeat: Infinity,
                      ease: [0.25, 0.1, 0.25, 1],
                    }}
                  />
                  <motion.div
                    className="absolute inset-0 opacity-65"
                    animate={{
                      background: [
                        "radial-gradient(ellipse 120% 140% at 10% 60%, rgba(255, 248, 240, 0.5) 0%, transparent 65%)",
                        "radial-gradient(ellipse 125% 135% at 15% 65%, rgba(255, 248, 240, 0.6) 0%, transparent 65%)",
                        "radial-gradient(ellipse 130% 130% at 20% 70%, rgba(255, 248, 240, 0.5) 0%, transparent 65%)",
                        "radial-gradient(ellipse 120% 140% at 10% 60%, rgba(255, 248, 240, 0.5) 0%, transparent 65%)",
                      ],
                    }}
                    transition={{
                      duration: 22,
                      repeat: Infinity,
                      ease: [0.25, 0.1, 0.25, 1],
                      delay: 4,
                    }}
                  />
                  <motion.div
                    className="absolute inset-0 opacity-50"
                    animate={{
                      background: [
                        "radial-gradient(ellipse 110% 130% at 5% 80%, rgba(212, 175, 55, 0.08) 0%, transparent 70%)",
                        "radial-gradient(ellipse 115% 125% at 8% 85%, rgba(255, 251, 245, 0.4) 0%, transparent 70%)",
                        "radial-gradient(ellipse 120% 120% at 12% 90%, rgba(212, 175, 55, 0.06) 0%, transparent 70%)",
                        "radial-gradient(ellipse 110% 130% at 5% 80%, rgba(212, 175, 55, 0.08) 0%, transparent 70%)",
                      ],
                    }}
                    transition={{
                      duration: 26,
                      repeat: Infinity,
                      ease: [0.25, 0.1, 0.25, 1],
                      delay: 8,
                    }}
                  />
                </>
              )}
            </div>
          )}
          
          {/* Dark theme fallback */}
          {isDark && (
            <div className="absolute inset-0 z-0 bg-gradient-to-br from-[#1A1A2E] to-[#1A1A2E]" aria-hidden />
          )}
          <AnimatePresence mode="wait" initial={false}>
            {scenes.map((s, i) =>
              i === currentScene ? (
                <motion.div
                  key={s.id}
                  initial={isReduced ? false : { opacity: 0, scale: 1.02, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={isReduced ? undefined : { opacity: 0, scale: 0.98, y: -10 }}
                  transition={IMAGE_TRANSITION}
                  className="relative z-10 w-full max-w-xl mx-auto h-[85%] lg:h-[80%] mt-16 sm:mt-20 lg:mt-20"
                >
                  {/* Enhanced Gallery-style frame with depth */}
                  <div className={`relative w-full h-full rounded-[36px] p-5 transition-all duration-500 group ${
                    isDark 
                      ? 'bg-gradient-to-br from-[#2A2A3E] to-[#1F1F2E] shadow-[0_40px_80px_-10px_rgba(0,0,0,0.5),0_25px_50px_-10px_rgba(0,0,0,0.4),0_15px_30px_-5px_rgba(212,175,55,0.15),inset_0_0_0_1px_rgba(212,175,55,0.25),inset_0_2px_4px_rgba(212,175,55,0.1)] hover:shadow-[0_50px_100px_-10px_rgba(0,0,0,0.6),0_30px_60px_-10px_rgba(0,0,0,0.5),0_20px_40px_-5px_rgba(212,175,55,0.2),inset_0_0_0_1px_rgba(212,175,55,0.3)]'
                      : 'bg-gradient-to-br from-[#FFFFFF] to-[#F9F7F5] shadow-[0_35px_65px_-10px_rgba(0,0,0,0.08),0_20px_40px_-10px_rgba(0,0,0,0.05),0_10px_20px_-5px_rgba(212,175,55,0.08),inset_0_0_0_1px_rgba(212,175,55,0.12),inset_0_2px_4px_rgba(255,255,255,0.8)] hover:shadow-[0_45px_85px_-10px_rgba(0,0,0,0.12),0_25px_50px_-10px_rgba(0,0,0,0.08),0_15px_30px_-5px_rgba(212,175,55,0.12),inset_0_0_0_1px_rgba(212,175,55,0.15)]'
                  }`}>
                    {/* Gold glow effect on top edge - light theme */}
                    {!isDark && (
                      <div className="absolute top-0 left-[20%] right-[20%] h-[1px] bg-gradient-to-r from-transparent via-[rgba(212,175,55,0.4)] to-transparent blur-[2px] z-10" />
                    )}
                    {/* Gold glow effect - dark theme (on hover) */}
                    {isDark && (
                      <div className="absolute inset-[-2px] rounded-[38px] bg-gradient-to-br from-[rgba(212,175,55,0.3)] via-transparent to-[rgba(212,175,55,0.2)] opacity-0 group-hover:opacity-100 transition-opacity duration-[400ms] blur-[12px] -z-10" />
                    )}
                    {/* Inner image container */}
                    <div className="relative w-full h-full rounded-[24px] sm:rounded-[26px] lg:rounded-[28px] overflow-hidden">
                      <img
                        src={s.imageUrl}
                        alt={s.imageAlt}
                        className="w-full h-full object-cover object-center"
                        loading={i === 0 ? "eager" : "lazy"}
                        fetchPriority={i === 0 ? "high" : "low"}
                      />
                      
                      {/* Upcoming Event Badge */}
                      {s.upcomingEvent && (
                        <motion.div
                          initial={isReduced ? false : { opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.4, duration: 0.5 }}
                          className="absolute bottom-4 right-4 z-20 px-4 py-2.5 rounded-full bg-black/70 backdrop-blur-sm"
                        >
                          <p className="text-[10px] sm:text-xs font-light text-white/80 uppercase tracking-wider">
                            {s.upcomingEvent.label}
                          </p>
                          <p className="text-sm sm:text-base font-bold text-white mt-0.5">
                            {s.upcomingEvent.title}
                          </p>
                        </motion.div>
                      )}
                    </div>
                  </div>
                </motion.div>
              ) : null
            )}
          </AnimatePresence>

          {/* Navigation dots - bottom left (mobile: center bottom) */}
          {showNavigationDots && totalScenes > 1 && (
            <div
              className="absolute bottom-6 left-1/2 -translate-x-1/2 lg:left-10 lg:translate-x-0 sm:bottom-10 z-20 flex gap-3"
              role="tablist"
              aria-label="Scene navigation"
            >
              {scenes.map((_, i) => (
                <NavDot
                  key={i}
                  index={i}
                  isActive={i === currentScene}
                  progress={i === currentScene ? progress : 0}
                  onClick={() => goToScene(i)}
                  prefersReducedMotion={isReduced}
                  isDark={isDark}
                />
              ))}
            </div>
          )}

        </div>

        {/* RIGHT PANEL - Content */}
        <div className="relative w-full lg:w-1/2 min-h-[45vh] lg:min-h-0 h-[45vh] lg:h-full flex flex-col justify-center items-start overflow-hidden">
          {/* Background - smooth gradient transition (two-tone: cream to light blue) */}
          <motion.div
            key={currentScene}
            className="absolute inset-0 bg-gradient-to-br from-[#FDFCFB] to-[#F9F7F4] dark:from-[#1A1A2E] dark:via-[#1A1A2E] dark:to-[#1A1A2E]"
            initial={isReduced ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={BG_TRANSITION}
          />
          
          {/* Light theme: Additional animated mesh for right panel */}
          {!isDark && !isReduced && (
            <motion.div
              className="absolute inset-0 opacity-50"
              animate={{
                background: [
                  "radial-gradient(ellipse 100% 120% at 20% 40%, rgba(255, 248, 246, 0.4) 0%, transparent 60%)",
                  "radial-gradient(ellipse 110% 110% at 25% 45%, rgba(249, 247, 252, 0.5) 0%, transparent 60%)",
                  "radial-gradient(ellipse 105% 115% at 30% 50%, rgba(255, 251, 245, 0.4) 0%, transparent 60%)",
                  "radial-gradient(ellipse 100% 120% at 20% 40%, rgba(255, 248, 246, 0.4) 0%, transparent 60%)",
                ],
              }}
              transition={{
                duration: 22,
                repeat: Infinity,
                ease: [0.25, 0.1, 0.25, 1],
                delay: 2,
              }}
            />
          )}
          
          {/* Floating Gold Particles - Decorative Elements */}
          {!isReduced && (
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              <motion.div
                className={`absolute w-1 h-1 rounded-full ${
                  isDark ? "bg-yellow-400/20" : "bg-yellow-400/20"
                }`}
                style={{ top: "15%", left: "10%" }}
                animate={{
                  y: [0, -20, 0],
                  x: [0, 10, 0],
                }}
                transition={{
                  duration: 8,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />
              <motion.div
                className={`absolute w-2 h-2 rounded-full ${
                  isDark ? "bg-yellow-400/15" : "bg-yellow-400/15"
                }`}
                style={{ top: "45%", right: "15%" }}
                animate={{
                  y: [0, -15, 0],
                  x: [0, -8, 0],
                }}
                transition={{
                  duration: 6,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: 1,
                }}
              />
              <motion.div
                className={`absolute w-1.5 h-1.5 rounded-full ${
                  isDark ? "bg-yellow-400/10" : "bg-yellow-400/10"
                }`}
                style={{ top: "75%", left: "20%" }}
                animate={{
                  y: [0, -25, 0],
                  x: [0, 12, 0],
                }}
                transition={{
                  duration: 10,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: 2,
                }}
              />
              <motion.div
                className={`absolute w-1 h-1 rounded-full ${
                  isDark ? "bg-yellow-400/15" : "bg-yellow-400/15"
                }`}
                style={{ top: "30%", right: "25%" }}
                animate={{
                  y: [0, -18, 0],
                  x: [0, -10, 0],
                }}
                transition={{
                  duration: 7,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: 0.5,
                }}
              />
              <motion.div
                className={`absolute w-1.5 h-1.5 rounded-full ${
                  isDark ? "bg-yellow-400/12" : "bg-yellow-400/12"
                }`}
                style={{ top: "60%", left: "30%" }}
                animate={{
                  y: [0, -22, 0],
                  x: [0, 8, 0],
                }}
                transition={{
                  duration: 9,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: 1.5,
                }}
              />
            </div>
          )}

          {/* pt-20/pt-24: clear fixed navbar (h-16 sm:h-20) for proper alignment */}
          <div className="relative z-10 w-full flex flex-col justify-center items-start px-4 pt-20 pb-8 sm:px-6 sm:pt-24 sm:pb-10 lg:px-20 lg:px-28 lg:pt-24 lg:pb-16 min-h-full">
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={scene.id}
                initial={isReduced ? false : { opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={isReduced ? undefined : { opacity: 0, y: -10 }}
                transition={{
                  exit: CONTENT_OUT,
                  enter: CONTENT_IN,
                }}
                className="w-full"
              >
                <ContentPanel scene={scene} />
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Optional arrow buttons - hero edges */}
      {showArrowButtons && totalScenes > 1 && (
        <>
          <button
            type="button"
            aria-label="Previous scene"
            onClick={prevScene}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-30 w-12 h-12 rounded-full bg-white/20 backdrop-blur-[10px] flex items-center justify-center text-white hover:bg-white/40 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-yellow-500"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <button
            type="button"
            aria-label="Next scene"
            onClick={nextScene}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-30 w-12 h-12 rounded-full bg-white/20 backdrop-blur-[10px] flex items-center justify-center text-white hover:bg-white/40 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-yellow-500"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </>
      )}
    </section>
  );
};

function NavDot({
  index,
  isActive,
  progress,
  onClick,
  prefersReducedMotion,
  isDark,
}: {
  index: number;
  isActive: boolean;
  progress: number;
  onClick: () => void;
  prefersReducedMotion: boolean;
  isDark: boolean;
}) {
  const size = 10;
  const stroke = 2;
  const r = (size - stroke) / 2;
  const circumference = 2 * Math.PI * r;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <button
      type="button"
      role="tab"
      aria-selected={isActive}
      aria-label={`Go to scene ${index + 1}`}
      onClick={onClick}
      className={`
        relative w-[10px] h-[10px] rounded-full cursor-pointer transition-all duration-300
        focus:outline-none focus-visible:ring-2 focus-visible:ring-[#D4AF37] focus-visible:ring-offset-2
        ${isActive 
          ? isDark 
            ? "ring-2 ring-[rgba(212,175,55,0.4)] scale-120" 
            : "ring-2 ring-[rgba(212,175,55,0.3)] scale-120"
          : isDark 
            ? "bg-white/20 hover:bg-[rgba(212,175,55,0.5)] hover:scale-110" 
            : "bg-[rgba(62,39,35,0.25)] hover:bg-[rgba(212,175,55,0.5)] hover:scale-110"
        }
      `}
      style={isActive ? { transform: "scale(1.2)" } : {}}
    >
      {isActive && (
        prefersReducedMotion ? (
          <span 
            className="absolute inset-0 rounded-full" 
            style={{ 
              background: "#D4AF37",
              boxShadow: isDark 
                ? "0 0 16px rgba(212, 175, 55, 0.6)" 
                : "0 0 12px rgba(212, 175, 55, 0.4)"
            }}
            aria-hidden 
          />
        ) : (
          <svg
            className="absolute inset-0 w-full h-full -rotate-90"
            viewBox={`0 0 ${size} ${size}`}
            aria-hidden
          >
            <circle
              cx={size / 2}
              cy={size / 2}
              r={r}
              fill="#D4AF37"
              stroke={isDark ? "rgba(212, 175, 55, 0.4)" : "rgba(212, 175, 55, 0.3)"}
              strokeWidth={stroke}
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              style={{ 
                transition: "stroke-dashoffset 0.1s linear",
                filter: isDark 
                  ? "drop-shadow(0 0 16px rgba(212, 175, 55, 0.6))" 
                  : "drop-shadow(0 0 12px rgba(212, 175, 55, 0.4))"
              }}
            />
          </svg>
        )
      )}
    </button>
  );
}

function ContentPanel({ scene }: { scene: Scene }) {
  const prefersReducedMotion = useReducedMotion();
  const [isDark, setIsDark] = useState(false);
  
  // Detect dark theme
  useEffect(() => {
    const checkTheme = () => {
      const darkMode = document.documentElement.classList.contains('dark');
      setIsDark(darkMode);
    };
    checkTheme();
    const observer = new MutationObserver(checkTheme);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);
  
  // Split headline into words and apply outline/solid styling
  const headlineWords = scene.companyName.split(" ");
  const outlineWordsSet = new Set(scene.outlineWords || []);
  
  // Statistics data
  const stats = [
    { value: 2200, suffix: "+", label: "Successful Events" },
    { value: 1500, suffix: "+", label: "Happy Couples" },
    { value: 100, suffix: "%", label: "Quality Assurance" },
  ];

  return (
    <div className="max-w-2xl flex flex-col gap-3 sm:gap-4 w-full">
      {/* Tagline (Eyebrow) */}
      <motion.p
        initial={prefersReducedMotion ? false : { opacity: 0, y: 15, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ 
          duration: 0.6, 
          delay: 0.15,
          ease: [0.16, 1, 0.3, 1]
        }}
        className="text-xs sm:text-sm font-light uppercase tracking-[0.15em] mb-1"
        style={{
          color: isDark ? "rgba(255, 255, 255, 0.9)" : "#D4AF37",
        }}
      >
        {scene.eyebrow}
      </motion.p>

      {/* Main Headline with Mixed Outline/Solid Style */}
      <motion.h1
        initial={prefersReducedMotion ? false : { opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ 
          duration: 0.7, 
          delay: 0.25,
          ease: [0.16, 1, 0.3, 1]
        }}
        className="font-bold tracking-[-0.01em] leading-[0.95] mb-3"
        style={{ fontFamily: "'Playfair Display', serif" }}
      >
        {headlineWords.map((word, idx) => {
          const isOutline = outlineWordsSet.has(word.toUpperCase());
          return (
            <motion.span
              key={idx}
              initial={prefersReducedMotion ? false : { opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ 
                duration: 0.6, 
                delay: 0.3 + (idx * 0.08),
                ease: [0.16, 1, 0.3, 1]
              }}
              className={`inline-block ${isOutline ? "" : ""}`}
              style={
                isOutline
                  ? {
                      fontSize: "clamp(36px, 8vw, 72px)",
                      fontWeight: 700,
                      letterSpacing: "-1px",
                      WebkitTextStroke: "2px #D4AF37",
                      WebkitTextFillColor: "transparent",
                      color: "transparent",
                      lineHeight: "0.95",
                    }
                  : {
                      fontSize: "clamp(36px, 8vw, 72px)",
                      fontWeight: 700,
                      letterSpacing: "-1px",
                      lineHeight: "0.95",
                      color: isDark ? "#FFFFFF" : "#1A1A2E",
                      textShadow: isDark ? "0 2px 4px rgba(0,0,0,0.3)" : "none",
                    }
              }
            >
              {word}
              {idx < headlineWords.length - 1 && " "}
            </motion.span>
          );
        })}
      </motion.h1>

      {/* Descriptive Paragraph */}
      <motion.p
        initial={prefersReducedMotion ? false : { opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ 
          duration: 0.6, 
          delay: 0.4,
          ease: [0.16, 1, 0.3, 1]
        }}
        className="font-normal max-w-[560px] mb-5 px-4 sm:px-0"
        style={{
          fontFamily: "'Inter', sans-serif",
          fontSize: "clamp(16px, 1.8vw, 19px)",
          fontWeight: 400,
          lineHeight: "1.65",
          letterSpacing: "0.3px",
          color: isDark ? "rgba(255, 255, 255, 0.82)" : "rgba(62, 39, 35, 0.85)",
          textShadow: isDark ? "0 1px 2px rgba(0,0,0,0.2)" : "none",
        }}
      >
        {scene.message}
      </motion.p>

      {/* CTA Buttons */}
      <motion.div
        initial={prefersReducedMotion ? false : { opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ 
          duration: 0.6, 
          delay: 0.5,
          ease: [0.16, 1, 0.3, 1]
        }}
        className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-6"
      >
        {/* Primary Button - INQUIRE NOW */}
        <Link
          to={scene.ctaLink}
          className="group inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl bg-[#D4AF37] text-white text-base font-semibold transition-all duration-300 hover:bg-[#C19B2E] hover:scale-105 hover:shadow-[0_10px_30px_rgba(212,175,55,0.4)] active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#D4AF37] focus-visible:ring-offset-2 focus-visible:ring-offset-transparent"
        >
          {scene.ctaText}
          <ArrowRight className="w-5 h-5 shrink-0 transition-transform duration-300 group-hover:translate-x-1" aria-hidden />
        </Link>

        {/* Secondary Button - VIEW PORTFOLIO */}
        <Link
          to="/gallery"
          className="group inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl border-2 border-[#E8E6E3] dark:border-white/30 text-[#1A1A2E] dark:text-white text-base font-semibold bg-transparent transition-all duration-300 hover:border-[#D4AF37] dark:hover:border-[#D4AF37] hover:bg-[#D4AF37]/5 dark:hover:bg-[#D4AF37]/10 active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#D4AF37] focus-visible:ring-offset-2 focus-visible:ring-offset-transparent"
        >
          VIEW PORTFOLIO
        </Link>
      </motion.div>

      {/* Statistics Section */}
      <motion.div
        initial={prefersReducedMotion ? false : { opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ 
          duration: 0.6, 
          delay: 0.6,
          ease: [0.16, 1, 0.3, 1]
        }}
        className="flex flex-row items-center justify-center gap-6 sm:gap-8 lg:gap-12 mt-4 px-4 sm:px-0 -ml-4 sm:-ml-6"
        role="list"
        aria-label="Statistics"
      >
        {stats.map((stat, index) => (
          <React.Fragment key={stat.label}>
            <motion.div
              initial={prefersReducedMotion ? false : { opacity: 0, y: 15, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ 
                duration: 0.6, 
                delay: 0.7 + (index * 0.1),
                ease: [0.16, 1, 0.3, 1]
              }}
              className="flex flex-col text-center"
              role="listitem"
            >
              <p className="text-3xl sm:text-4xl lg:text-5xl font-bold text-[#1A1A2E] dark:text-white dark:drop-shadow-[0_2px_4px_rgba(0,0,0,0.3)] leading-none tabular-nums mb-2">
                <CountUp
                  end={stat.value}
                  suffix={stat.suffix}
                  duration={2000}
                  reducedMotion={!!prefersReducedMotion}
                />
              </p>
              <p className="text-xs uppercase tracking-widest text-[#6B6B6B] dark:text-white/80 dark:drop-shadow-[0_1px_2px_rgba(0,0,0,0.2)] font-semibold">
                {stat.label}
              </p>
            </motion.div>
            {index < stats.length - 1 && (
              <div className="w-px h-12 bg-gradient-to-b from-transparent via-[rgba(212,175,55,0.3)] to-transparent" />
            )}
          </React.Fragment>
        ))}
      </motion.div>
    </div>
  );
}

export default SplitScreenHero;
