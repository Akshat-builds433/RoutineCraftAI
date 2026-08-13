import { useMemo, useState } from "react";
import { Pencil, Trash2, CalendarDays } from "lucide-react";
import type { BlockCategory, DayName, TimeBlock } from "@/types/routine";
import { DAYS } from "@/types/routine";
import { CATEGORY_STYLES } from "@/lib/routine";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface Props {
  blocks: TimeBlock[];
  onUpdate: (block: TimeBlock) => void;
  onDelete: (id: string) => void;
}

const CATEGORIES: BlockCategory[] = [
  "study",
  "class",
  "rest",
  "exercise",
  "meal",
  "commute",
  "leisure",
  "work",
];

export function TimetableGrid({ blocks, onUpdate, onDelete }: Props) {
  const [day, setDay] = useState<DayName | "All">("All");
  const [category, setCategory] = useState<BlockCategory | "all">("all");
  const [editingId, setEditingId] = useState<string | null>(null);

  const visible = useMemo(
    () =>
      blocks.filter(
        (b) =>
          (day === "All" || b.day === day) &&
          (category === "all" || b.category === category),
      ),
    [blocks, day, category],
  );

  const grouped = useMemo(() => {
    const map = new Map<DayName, TimeBlock[]>();
    for (const b of visible) {
      const list = map.get(b.day) ?? [];
      list.push(b);
      map.set(b.day, list);
    }
    return [...map.entries()].sort(
      (a, b) => DAYS.indexOf(a[0]) - DAYS.indexOf(b[0]),
    );
  }, [visible]);

  return (
    <section className="rounded-xl border border-border/60 bg-card/50 p-4">
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <h2 className="mr-auto flex items-center gap-2 text-sm font-semibold">
          <CalendarDays className="h-4 w-4 text-primary" />
          Interactive Timetable
        </h2>
        <div className="flex flex-wrap gap-1">
          {(["All", ...DAYS] as const).map((d) => (
            <button
              key={d}
              onClick={() => setDay(d)}
              className={`rounded-md px-2 py-1 text-[11px] transition-colors ${
                day === d
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:text-foreground"
              }`}
            >
              {d === "All" ? "All" : d.slice(0, 3)}
            </button>
          ))}
        </div>
      </div>

      <div className="mb-4 flex flex-wrap gap-1">
        {(["all", ...CATEGORIES] as const).map((c) => (
          <button
            key={c}
            onClick={() => setCategory(c)}
            className={`rounded-full border px-2.5 py-0.5 text-[11px] capitalize transition-opacity ${
              c === "all"
                ? "border-border bg-muted text-muted-foreground"
                : CATEGORY_STYLES[c]
            } ${category === c ? "opacity-100 ring-1 ring-ring" : "opacity-85"}`}
          >
            {c}
          </button>
        ))}
      </div>

      {grouped.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border/60 p-8 text-center text-sm text-muted-foreground">
          No blocks yet. Describe your day by voice or text and RoutineCraft will
          build your schedule.
        </p>
      ) : (
        <div className="space-y-5">
          {grouped.map(([dayName, dayBlocks]) => (
            <div key={dayName}>
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {dayName}
              </h3>
              <div className="space-y-2">
                {dayBlocks.map((block) => (
                  <div
                    key={block.id}
                    className={`rounded-lg border p-3 ${CATEGORY_STYLES[block.category]}`}
                  >
                    {editingId === block.id ? (
                      <div className="flex flex-wrap items-center gap-2">
                        <Input
                          className="h-8 w-36"
                          defaultValue={block.time}
                          onBlur={(e) =>
                            onUpdate({ ...block, time: e.target.value })
                          }
                        />
                        <Input
                          className="h-8 flex-1"
                          defaultValue={block.activity}
                          onBlur={(e) =>
                            onUpdate({ ...block, activity: e.target.value })
                          }
                        />
                        <select
                          className="h-8 rounded-md border border-input bg-background px-2 text-xs text-foreground"
                          defaultValue={block.category}
                          onChange={(e) =>
                            onUpdate({
                              ...block,
                              category: e.target.value as BlockCategory,
                            })
                          }
                        >
                          {CATEGORIES.map((c) => (
                            <option key={c} value={c}>
                              {c}
                            </option>
                          ))}
                        </select>
                        <Button size="sm" onClick={() => setEditingId(null)}>
                          Done
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-xs opacity-90">
                          {block.time}
                        </span>
                        <span className="flex-1 text-sm font-medium">
                          {block.activity}
                        </span>
                        <span className="rounded bg-background/40 px-1.5 py-0.5 text-[10px] uppercase tracking-wide">
                          {block.energyLevel} energy
                        </span>
                        <button
                          aria-label="Edit block"
                          onClick={() => setEditingId(block.id)}
                          className="opacity-70 hover:opacity-100"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button
                          aria-label="Delete block"
                          onClick={() => onDelete(block.id)}
                          className="opacity-70 hover:opacity-100"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
