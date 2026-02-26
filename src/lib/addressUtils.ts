/**
 * Show only the last part of an address on cards (e.g. "VijayNagar, Pimpri-Chinchwad, Maharashtra 411033").
 * Full address is shown on the collaboration detail page.
 */
export function shortLocationForCard(fullAddress: string | null | undefined): string {
  if (!fullAddress || !fullAddress.trim()) return "Partner Venue";
  const trimmed = fullAddress.trim();
  // If multi-line, take the last line (often the area/city/state line)
  const lines = trimmed.split(/\r?\n/).map((s) => s.trim()).filter(Boolean);
  const lastLine = lines.length > 0 ? lines[lines.length - 1] : trimmed;
  // If comma-separated, take last 3 segments for "Area, City, State Pincode" style
  const parts = lastLine.split(",").map((s) => s.trim()).filter(Boolean);
  if (parts.length <= 3) return lastLine;
  return parts.slice(-3).join(", ");
}
