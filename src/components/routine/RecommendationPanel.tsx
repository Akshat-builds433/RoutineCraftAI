import { AlertTriangle, BatteryCharging, Brain, Info, Moon, Target } from "lucide-react";
import type { BalanceScores, Recommendation } from "@/types/routine";

interface Props {
  scores: BalanceScores | null;
  recommendations: Recommendation[];
}

function ScoreBar({
  label,
  value,
  invert,
}: {
  label: string;
  value: number;
  invert?: boolean;
}) {
  const good = invert ? 100 - value : value;
  const color =
    good >= 70 ? "bg-emerald-400" : good >= 40 ? "bg-amber-400" : "bg-destructive";
  return (
    <div>
      <div className="mb-1 flex items-baseline justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-mono font-semibold text-foreground">{value}</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-muted">
        <div
          className={`h-full rounded-full transition-all duration-500 ${color}`}
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}

const ICONS = {
  sleep: Moon,
  cognitive: Brain,
  deepwork: Target,
  balance: BatteryCharging,
  general: Info,
} as const;

const SEVERITY = {
  info: "border-border/60",
  warning: "border-amber-500/50",
  critical: "border-destructive/60",
} as const;

export function RecommendationPanel({ scores, recommendations }: Props) {
  return (
    <section className="space-y-4">
      <div className="rounded-xl border border-border/60 bg-card/50 p-4">
        <h2 className="mb-3 text-sm font-semibold">Balance Index</h2>
        {scores ? (
          <div className="space-y-3">
            <ScoreBar label="Academic Balance" value={scores.academicBalance} />
            <ScoreBar label="Rest Quality" value={scores.rest} />
            <ScoreBar label="Burnout Risk" value={scores.burnoutRisk} invert />
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            Scores appear after your first routine analysis.
          </p>
        )}
      </div>

      <div className="rounded-xl border border-border/60 bg-card/50 p-4">
        <h2 className="mb-3 text-sm font-semibold">
          AI Productivity Recommendations
        </h2>
        {recommendations.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Share your classes, sleep hours and study goals to get targeted advice
            on sleep alignment, cognitive load and deep work.
          </p>
        ) : (
          <ul className="space-y-2">
            {recommendations.map((rec) => {
              const Icon = ICONS[rec.type] ?? Info;
              return (
                <li
                  key={rec.id}
                  className={`rounded-lg border bg-background/40 p-3 ${SEVERITY[rec.severity]}`}
                >
                  <div className="flex items-center gap-2">
                    {rec.severity === "critical" ? (
                      <AlertTriangle className="h-4 w-4 text-destructive" />
                    ) : (
                      <Icon className="h-4 w-4 text-primary" />
                    )}
                    <h3 className="text-sm font-medium">{rec.title}</h3>
                  </div>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                    {rec.detail}
                  </p>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </section>
  );
}
