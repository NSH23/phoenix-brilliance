import { getTeamStats } from '@/services/team';
import { getRecentAlbumMedia } from '@/services/albums';
import { supabase } from '@/lib/supabase';

const startOfThisMonth = () => {
  const n = new Date();
  return new Date(n.getFullYear(), n.getMonth(), 1);
};

export interface DashboardStats {
  events: { total: number; thisMonth: number };
  albums: { total: number; thisMonth: number };
  galleryImages: { total: number; thisMonth: number };
  inquiries: { total: number; new: number };
  team: { total: number; active: number; thisMonth: number };
}

export interface RecentInquiry {
  id: string;
  name: string;
  event: string;
  date: string;
  status: string;
}

export interface RecentActivity {
  id: string;
  action: string;
  target: string;
  time: string;
  sortKey: string;
}

export interface SiteOverview {
  eventTypes: number;
  albums: number;
  partners: number;
  testimonials: number;
  services: number;
  employees: number;
}

async function getTableCount(table: string): Promise<number> {
  const { count, error } = await supabase
    .from(table)
    .select('*', { count: 'exact', head: true });
  if (error) throw error;
  return count ?? 0;
}

export function relativeTime(dateStr: string): string {
  const d = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} min ago`;
  if (diffHours < 24) return `${diffHours} hours ago`;
  if (diffDays === 1) return '1 day ago';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  return d.toLocaleDateString();
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const start = startOfThisMonth().toISOString();
  const [
    eventsTotal,
    eventsThisMonth,
    albumsTotal,
    albumsThisMonth,
    galleryTotal,
    galleryThisMonth,
    inquiriesTotal,
    inquiriesNew,
    teamStats,
  ] = await Promise.all([
    getTableCount('events'),
    supabase.from('events').select('*', { count: 'exact', head: true }).gte('created_at', start).then(({ count, error }) => {
      if (error) throw error;
      return count ?? 0;
    }),
    getTableCount('event_albums'),
    supabase.from('event_albums').select('*', { count: 'exact', head: true }).gte('created_at', start).then(({ count, error }) => {
      if (error) throw error;
      return count ?? 0;
    }),
    getTableCount('gallery'),
    supabase.from('gallery').select('*', { count: 'exact', head: true }).gte('created_at', start).then(({ count, error }) => {
      if (error) throw error;
      return count ?? 0;
    }),
    getTableCount('inquiries'),
    supabase.from('inquiries').select('*', { count: 'exact', head: true }).eq('status', 'new').then(({ count, error }) => {
      if (error) throw error;
      return count ?? 0;
    }),
    getTeamStats().catch(() => ({ total: 0, active: 0, thisMonth: 0 })),
  ]);

  return {
    events: {
      total: eventsTotal,
      thisMonth: eventsThisMonth,
    },
    albums: {
      total: albumsTotal,
      thisMonth: albumsThisMonth,
    },
    galleryImages: {
      total: galleryTotal,
      thisMonth: galleryThisMonth,
    },
    inquiries: {
      total: inquiriesTotal,
      new: inquiriesNew,
    },
    team: {
      total: teamStats.total,
      active: teamStats.active,
      thisMonth: teamStats.thisMonth,
    },
  };
}

export async function getRecentInquiries(limit = 4): Promise<RecentInquiry[]> {
  const { data, error } = await supabase
    .from('inquiries')
    .select('id, name, event_type, status, created_at, message')
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  const rows = data || [];
  return rows.map((i) => ({
    id: i.id,
    name: i.name,
    event: i.event_type || 'General',
    date: relativeTime(i.created_at),
    status: i.status,
  }));
}

export async function getRecentActivity(limit = 5): Promise<RecentActivity[]> {
  const items: RecentActivity[] = [];

  // Albums: "New album created"
  const { data: albums } = await supabase
    .from('event_albums')
    .select('id, title, created_at')
    .order('created_at', { ascending: false })
    .limit(5);
  (albums || []).forEach((a) => {
    items.push({
      id: `album-${a.id}`,
      action: 'New album created',
      target: a.title,
      time: relativeTime(a.created_at),
      sortKey: a.created_at,
    });
  });

  // Album media: "Image added to [Album]"
  try {
    const media = await getRecentAlbumMedia(5);
    media.forEach((m) => {
      const title = m.event_albums?.title || 'Unknown album';
      items.push({
        id: `media-${m.id}`,
        action: 'Image added to album',
        target: title,
        time: relativeTime(m.created_at),
        sortKey: m.created_at,
      });
    });
  } catch {
    // ignore
  }

  // Testimonials: "Testimonial added"
  const { data: testimonials } = await supabase
    .from('testimonials')
    .select('id, name, created_at')
    .order('created_at', { ascending: false })
    .limit(5);
  (testimonials || []).forEach((t) => {
    items.push({
      id: `testimonial-${t.id}`,
      action: 'Testimonial added',
      target: t.name,
      time: relativeTime(t.created_at),
      sortKey: t.created_at,
    });
  });

  // Events: "Event updated"
  const { data: events } = await supabase
    .from('events')
    .select('id, title, updated_at')
    .order('updated_at', { ascending: false })
    .limit(5);
  (events || []).forEach((e) => {
    items.push({
      id: `event-${e.id}`,
      action: 'Event updated',
      target: e.title,
      time: relativeTime(e.updated_at),
      sortKey: e.updated_at,
    });
  });

  items.sort((a, b) => (b.sortKey > a.sortKey ? 1 : -1));
  return items.slice(0, limit);
}

export async function getSiteOverview(): Promise<SiteOverview> {
  const [events, albums, partners, testimonials, services, teamStats] = await Promise.all([
    getTableCount('events'),
    getTableCount('event_albums'),
    getTableCount('collaborations'),
    getTableCount('testimonials'),
    getTableCount('services'),
    getTeamStats().catch(() => ({ total: 0 })),
  ]);

  return {
    eventTypes: events,
    albums,
    partners,
    testimonials,
    services,
    employees: teamStats.total,
  };
}

export async function getDashboardData() {
  const [stats, recentInquiries, recentActivity, siteOverview] = await Promise.all([
    getDashboardStats(),
    getRecentInquiries(4),
    getRecentActivity(5),
    getSiteOverview(),
  ]);
  return { stats, recentInquiries, recentActivity, siteOverview };
}
