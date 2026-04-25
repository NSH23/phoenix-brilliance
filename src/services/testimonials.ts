import { supabase } from '@/lib/supabase';
import { resolvePublicStorageUrl } from '@/services/storage';

function normalizeTestimonialRow(row: Testimonial): Testimonial {
  if (!row.avatar_url?.trim()) return row;
  return {
    ...row,
    avatar_url: resolvePublicStorageUrl(row.avatar_url, 'testimonial-avatars'),
  };
}

function mapLegacyAvatarField<T extends Record<string, unknown>>(row: T): Testimonial {
  const avatar = (row.avatar_url as string | null | undefined) ?? (row.avatar as string | null | undefined) ?? '';
  return {
    ...(row as unknown as Testimonial),
    avatar_url: avatar || undefined,
  };
}

export interface Testimonial {
  id: string;
  name: string;
  role: string;
  content: string;
  rating: number;
  avatar_url?: string;
  created_at: string;
  event_type?: string;
  is_featured?: boolean;
  display_order?: number;
}
const TESTIMONIAL_COLUMNS_PRIMARY = 'id, name, role, content, rating, avatar_url, created_at, event_type, is_featured, display_order';
const TESTIMONIAL_COLUMNS_LEGACY = 'id, name, role, content, rating, avatar, created_at, event_type, is_featured, display_order';
const AVATAR_URL_MISSING = /avatar_url/i;
let testimonialsSchemaMode: 'unknown' | 'primary' | 'legacy' = 'unknown';

async function resolveTestimonialsSchemaMode(): Promise<'primary' | 'legacy'> {
  if (testimonialsSchemaMode !== 'unknown') return testimonialsSchemaMode;

  const probe = await supabase
    .from('testimonials')
    .select('id, avatar_url')
    .limit(1);

  if (!probe.error) {
    testimonialsSchemaMode = 'primary';
    return testimonialsSchemaMode;
  }

  if (AVATAR_URL_MISSING.test(probe.error.message || '')) {
    testimonialsSchemaMode = 'legacy';
    return testimonialsSchemaMode;
  }

  throw probe.error;
}

function columnsForMode(mode: 'primary' | 'legacy'): string {
  return mode === 'primary' ? TESTIMONIAL_COLUMNS_PRIMARY : TESTIMONIAL_COLUMNS_LEGACY;
}

type TestimonialsQueryResult = {
  data: Record<string, unknown>[] | null;
  error: { message?: string } | null;
  count?: number | null;
};

async function selectTestimonialsWithFallback(
  build: (columns: string) => PromiseLike<TestimonialsQueryResult>
): Promise<{ data: Testimonial[]; count?: number }> {
  const mode = await resolveTestimonialsSchemaMode();
  const result = await build(columnsForMode(mode));
  if (result.error) throw result.error;
  return {
    data: ((result.data || []) as Record<string, unknown>[]).map(mapLegacyAvatarField).map(normalizeTestimonialRow),
    count: result.count ?? undefined,
  };
}

async function insertTestimonialWithFallback(payload: Record<string, unknown>) {
  const mode = await resolveTestimonialsSchemaMode();
  const outgoing = { ...payload };
  if (mode === 'legacy') {
    outgoing.avatar = outgoing.avatar_url;
    delete outgoing.avatar_url;
  }
  const result = await supabase
    .from('testimonials')
    .insert([outgoing])
    .select(columnsForMode(mode))
    .single();
  if (result.error) throw result.error;
  return normalizeTestimonialRow(mapLegacyAvatarField(result.data as Record<string, unknown>));
}

async function updateTestimonialWithFallback(id: string, updates: Record<string, unknown>) {
  const mode = await resolveTestimonialsSchemaMode();
  const outgoing = { ...updates };
  if (mode === 'legacy' && Object.prototype.hasOwnProperty.call(outgoing, 'avatar_url')) {
    outgoing.avatar = outgoing.avatar_url;
    delete outgoing.avatar_url;
  }
  const result = await supabase
    .from('testimonials')
    .update(outgoing)
    .eq('id', id)
    .select(columnsForMode(mode))
    .single();
  if (result.error) throw result.error;
  return normalizeTestimonialRow(mapLegacyAvatarField(result.data as Record<string, unknown>));
}

// Get all testimonials
export async function getAllTestimonials() {
  const { data } = await selectTestimonialsWithFallback((columns) =>
    supabase
      .from('testimonials')
      .select(columns)
      .order('display_order', { ascending: true })
      .order('rating', { ascending: false })
      .range(0, 49)
  );
  return data;
}

export async function getAdminTestimonialsPage(params: {
  page: number;
  pageSize: number;
  searchQuery?: string;
  eventType?: string;
}) {
  const { page, pageSize, searchQuery, eventType } = params;
  const from = Math.max(0, page) * pageSize;
  const to = from + pageSize - 1;
  const term = (searchQuery ?? '').trim();
  const { data, count } = await selectTestimonialsWithFallback((columns) => {
    let query = supabase
      .from('testimonials')
      .select(columns, { count: 'exact' })
      .order('display_order', { ascending: true })
      .order('rating', { ascending: false });
    if (term) {
      const escaped = term.replace(/,/g, ' ');
      query = query.or(`name.ilike.%${escaped}%,content.ilike.%${escaped}%`);
    }
    if (eventType && eventType !== 'all') {
      query = query.eq('event_type', eventType);
    }
    return query.range(from, to);
  });
  return {
    data,
    total: count ?? 0,
  };
}

// Get featured testimonials
export async function getFeaturedTestimonials(limit = 6) {
  const { data } = await selectTestimonialsWithFallback((columns) =>
    supabase
      .from('testimonials')
      .select(columns)
      .eq('is_featured', true)
      .order('display_order', { ascending: true })
      .order('rating', { ascending: false })
      .limit(limit)
  );
  return data;
}

// Get testimonials by event type
export async function getTestimonialsByEventType(eventType: string) {
  const { data } = await selectTestimonialsWithFallback((columns) =>
    supabase
      .from('testimonials')
      .select(columns)
      .eq('event_type', eventType)
      .order('rating', { ascending: false })
      .order('created_at', { ascending: false })
  );
  return data;
}

// Create testimonial
export async function createTestimonial(testimonial: Omit<Testimonial, 'id' | 'created_at' | 'updated_at'>) {
  return insertTestimonialWithFallback(testimonial as unknown as Record<string, unknown>);
}

// Update testimonial
export async function updateTestimonial(id: string, updates: Partial<Testimonial>) {
  return updateTestimonialWithFallback(id, updates as unknown as Record<string, unknown>);
}

// Delete testimonial
export async function deleteTestimonial(id: string) {
  const { error } = await supabase
    .from('testimonials')
    .delete()
    .eq('id', id);

  if (error) throw error;
}
