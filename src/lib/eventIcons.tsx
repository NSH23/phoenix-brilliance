import {
  Heart,
  Cake,
  Gem,
  Music,
  Flower2,
  Palette,
  Sparkles,
  Briefcase,
  type LucideIcon,
} from "lucide-react";

const SLUG_TO_ICON: Record<string, LucideIcon> = {
  wedding: Heart,
  birthday: Cake,
  engagement: Gem,
  sangeet: Music,
  haldi: Flower2,
  mehendi: Palette,
  anniversary: Sparkles,
  corporate: Briefcase,
  "corporate-events": Briefcase,
  "car-opening": Sparkles,
};

export function getEventIcon(slug: string): LucideIcon {
  const key = slug.toLowerCase().replace(/\s+/g, "-");
  return SLUG_TO_ICON[key] ?? Sparkles;
}
