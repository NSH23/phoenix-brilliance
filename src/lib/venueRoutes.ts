export const VENUES_LIST_PATH = '/venues';

export function venueDetailPath(venueId: string): string {
  return `${VENUES_LIST_PATH}/${venueId}`;
}
