import { Check, Palette } from "lucide-react";
import { THEMES, type ThemeId } from "@/lib/themes";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Props {
  theme: ThemeId;
  onChange: (theme: ThemeId) => void;
}

export function ThemePicker({ theme, onChange }: Props) {
  const active = THEMES.find((t) => t.id === theme) ?? THEMES[0]!;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm">
          <Palette className="mr-1.5 h-4 w-4" />
          {active.label}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel>Choose a theme style</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {THEMES.map((t) => {
          const Icon = t.icon;
          return (
            <DropdownMenuItem
              key={t.id}
              onSelect={() => onChange(t.id)}
              className="gap-2 py-2"
            >
              <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
              <span className="flex-1 leading-tight">
                <span className="block text-sm font-medium">{t.label}</span>
                <span className="block text-[11px] text-muted-foreground">
                  {t.vibe}
                </span>
              </span>
              <span className="flex items-center gap-1">
                {t.swatch.map((c) => (
                  <span
                    key={c}
                    className="h-3 w-3 rounded-full border border-border"
                    style={{ backgroundColor: c }}
                  />
                ))}
              </span>
              {t.id === theme && <Check className="h-4 w-4 text-primary" />}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
