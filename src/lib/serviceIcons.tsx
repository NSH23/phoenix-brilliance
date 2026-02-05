import {
  Calendar,
  CalendarCheck,
  Palette,
  Camera,
  Music,
  Mic2,
  UtensilsCrossed,
  Lightbulb,
  Building2,
  Sparkles,
  Video,
  Image,
  Wrench,
  Flower2,
  Speaker,
  Theater,
  Star,
  Wand2,
  ClipboardList,
  PartyPopper,
  type LucideIcon,
} from 'lucide-react';

const ICON_MAP: Record<string, LucideIcon> = {
  Calendar,
  CalendarCheck,
  Palette,
  Camera,
  Music,
  Mic2,
  UtensilsCrossed,
  Utensils: UtensilsCrossed,
  Lightbulb,
  Building2,
  Sparkles,
  Video,
  Image,
  Wrench,
  Flower2,
  Speaker,
  Theater,
  Star,
  Wand2,
  ClipboardList,
  PartyPopper,
};

export function getServiceIcon(icon: string | null): LucideIcon {
  if (!icon || !icon.trim()) return Sparkles;
  const key = icon.trim().replace(/\s+/g, '');
  return ICON_MAP[key] ?? ICON_MAP[icon] ?? Sparkles;
}
