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
} from 'lucide-react';

export interface AdminMenuItem {
  name: string;
  href: string;
  icon: LucideIcon;
  keywords?: string;
}

export const ADMIN_MENU_ITEMS: AdminMenuItem[] = [
  { name: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard, keywords: 'home overview' },
  { name: 'Events', href: '/admin/events', icon: Calendar, keywords: 'calendar' },
  { name: 'Albums', href: '/admin/albums', icon: FolderOpen, keywords: 'photos folders' },
  { name: 'Gallery', href: '/admin/gallery', icon: Images, keywords: 'images pictures portfolio' },
  { name: 'Before & After', href: '/admin/before-after', icon: ImagePlus, keywords: 'comparison slider' },
  { name: 'Services', href: '/admin/services', icon: Wrench, keywords: 'offerings' },
  { name: 'Collaborations', href: '/admin/collaborations', icon: Handshake, keywords: 'partners' },
  { name: 'Team', href: '/admin/team', icon: Users, keywords: 'staff employees' },
  { name: 'Testimonials', href: '/admin/testimonials', icon: MessageSquareQuote, keywords: 'reviews quotes' },
  { name: 'Inquiries', href: '/admin/inquiries', icon: Mail, keywords: 'messages contact' },
  { name: 'Site Content', href: '/admin/content', icon: FileText, keywords: 'content pages' },
  { name: 'Why Choose Us', href: '/admin/why-us', icon: Award, keywords: 'why choose' },
  { name: 'Manage Videos', href: '/admin/media', icon: Film, keywords: 'videos hero reels' },
  { name: 'Settings', href: '/admin/settings', icon: Settings, keywords: 'config' },
];
