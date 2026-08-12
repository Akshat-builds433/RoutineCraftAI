import type {
  BalanceScores,
  BlockCategory,
  DayName,
  Recommendation,
  RoutinePlan,
  TimeBlock,
} from "@/types/routine";
import { DAYS } from "@/types/routine";

export const SYSTEM_PROMPT = `You are RoutineCraft, an empathetic and highly structured AI academic coach powered by Rime and Qdrant. Speak in a concise, natural tone. When giving voice feedback, keep audio responses under 2 short sentences (under 25 words total) focusing on key timetable changes and tips. Never output raw code, markdown formatting, bullet points, or digits in speech output—spell out numbers. Concurrently, generate structured JSON for the interactive timetable UI.

Output contract (strict):
1. First, the spoken reply as plain prose only (no markdown, no digits).
2. Then, on a new line, a single fenced json block:
\`\`\`json
{"timetable":[{"day":"Monday","time":"08:00 - 09:30","activity":"Deep Study: Physics","category":"study","energyLevel":"high"}],"recommendations":[{"title":"Split marathon block","detail":"Use 50/10 Pomodoro splits.","type":"cognitive","severity":"warning"}],"scores":{"academicBalance":72,"rest":58,"burnoutRisk":35},"summary":"one line"}
\`\`\`
category is one of study|class|rest|exercise|meal|commute|leisure|work. energyLevel is high|medium|low. Always regenerate the FULL timetable for every day you know about, never a partial diff.`;

const FENCE = /```json\s*([\s\S]*?)```/i;

