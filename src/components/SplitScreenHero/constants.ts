/**
 * SplitScreenHero - Pre-configured scene data
 * 4 scenes: Wedding, Birthday, Corporate, Haldi
 */

import type { Scene } from "./types";

export const DEFAULT_SCENES: Scene[] = [
  {
    id: 1,
    category: "wedding",
    eyebrow: "BESPOKE CELEBRATIONS",
    companyName: "SOFT CHAMPAGNE ELEGANCE",
    tagline: "EVENTS & PRODUCTION",
    message:
      "Experience an affair to remember in soft ivory tones. We orchestrate timeless wedding celebrations with meticulous attention to every romantic detail.",
    ctaText: "Plan Your Dream Wedding",
    ctaLink: "/contact",
    imageUrl: "/hero-wedding.png",
    imageAlt: "Elegant wedding reception with white roses and gold accents",
    backgroundColor: "linear-gradient(135deg, #FFFBF5 0%, #F0F4F8 100%)",
    textColor: "#1A1A2E",
    accentColor: "#B76E79",
    upcomingEvent: {
      label: "UPCOMING EVENT",
      title: "The Golden Gala",
    },
    outlineWords: ["SOFT", "ELEGANCE"],
  },
  {
    id: 2,
    category: "birthday",
    eyebrow: "BESPOKE CELEBRATIONS",
    companyName: "VIBRANT CELEBRATION MOMENTS",
    tagline: "EVENTS & PRODUCTION",
    message:
      "Create unforgettable memories with personalized birthday celebrations. From intimate gatherings to grand parties, we bring your vision to life with style.",
    ctaText: "Design Your Celebration",
    ctaLink: "/contact",
    imageUrl: "/hero-birthday.png",
    imageAlt: "Luxurious birthday celebration with balloon arch and cake",
    backgroundColor: "linear-gradient(135deg, #FFFBF5 0%, #F0F4F8 100%)",
    textColor: "#1A1A2E",
    accentColor: "#FF6B9D",
    upcomingEvent: {
      label: "UPCOMING EVENT",
      title: "The Golden Gala",
    },
    outlineWords: ["VIBRANT", "MOMENTS"],
  },
  {
    id: 3,
    category: "corporate",
    eyebrow: "BESPOKE CELEBRATIONS",
    companyName: "PROFESSIONAL EXCELLENCE DELIVERED",
    tagline: "EVENTS & PRODUCTION",
    message:
      "Elevate your brand with sophisticated corporate events that leave lasting impressions. We transform business gatherings into memorable experiences.",
    ctaText: "Explore Corporate Solutions",
    ctaLink: "/contact",
    imageUrl: "/hero-corporate.png",
    imageAlt: "Professional corporate event with golden podium and branded screen",
    backgroundColor: "linear-gradient(135deg, #FFFBF5 0%, #F0F4F8 100%)",
    textColor: "#1A1A2E",
    accentColor: "#667eea",
    upcomingEvent: {
      label: "UPCOMING EVENT",
      title: "The Golden Gala",
    },
    outlineWords: ["PROFESSIONAL", "DELIVERED"],
  },
  {
    id: 4,
    category: "haldi",
    eyebrow: "BESPOKE CELEBRATIONS",
    companyName: "GOLDEN TRADITIONS HONORED",
    tagline: "EVENTS & PRODUCTION",
    message:
      "Celebrate sacred rituals with authentic elegance. We blend traditional customs with modern luxury to create meaningful cultural celebrations.",
    ctaText: "Discover Traditional Events",
    ctaLink: "/contact",
    imageUrl: "/hero-haldi.png",
    imageAlt: "Traditional haldi ceremony with marigold flowers and ornate seating",
    backgroundColor: "linear-gradient(135deg, #FFFBF5 0%, #F0F4F8 100%)",
    textColor: "#1A1A2E",
    accentColor: "#FFD93D",
    upcomingEvent: {
      label: "UPCOMING EVENT",
      title: "The Golden Gala",
    },
    outlineWords: ["GOLDEN", "HONORED"],
  },
];
