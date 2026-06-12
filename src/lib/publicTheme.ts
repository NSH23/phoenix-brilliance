export type PublicTheme = "light" | "blush" | "dark";

export type PublicThemeOption = {
  id: PublicTheme;
  label: string;
  description: string;
};

export const PUBLIC_THEME_OPTIONS: PublicThemeOption[] = [
  { id: "light", label: "Heritage", description: "Warm linen & wine" },
  { id: "blush", label: "Blush", description: "Premium rose & cream" },
  { id: "dark", label: "Navy", description: "Dark luxury" },
];

export function isPublicTheme(value: string | null): value is PublicTheme {
  return value === "light" || value === "blush" || value === "dark";
}

export function getActivePublicTheme(): PublicTheme {
  if (typeof document === "undefined") return "light";
  const root = document.documentElement;
  if (root.classList.contains("dark")) return "dark";
  if (root.classList.contains("blush")) return "blush";
  return "light";
}

export function getStoredPublicTheme(): PublicTheme {
  if (typeof window === "undefined") return "light";
  const saved = localStorage.getItem("theme");
  if (isPublicTheme(saved)) return saved;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function applyPublicTheme(theme: PublicTheme): void {
  const root = document.documentElement;
  root.classList.remove("dark", "blush");
  if (theme === "dark") root.classList.add("dark");
  else if (theme === "blush") root.classList.add("blush");
  localStorage.setItem("theme", theme);
}

export function isDarkPublicTheme(theme: PublicTheme = getActivePublicTheme()): boolean {
  return theme === "dark";
}

export function subscribePublicTheme(onChange: (theme: PublicTheme) => void): () => void {
  const observer = new MutationObserver(() => onChange(getActivePublicTheme()));
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["class"],
  });
  return () => observer.disconnect();
}