export function splitSpeechAndJson(raw: string): {
  speech: string;
  json: string | null;
} {
  const match = raw.match(FENCE);
  if (match && match[1] !== undefined) {
    return { speech: raw.slice(0, match.index ?? 0).trim(), json: match[1] };
  }
  const start = raw.indexOf("```json");
  if (start >= 0) return { speech: raw.slice(0, start).trim(), json: null };
  return { speech: raw.trim(), json: null };
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

const ENERGIES = ["high", "medium", "low"] as const;

let idCounter = 0;
const nextId = () => `blk_${Date.now().toString(36)}_${idCounter++}`;

interface RawBlock {
  day?: unknown;
  time?: unknown;
  activity?: unknown;
  category?: unknown;
  energyLevel?: unknown;
  note?: unknown;
}
interface RawRec {
  title?: unknown;
  detail?: unknown;
  type?: unknown;
  severity?: unknown;
}
interface RawPlan {
  timetable?: RawBlock[];
  recommendations?: RawRec[];
  scores?: { academicBalance?: unknown; rest?: unknown; burnoutRisk?: unknown };
  summary?: unknown;
}

export function parsePlan(jsonText: string): RoutinePlan | null {
  try {
    const data = JSON.parse(jsonText) as RawPlan;
    const rawBlocks = Array.isArray(data.timetable) ? data.timetable : [];
    const timetable: TimeBlock[] = rawBlocks.map((item) => {
      const category = String(item.category ?? "study") as BlockCategory;
      const day = String(item.day ?? "Monday") as DayName;
      const energy = String(item.energyLevel ?? "medium");
      const block: TimeBlock = {
        id: nextId(),
        day: DAYS.includes(day) ? day : "Monday",
        time: String(item.time ?? "00:00 - 01:00"),
        activity: String(item.activity ?? "Untitled"),
        category: CATEGORIES.includes(category) ? category : "study",
        energyLevel: (ENERGIES as readonly string[]).includes(energy)
          ? (energy as TimeBlock["energyLevel"])
          : "medium",
      };
      if (item.note) block.note = String(item.note);
      return block;
    });

    const rawRecs = Array.isArray(data.recommendations) ? data.recommendations : [];
    const recommendations: Recommendation[] = rawRecs.map((item) => ({
      id: nextId(),
      title: String(item.title ?? "Tip"),
      detail: String(item.detail ?? ""),
      type: (item.type ?? "general") as Recommendation["type"],
      severity: (item.severity ?? "info") as Recommendation["severity"],
    }));

    const s = data.scores ?? {};
    const scores: BalanceScores = {
      academicBalance: clamp(Number(s.academicBalance ?? 50)),
      rest: clamp(Number(s.rest ?? 50)),
      burnoutRisk: clamp(Number(s.burnoutRisk ?? 50)),
    };

    const plan: RoutinePlan = {
      timetable: sortBlocks(timetable),
      recommendations,
      scores,
    };
    if (data.summary) plan.summary = String(data.summary);
    return plan;
  } catch {
    return null;
  }
}

function clamp(n: number) {
  if (!Number.isFinite(n)) return 50;
  return Math.max(1, Math.min(100, Math.round(n)));
}

export function startMinutes(time: string): number {
  const m = time.match(/(\d{1,2}):(\d{2})/);
  if (!m) return 0;
  return Number(m[1]) * 60 + Number(m[2]);
}

export function sortBlocks(blocks: TimeBlock[]): TimeBlock[] {
  return [...blocks].sort(
    (a, b) =>
      DAYS.indexOf(a.day) - DAYS.indexOf(b.day) ||
      startMinutes(a.time) - startMinutes(b.time),
  );
}

/** Clause-based streaming buffer: emit chunks as soon as a clause completes. */
export function extractClauses(buffer: string): { clauses: string[]; rest: string } {
  const clauses: string[] = [];
  let rest = buffer;
  const re = /^([\s\S]*?[,.!?;:])(\s|$)/;
  let guard = 0;
  while (guard++ < 40) {
    const m = rest.match(re);
    if (!m || m[1] === undefined) break;
    const clause = m[1].trim();
    rest = rest.slice(m[0].length);
    const last = clauses[clauses.length - 1];
    if (clause.split(/\s+/).length >= 3 || clause.length > 18 || last === undefined) {
      clauses.push(clause);
    } else {
      clauses[clauses.length - 1] = `${last} ${clause}`;
    }
  }
  return { clauses, rest };
}

const ONES = [
  "zero","one","two","three","four","five","six","seven","eight","nine","ten",
  "eleven","twelve","thirteen","fourteen","fifteen","sixteen","seventeen","eighteen","nineteen",
];
const TENS = ["", "", "twenty","thirty","forty","fifty","sixty","seventy","eighty","ninety"];

export function numberToWords(n: number): string {
  if (!Number.isFinite(n)) return "";
  if (n < 20) return ONES[n] ?? String(n);
  if (n < 100)
    return `${TENS[Math.floor(n / 10)] ?? ""}${n % 10 ? ` ${ONES[n % 10]}` : ""}`;
  if (n < 1000)
    return `${ONES[Math.floor(n / 100)] ?? ""} hundred${
      n % 100 ? ` ${numberToWords(n % 100)}` : ""
    }`;
  return String(n)
    .split("")
    .map((d) => ONES[Number(d)] ?? d)
    .join(" ");
}

/** Strip markdown and spell out digits for speech output. */
export function speechSafe(text: string): string {
  return text
    .replace(/[*_`#>-]+/g, " ")
    .replace(/\d+/g, (d) => numberToWords(Number(d)))
    .replace(/\s+/g, " ")
    .trim();
}

export const CATEGORY_STYLES: Record<BlockCategory, string> = {
  study: "bg-emerald-500/15 border-emerald-500/40 text-emerald-200",
  class: "bg-indigo-500/15 border-indigo-500/40 text-indigo-200",
  rest: "bg-sky-500/15 border-sky-500/40 text-sky-200",
  exercise: "bg-amber-500/15 border-amber-500/40 text-amber-200",
  meal: "bg-rose-500/15 border-rose-500/40 text-rose-200",
  commute: "bg-slate-500/15 border-slate-400/40 text-slate-200",
  leisure: "bg-fuchsia-500/15 border-fuchsia-500/40 text-fuchsia-200",
  work: "bg-teal-500/15 border-teal-500/40 text-teal-200",
};
