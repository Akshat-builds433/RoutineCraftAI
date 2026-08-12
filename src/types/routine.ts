export type BlockCategory =
  | "study"
  | "class"
  | "rest"
  | "exercise"
  | "meal"
  | "commute"
  | "leisure"
  | "work";

export type EnergyLevel = "high" | "medium" | "low";

export type DayName =
  | "Monday"
  | "Tuesday"
  | "Wednesday"
  | "Thursday"
  | "Friday"
  | "Saturday"
  | "Sunday";

export interface TimeBlock {
  id: string;
  day: DayName;
  time: string; // "08:00 - 09:30"
  activity: string;
  category: BlockCategory;
  energyLevel: EnergyLevel;
  note?: string;
}

export interface Recommendation {
  id: string;
  title: string;
  detail: string;
  type: "sleep" | "cognitive" | "deepwork" | "balance" | "general";
  severity: "info" | "warning" | "critical";
}

export interface BalanceScores {
  academicBalance: number; // 1-100
  rest: number; // 1-100
  burnoutRisk: number; // 1-100 (higher = worse)
}

export interface RoutinePlan {
  timetable: TimeBlock[];
  recommendations: Recommendation[];
  scores: BalanceScores;
  summary?: string;
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export type AgentStatus =
  | "idle"
  | "listening"
  | "analyzing"
  | "speaking"
  | "interrupted";

export interface LatencyMetrics {
  stt: number | null;
  ttfa: number | null;
  qdrant: number | null;
  llmFirstToken: number | null;
}

export interface ApiKeys {
  groq: string;
  rime: string;
  qdrantUrl: string;
  qdrantKey: string;
  deepgram: string;
}

export const EMPTY_KEYS: ApiKeys = {
  groq: "",
  rime: "",
  qdrantUrl: "",
  qdrantKey: "",
  deepgram: "",
};

export const DAYS: DayName[] = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];
