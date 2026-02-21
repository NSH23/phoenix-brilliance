import { getActiveCollaborations } from '@/services/collaborations';
import { getActiveEvents } from '@/services/events';

/** Default venue list when no collaborations exist (matches your partner venues). */
export const DEFAULT_VENUES = [
  'Sky Blue Banquet Hall',
  'Thopate Banquets',
  'Blue Water Banquet Hall',
  'RamKrishna Veg Resto & Banquet',
  'Shree Krishna Palace | Pure Veg',
  'RAGHUNANDAN AC BANQUET & Lawns',
  'Rangoli Banquet Hall',
];

/** Default event types when no events exist. */
export const DEFAULT_EVENT_TYPES = [
  'Wedding',
  'Birthday',
  'Engagement',
  'Corporate',
  'Anniversary',
];

const OTHER_LABEL = 'Other';

/** Option that means user has not booked a venue; show all collaborations. */
export const NOT_BOOKED_VENUE = 'Not booked venue';

/**
 * Venue options synced with collaborations: active collaboration names first,
 * then default list if none, then "Not booked venue", then "Other".
 */
export async function getVenueOptions(): Promise<string[]> {
  try {
    const collaborations = await getActiveCollaborations();
    const names = collaborations.map((c) => c.name).filter(Boolean);
    if (names.length > 0) {
      const unique = Array.from(new Set(names));
      return [...unique, NOT_BOOKED_VENUE, OTHER_LABEL];
    }
  } catch {
    // fallback to default
  }
  return [...DEFAULT_VENUES, NOT_BOOKED_VENUE, OTHER_LABEL];
}

/**
 * Event type options synced with events: active event titles first,
 * then default list if none, always ending with "Other".
 */
export async function getEventTypeOptions(): Promise<string[]> {
  try {
    const events = await getActiveEvents();
    const titles = events.map((e) => e.title).filter(Boolean);
    if (titles.length > 0) {
      const unique = Array.from(new Set(titles));
      return unique.includes(OTHER_LABEL) ? unique : [...unique, OTHER_LABEL];
    }
  } catch {
    // fallback to default
  }
  return [...DEFAULT_EVENT_TYPES, OTHER_LABEL];
}
