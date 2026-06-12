import { Check, Moon, Palette, Sun } from "lucide-react";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  applyPublicTheme,
  getActivePublicTheme,
  getStoredPublicTheme,
  PUBLIC_THEME_OPTIONS,
  subscribePublicTheme,
  type PublicTheme,
} from "@/lib/publicTheme";
import { cn } from "@/lib/utils";

const THEME_ICONS: Record<PublicTheme, typeof Sun> = {
  light: Sun,
  blush: Palette,
  dark: Moon,
};

const THEME_SWATCHES: Record<PublicTheme, string> = {
  light: "bg-[#EDE6DC] ring-[#7A4452]/40",
  blush: "bg-[#FDF2F0] ring-[#C0267A]/50",
  dark: "bg-[#0B1220] ring-primary/30",
};

const ThemeToggle = () => {
  const [theme, setTheme] = useState<PublicTheme>("light");
  const [open, setOpen] = useState(false);

  useEffect(() => {
    applyPublicTheme(getStoredPublicTheme());
    setTheme(getActivePublicTheme());
    return subscribePublicTheme(setTheme);
  }, []);

  const ActiveIcon = THEME_ICONS[theme];

  const selectTheme = (next: PublicTheme) => {
    applyPublicTheme(next);
    setTheme(next);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <motion.button
          type="button"
          className="relative flex h-12 w-12 items-center justify-center rounded-full border border-border/50 bg-card shadow-lg transition-colors duration-300 hover:bg-primary/10"
          whileTap={{ scale: 0.95 }}
          whileHover={{ scale: 1.05 }}
          aria-label="Choose theme"
        >
          <ActiveIcon className="h-5 w-5 text-primary" />
        </motion.button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-64 rounded-2xl p-2">
        <p className="px-2 pb-1 pt-0.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
          Site theme
        </p>
        <div className="flex flex-col gap-1">
          {PUBLIC_THEME_OPTIONS.map((option) => {
            const Icon = THEME_ICONS[option.id];
            const isActive = theme === option.id;
            return (
              <button
                key={option.id}
                type="button"
                onClick={() => selectTheme(option.id)}
                className={cn(
                  "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors",
                  isActive ? "bg-primary/10 text-foreground" : "hover:bg-muted/80 text-foreground",
                )}
              >
                <span
                  className={cn(
                    "flex h-9 w-9 shrink-0 items-center justify-center rounded-full ring-2",
                    THEME_SWATCHES[option.id],
                  )}
                >
                  <Icon className="h-4 w-4 text-foreground/80 dark:text-ivory/90" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-medium">{option.label}</span>
                  <span className="block text-xs text-muted-foreground">{option.description}</span>
                </span>
                {isActive ? <Check className="h-4 w-4 shrink-0 text-primary" /> : null}
              </button>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default ThemeToggle;
