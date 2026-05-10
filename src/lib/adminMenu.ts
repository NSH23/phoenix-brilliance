import type { LucideIcon } from 'lucide-react';
import {
  LayoutDashboard,
  Calendar,
  Images,
  FolderOpen,
  Handshake,
  MessageSquareQuote,
  Mail,
  FileText,
  Settings,
  Wrench,
  Award,
  Users,
  ImagePlus,
  Film,
  MessageCircleMore,
  ChartColumn,
  Clapperboard,
} from 'lucide-react';

export interface AdminMenuItem {
  name: string;
  href: string;
  icon: LucideIcon;
  keywords?: string;
}

export const ADMIN_MENU_ITEMS: AdminMenuItem[] = [
  { name: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard, keywords: 'home overview' },
  { name: 'WP Leads', href: '/admin/wp-leads', icon: MessageCircleMore, keywords: 'whatsapp leads pipeline agent' },
  { name: 'WP Analytics', href: '/admin/wp-analytics', icon: ChartColumn, keywords: 'whatsapp analytics funnel trends' },
  { name: 'WP Media', href: '/admin/wp-media', icon: Clapperboard, keywords: 'whatsapp media cloudinary youtube assets' },
  { name: 'Events', href: '/admin/events', icon: Calendar, keywords: 'calendar' },
  { name: 'Gallery', href: '/admin/gallery', icon: Images, keywords: 'images pictures portfolio' },
  { name: 'Venues', href: '/admin/collaborations', icon: Handshake, keywords: 'partners venues collaborations' },
  { name: 'Manage Videos', href: '/admin/media', icon: Film, keywords: 'videos hero reels' },
  { name: 'Background Images', href: '/admin/background-images', icon: ImagePlus, keywords: 'background cloudinary images' },
  { name: 'Albums', href: '/admin/albums', icon: FolderOpen, keywords: 'photos folders' },
  { name: 'Services', href: '/admin/services', icon: Wrench, keywords: 'offerings' },
  { name: 'Why Choose Us', href: '/admin/why-us', icon: Award, keywords: 'why us stats reasons' },
  { name: 'Testimonials', href: '/admin/testimonials', icon: MessageSquareQuote, keywords: 'reviews quotes' },
  { name: 'Notifications', href: '/admin/notifications', icon: Mail, keywords: 'messages contact inquiries alerts' },
  { name: 'Team', href: '/admin/team', icon: Users, keywords: 'staff employees' },
  { name: 'Site Content', href: '/admin/content', icon: FileText, keywords: 'content pages' },
  { name: 'Settings', href: '/admin/settings', icon: Settings, keywords: 'config' },
];
