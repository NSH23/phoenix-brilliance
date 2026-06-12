import {
  Heart,
  Cake,
  Gem,
  Music,
  Flower2,
  Palette,
  Briefcase,
  Gift,
  Car,
  Calendar,
  type LucideIcon,
} from "lucide-react";

const DEFAULT_EVENT_ICON = Calendar;

const SLUG_TO_ICON: Record<string, LucideIcon> = {
  wedding: Heart,
  birthday: Cake,
  engagement: Gem,
  sangeet: Music,
  haldi: Flower2,
  mehendi: Palette,
  anniversary: Gift,
  corporate: Briefcase,
  "corporate-events": Briefcase,
  "car-opening": Car,
};

export function getEventIcon(slug: string): LucideIcon {
  const key = slug.toLowerCase().replace(/\s+/g, "-");
  return SLUG_TO_ICON[key] ?? DEFAULT_EVENT_ICON;
}
