import { Circle, Flame, Coffee, Sparkles, Moon, Leaf } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type ThemeId =
  | "minimal"
  | "energetic"
  | "cozy"
  | "playful"
  | "dark"
  | "nature";

export interface ThemeDef {
  id: ThemeId;
  label: string;
  vibe: string;
  icon: LucideIcon;
  swatch: string[];
}

export const THEMES: ThemeDef[] = [
  {
    id: "minimal",
    label: "Minimal",
    vibe: "Clean, quiet, distraction-free",
    icon: Circle,
    swatch: ["oklch(0.98 0.002 250)", "oklch(0.35 0.01 258)", "oklch(0.55 0.03 250)"],
  },
  {
    id: "energetic",
    label: "Energetic",
    vibe: "Bright orange push to get moving",
    icon: Flame,
    swatch: ["oklch(0.98 0.015 80)", "oklch(0.65 0.21 32)", "oklch(0.72 0.18 60)"],
  },
  {
    id: "cozy",
    label: "Cozy",
    vibe: "Warm clay and soft evening light",
    icon: Coffee,
    swatch: ["oklch(0.96 0.018 70)", "oklch(0.55 0.11 45)", "oklch(0.66 0.09 25)"],
  },
  {
    id: "playful",
    label: "Playful",
    vibe: "Rounded shapes, candy pink and cyan",
    icon: Sparkles,
    swatch: ["oklch(0.98 0.02 320)", "oklch(0.68 0.2 340)", "oklch(0.72 0.16 200)"],
  },
  {
    id: "dark",
    label: "Dark Mode",
    vibe: "Deep slate with emerald focus",
    icon: Moon,
    swatch: ["oklch(0.15 0.012 258)", "oklch(0.75 0.16 163)", "oklch(0.66 0.16 275)"],
  },
  {
    id: "nature",
    label: "Nature",
    vibe: "Forest greens and calm water",
    icon: Leaf,
    swatch: ["oklch(0.97 0.02 140)", "oklch(0.52 0.12 150)", "oklch(0.66 0.11 195)"],
  },
];

export const THEME_STORAGE_KEY = "routinecraft.theme";
export const DEFAULT_THEME: ThemeId = "dark";

export function applyTheme(id: ThemeId) {
  const root = document.documentElement;
  for (const theme of THEMES) root.classList.remove(`theme-${theme.id}`);
  root.classList.add(`theme-${id}`);
}
