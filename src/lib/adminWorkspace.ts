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
  Cog,
} from 'lucide-react';

export type AdminWorkspace = 'website' | 'wp';

export interface AdminMenuItem {
  name: string;
  href: string;
  icon: LucideIcon;
  keywords?: string;
}

/** Main site CMS: events, content, account settings, inquiries. */
export const ADMIN_WEBSITE_MENU_ITEMS: AdminMenuItem[] = [
  { name: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard, keywords: 'home overview website' },
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
  { name: 'Settings', href: '/admin/settings', icon: Settings, keywords: 'config account profile' },
];

/** WhatsApp / WP agent tools only. */
export const ADMIN_WP_MENU_ITEMS: AdminMenuItem[] = [
  { name: 'WP overview', href: '/admin/wp-dashboard', icon: LayoutDashboard, keywords: 'wp agent home whatsapp dashboard' },
  { name: 'WP Leads', href: '/admin/wp-leads', icon: MessageCircleMore, keywords: 'whatsapp leads pipeline agent' },
  { name: 'WP Analytics', href: '/admin/wp-analytics', icon: ChartColumn, keywords: 'whatsapp analytics funnel trends' },
  { name: 'WP Media', href: '/admin/wp-media', icon: Clapperboard, keywords: 'whatsapp media cloudinary youtube assets' },
  { name: 'WP alerts', href: '/admin/wp-alerts', icon: Mail, keywords: 'wp notifications whatsapp alerts' },
  { name: 'WP settings', href: '/admin/wp-settings', icon: Cog, keywords: 'whatsapp agent config module sla' },
];

const WP_PATHS = new Set([
  '/admin/wp-dashboard',
  '/admin/wp-leads',
  '/admin/wp-analytics',
  '/admin/wp-media',
  '/admin/wp-settings',
  '/admin/wp-alerts',
]);

/** Treat WP alerts screen as WP workspace (URL is /admin/notifications?tab=wp after redirect). */
export function getAdminWorkspace(pathname: string, search: string = ''): AdminWorkspace {
  if (pathname === '/admin/notifications' && /(?:^|[?&])tab=wp(?:&|$)/.test(search)) {
    return 'wp';
  }
  const base = pathname.split('?')[0] ?? pathname;
  if (WP_PATHS.has(base)) return 'wp';
  return 'website';
}

/** Cmd+K search: all destinations in one list. */
export const ADMIN_COMMAND_PALETTE_ITEMS: AdminMenuItem[] = [
  ...ADMIN_WEBSITE_MENU_ITEMS,
  ...ADMIN_WP_MENU_ITEMS,
];

/** @deprecated Prefer ADMIN_COMMAND_PALETTE_ITEMS or workspace-specific lists */
export const ADMIN_MENU_ITEMS = ADMIN_COMMAND_PALETTE_ITEMS;
