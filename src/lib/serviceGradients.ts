/** Gradient pairs [from, to] for service card icons - maps by title keywords or index */
const GRADIENT_PAIRS: [string, string][] = [
  ["#667eea", "#764ba2"], // Event Planning
  ["#f093fb", "#f5576c"], // Decoration
  ["#FFD93D", "#FF9800"], // Stage & Lighting
  ["#FF6B9D", "#C44569"], // Sound & DJ
  ["#4ECDC4", "#44A08D"], // Photography
  ["#95E1D3", "#38A89D"], // Catering
  ["#F38181", "#CE5A6F"], // Entertainment
  ["#6C5CE7", "#5B4FDB"], // Corporate
  ["#A8E6CF", "#3EECAC"], // Custom Themes
];

const TITLE_KEYWORDS: Record<string, number> = {
  planning: 0,
  management: 0,
  decoration: 1,
  design: 1,
  stage: 2,
  lighting: 2,
  sound: 3,
  dj: 3,
  music: 3,
  photography: 4,
  video: 4,
  catering: 5,
  food: 5,
  entertainment: 6,
  artist: 6,
  corporate: 7,
  branding: 7,
  theme: 8,
  custom: 8,
};

export function getServiceGradient(title: string, index: number): string {
  const key = title.toLowerCase();
  for (const [kw, i] of Object.entries(TITLE_KEYWORDS)) {
    if (key.includes(kw)) return `linear-gradient(135deg, ${GRADIENT_PAIRS[i][0]} 0%, ${GRADIENT_PAIRS[i][1]} 100%)`;
  }
  const pair = GRADIENT_PAIRS[index % GRADIENT_PAIRS.length];
  return `linear-gradient(135deg, ${pair[0]} 0%, ${pair[1]} 100%)`;
}

export function getServiceAccentColor(title: string, index: number): string {
  const key = title.toLowerCase();
  for (const [kw, i] of Object.entries(TITLE_KEYWORDS)) {
    if (key.includes(kw)) return GRADIENT_PAIRS[i][0];
  }
  return GRADIENT_PAIRS[index % GRADIENT_PAIRS.length][0];
}
