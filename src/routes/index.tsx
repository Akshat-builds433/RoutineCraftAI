import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { MessageSquare } from "lucide-react";

import { TopBar } from "@/components/routine/TopBar";
import { InputBar } from "@/components/routine/InputBar";
import { TimetableGrid } from "@/components/routine/TimetableGrid";
import { RecommendationPanel } from "@/components/routine/RecommendationPanel";
import { SettingsDrawer } from "@/components/routine/SettingsDrawer";
import { useVoice } from "@/hooks/useVoice";
import { TtsPlayer } from "@/lib/tts-player";
import {
  SYSTEM_PROMPT,
  extractClauses,
  parsePlan,
  speechSafe,
  splitSpeechAndJson,
} from "@/lib/routine";
import {
  DEFAULT_THEME,
  THEMES,
  THEME_STORAGE_KEY,
  applyTheme,
  type ThemeId,
} from "@/lib/themes";
import { EMPTY_KEYS } from "@/types/routine";
import type {
  AgentStatus,
  ApiKeys,
  ChatMessage,
  LatencyMetrics,
  RoutinePlan,
  TimeBlock,
} from "@/types/routine";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "RoutineCraft AI — Voice Student Routine Assistant" },
      {
        name: "description",
        content:
          "Speak or type your student routine and get a color-coded timetable with sleep, deep-work and burnout recommendations.",
      },
      {
        property: "og:title",
        content: "RoutineCraft AI — Voice Student Routine Assistant",
      },
      {
        property: "og:description",
        content:
          "Voice-first AI academic coach: instant timetables, Pomodoro splits and a burnout balance index.",
      },
    ],
  }),
  component: Dashboard,
});

const STORAGE_KEY = "routinecraft.keys";

