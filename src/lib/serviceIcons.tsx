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
  LayoutGrid,
  Crown,
  Gift,
  MapPin,
  type LucideIcon,
} from 'lucide-react';

const DEFAULT_SERVICE_ICON = LayoutGrid;

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
  LayoutGrid,
  Crown,
  Gift,
  MapPin,
};

export function getServiceIcon(icon: string | null): LucideIcon {
  if (!icon || !icon.trim()) return DEFAULT_SERVICE_ICON;
  const key = icon.trim().replace(/\s+/g, '');
  if (key === 'Sparkles') return DEFAULT_SERVICE_ICON;
  return ICON_MAP[key] ?? ICON_MAP[icon] ?? DEFAULT_SERVICE_ICON;
}
