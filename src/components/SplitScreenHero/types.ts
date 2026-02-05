/**
 * SplitScreenHero - TypeScript interfaces
 * Premium split-screen hero section for luxury events company
 */

export interface Scene {
  id: number;
  category: string;
  eyebrow: string;
  companyName: string;
  tagline: string;
  message: string;
  ctaText: string;
  ctaLink: string;
  imageUrl: string;
  imageAlt: string;
  backgroundColor: string;
  textColor: string;
  accentColor: string;
  /** Optional upcoming event badge */
  upcomingEvent?: {
    label: string;
    title: string;
  };
  /** Optional headline words to style as outline (rest will be solid) */
  outlineWords?: string[];
}

export interface SplitScreenHeroProps {
  /** Array of scene data for the carousel */
  scenes: Scene[];
  /** Auto-play interval in ms. Default: 5000 */
  autoPlayInterval?: number;
  /** Enable keyboard navigation (arrows, space, 1-4). Default: true */
  enableKeyboardNav?: boolean;
  /** Pause auto-transition on hover. Default: true */
  pauseOnHover?: boolean;
  /** Show navigation dots. Default: true */
  showNavigationDots?: boolean;
  /** Show prev/next arrow buttons. Default: false */
  showArrowButtons?: boolean;
  /** Callback when scene changes */
  onSceneChange?: (sceneIndex: number) => void;
  /** Additional CSS classes */
  className?: string;
  /** HTML id for anchor linking */
  id?: string;
}