function Dashboard() {
  const [status, setStatus] = useState<AgentStatus>("idle");
  const [metrics, setMetrics] = useState<LatencyMetrics>({
    stt: null,
    ttfa: null,
    qdrant: null,
    llmFirstToken: null,
  });
  const [plan, setPlan] = useState<RoutinePlan | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [keys, setKeys] = useState<ApiKeys>(EMPTY_KEYS);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [streaming, setStreaming] = useState("");
  const [theme, setTheme] = useState<ThemeId>(DEFAULT_THEME);

  useEffect(() => {
    const saved = localStorage.getItem(THEME_STORAGE_KEY) as ThemeId | null;
    const next = THEMES.some((t) => t.id === saved) ? (saved as ThemeId) : DEFAULT_THEME;
    setTheme(next);
    applyTheme(next);
  }, []);

  const changeTheme = useCallback((next: ThemeId) => {
    setTheme(next);
    applyTheme(next);
    localStorage.setItem(THEME_STORAGE_KEY, next);
  }, []);

  const playerRef = useRef<TtsPlayer | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const keysRef = useRef(keys);
  keysRef.current = keys;
  const messagesRef = useRef(messages);
  messagesRef.current = messages;

  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      try {
        setKeys({ ...EMPTY_KEYS, ...(JSON.parse(raw) as Partial<ApiKeys>) });
      } catch {
        /* ignore */
      }
    }
    const player = new TtsPlayer();
    player.onTtfa = (ms) => setMetrics((m) => ({ ...m, ttfa: ms }));
    player.onStart = () => setStatus("speaking");
    player.onEnd = () => setStatus((s) => (s === "speaking" ? "idle" : s));
    playerRef.current = player;
    return () => player.stop();
  }, []);

  const bargeIn = useCallback(() => {
    const player = playerRef.current;
    const wasBusy = player?.isPlaying || abortRef.current !== null;
    player?.stop();
    abortRef.current?.abort();
    abortRef.current = null;
    if (wasBusy) {
      setStatus("interrupted");
      setTimeout(() => setStatus((s) => (s === "interrupted" ? "listening" : s)), 400);
    }
  }, []);

  const runTurn = useCallback(async (userText: string, sttMs: number | null) => {
    bargeIn();
    setMetrics((m) => ({ ...m, stt: sttMs, ttfa: null, llmFirstToken: null }));
    setStatus("analyzing");
    setStreaming("");

    const nextMessages: ChatMessage[] = [
      ...messagesRef.current,
      { role: "user", content: userText },
    ];
    setMessages(nextMessages);

    const activeKeys = keysRef.current;

    // Async Qdrant memory retrieval — never blocks first-token generation.
    const memoryStart = performance.now();
    const memoryPromise = fetch("/api/memory", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "search",
        text: userText,
        qdrantUrl: activeKeys.qdrantUrl || undefined,
        qdrantKey: activeKeys.qdrantKey || undefined,
      }),
    })
      .then((r) => r.json() as Promise<{ results?: string[] }>)
      .then((json) => {
        setMetrics((m) => ({
          ...m,
          qdrant: Math.round(performance.now() - memoryStart),
        }));
        return (json.results ?? []).join("\n");
      })
      .catch(() => "");

    const controller = new AbortController();
    abortRef.current = controller;
    const player = playerRef.current;
    player?.beginTurn();

    const started = performance.now();
    let raw = "";
    let clauseBuffer = "";
    let sawJson = false;
    let firstToken = false;

    try {
      const memory = await Promise.race([
        memoryPromise,
        new Promise<string>((r) => setTimeout(() => r(""), 600)),
      ]);

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          system: SYSTEM_PROMPT,
          messages: nextMessages,
          groqKey: activeKeys.groq || undefined,
          memory: memory || undefined,
        }),
        signal: controller.signal,
      });
      if (!res.ok || !res.body) throw new Error(await res.text());

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        if (!firstToken) {
          firstToken = true;
          setMetrics((m) => ({
            ...m,
            llmFirstToken: Math.round(performance.now() - started),
          }));
        }
        raw += chunk;
        setStreaming(splitSpeechAndJson(raw).speech);

        if (!sawJson) {
          if (raw.includes("```")) {
            sawJson = true;
            clauseBuffer = "";
          } else {
            clauseBuffer += chunk;
            const { clauses, rest } = extractClauses(clauseBuffer);
            clauseBuffer = rest;
            for (const clause of clauses) {
              void player?.speak(speechSafe(clause), activeKeys.rime || undefined);
            }
          }
        }
      }

      if (!sawJson && clauseBuffer.trim()) {
        void player?.speak(speechSafe(clauseBuffer), activeKeys.rime || undefined);
      }

      const { speech, json } = splitSpeechAndJson(raw);
      if (json) {
        const parsed = parsePlan(json);
        if (parsed) setPlan(parsed);
      }
      setMessages([...nextMessages, { role: "assistant", content: speech }]);
      setStreaming("");

      void fetch("/api/memory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "upsert",
          text: `Student said: ${userText}\nCoach replied: ${speech}`,
          qdrantUrl: activeKeys.qdrantUrl || undefined,
          qdrantKey: activeKeys.qdrantKey || undefined,
        }),
      }).catch(() => undefined);
    } catch {
      setStreaming("");
    } finally {
      abortRef.current = null;
      setStatus((s) => (s === "speaking" ? s : playerRef.current?.isPlaying ? "speaking" : "idle"));
    }
  }, [bargeIn]);

  const voice = useVoice({
    onFinalTranscript: (text, sttMs) => {
      void runTurn(text, sttMs);
    },
    onSpeechStart: () => {
      if (playerRef.current?.isPlaying) bargeIn();
    },
  });

  const updateBlock = (block: TimeBlock) =>
    setPlan((p) =>
      p
        ? { ...p, timetable: p.timetable.map((b) => (b.id === block.id ? block : b)) }
        : p,
    );
  const deleteBlock = (id: string) =>
    setPlan((p) => (p ? { ...p, timetable: p.timetable.filter((b) => b.id !== id) } : p));

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <TopBar
        status={voice.listening && status === "idle" ? "listening" : status}
        metrics={metrics}
        onOpenSettings={() => setSettingsOpen(true)}
        theme={theme}
        onThemeChange={changeTheme}
      />

      <main className="mx-auto grid w-full max-w-[1600px] flex-1 gap-4 px-4 py-5 lg:grid-cols-[1.35fr_1fr]">
        <TimetableGrid
          blocks={plan?.timetable ?? []}
          onUpdate={updateBlock}
          onDelete={deleteBlock}
        />

        <div className="space-y-4">
          <FocusSession />

          <RecommendationPanel
            scores={plan?.scores ?? null}
            recommendations={plan?.recommendations ?? []}
          />

          <section className="rounded-xl border border-border/60 bg-card/50 p-4">
            <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold">
              <MessageSquare className="h-4 w-4 text-accent" />
              Conversation
            </h2>
            <div className="max-h-72 space-y-2 overflow-y-auto pr-1">
              {messages.length === 0 && !streaming && (
                <p className="text-sm text-muted-foreground">
                  Try: “I have lectures nine to one on weekdays, I sleep at two a
                  m, and I want twenty study hours a week for my physics exam.”
                </p>
              )}
              {messages.map((m, i) => (
                <div
                  key={i}
                  className={`rounded-lg px-3 py-2 text-sm ${
                    m.role === "user"
                      ? "bg-primary/10 text-foreground"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {m.content}
                </div>
              ))}
              {streaming && (
                <div className="rounded-lg bg-muted px-3 py-2 text-sm text-muted-foreground">
                  {streaming}
                </div>
              )}
            </div>
          </section>
        </div>
      </main>

      <InputBar
        listening={voice.listening}
        supported={voice.supported}
        level={voice.level}
        interim={voice.interim}
        busy={status === "analyzing"}
        onToggleMic={() => (voice.listening ? voice.stop() : void voice.start())}
        onSubmitText={(text) => void runTurn(text, null)}
        onStopSpeaking={bargeIn}
      />

      <SettingsDrawer
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        keys={keys}
        onSave={(next) => {
          setKeys(next);
          localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        }}
      />
    </div>
  );
}
