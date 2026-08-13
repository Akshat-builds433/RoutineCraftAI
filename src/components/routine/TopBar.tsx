import { Activity, Settings, Sparkles } from "lucide-react";
import type { AgentStatus, LatencyMetrics } from "@/types/routine";
import { Button } from "@/components/ui/button";
import { ThemePicker } from "./ThemePicker";
import type { ThemeId } from "@/lib/themes";

const STATUS_LABEL: Record<AgentStatus, string> = {
  idle: "Idle",
  listening: "Listening",
  analyzing: "Analyzing Routine",
  speaking: "Speaking",
  interrupted: "Interrupted",
};

const STATUS_COLOR: Record<AgentStatus, string> = {
  idle: "bg-muted-foreground",
  listening: "bg-primary",
  analyzing: "bg-accent",
  speaking: "bg-emerald-400",
  interrupted: "bg-destructive",
};

interface Props {
  status: AgentStatus;
  metrics: LatencyMetrics;
  onOpenSettings: () => void;
  theme: ThemeId;
  onThemeChange: (theme: ThemeId) => void;
}

function Metric({ label, value }: { label: string; value: number | null }) {
  return (
    <div className="flex items-baseline gap-1 rounded-md border border-border/60 bg-card/60 px-2 py-1">
      <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
      <span className="font-mono text-xs text-foreground">
        {value === null ? "—" : `${value}ms`}
      </span>
    </div>
  );
}

export function TopBar({
  status,
  metrics,
  onOpenSettings,
  theme,
  onThemeChange,
}: Props) {
  return (
    <header className="sticky top-0 z-30 border-b border-border/60 bg-background/85 backdrop-blur">
      <div className="mx-auto flex max-w-[1600px] flex-wrap items-center gap-3 px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/15 text-primary">
            <Sparkles className="h-5 w-5" />
          </span>
          <div className="leading-tight">
            <h1 className="text-sm font-semibold tracking-tight">RoutineCraft AI</h1>
            <p className="text-[11px] text-muted-foreground">
              Voice &amp; text student routine coach
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 rounded-full border border-border/60 bg-card/60 px-3 py-1.5">
          <span
            className={`h-2 w-2 rounded-full ${STATUS_COLOR[status]} ${
              status === "idle" ? "" : "animate-pulse"
            }`}
          />
          <span className="text-xs font-medium">{STATUS_LABEL[status]}</span>
        </div>

        <div className="ml-auto flex flex-wrap items-center gap-2">
          <Activity className="h-4 w-4 text-muted-foreground" />
          <Metric label="STT" value={metrics.stt} />
          <Metric label="LLM" value={metrics.llmFirstToken} />
          <Metric label="TTFA" value={metrics.ttfa} />
          <Metric label="Qdrant" value={metrics.qdrant} />
          <ThemePicker theme={theme} onChange={onThemeChange} />
          <Button variant="outline" size="sm" onClick={onOpenSettings}>
            <Settings className="mr-1.5 h-4 w-4" />
            Keys
          </Button>
        </div>
      </div>
    </header>
  );
}
