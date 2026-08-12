import { useState } from "react";
import { Mic, MicOff, Send, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AudioVisualizer } from "./AudioVisualizer";

interface Props {
  listening: boolean;
  supported: boolean;
  level: number;
  interim: string;
  busy: boolean;
  onToggleMic: () => void;
  onSubmitText: (text: string) => void;
  onStopSpeaking: () => void;
}

export function InputBar({
  listening,
  supported,
  level,
  interim,
  busy,
  onToggleMic,
  onSubmitText,
  onStopSpeaking,
}: Props) {
  const [text, setText] = useState("");

  return (
    <div className="sticky bottom-0 z-20 border-t border-border/60 bg-background/90 px-4 py-3 backdrop-blur">
      <div className="mx-auto flex max-w-[1600px] flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={onToggleMic}
          aria-label={listening ? "Stop listening" : "Start voice input"}
          className={`relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full transition-colors ${
            listening
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground hover:text-foreground"
          }`}
        >
          {listening && (
            <span className="absolute inset-0 animate-ping rounded-full bg-primary/40" />
          )}
          {supported ? (
            <Mic className="relative h-5 w-5" />
          ) : (
            <MicOff className="relative h-5 w-5" />
          )}
        </button>

        <AudioVisualizer level={level} active={listening} />

        <form
          className="flex min-w-[260px] flex-1 items-center gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (!text.trim()) return;
            onSubmitText(text.trim());
            setText("");
          }}
        >
          <Input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={
              interim ||
              "Type your routine: classes, sleep, study goals, deadlines…"
            }
            className="h-11"
          />
          <Button type="submit" className="h-11" disabled={busy && !text.trim()}>
            <Send className="mr-1.5 h-4 w-4" />
            Submit
          </Button>
        </form>

        <Button
          type="button"
          variant="outline"
          className="h-11"
          onClick={onStopSpeaking}
        >
          <Square className="mr-1.5 h-4 w-4" />
          Barge-in
        </Button>
      </div>
      {!supported && (
        <p className="mx-auto mt-2 max-w-[1600px] text-[11px] text-muted-foreground">
          Voice capture is unavailable in this browser — use text input, or open
          the app in Chrome.
        </p>
      )}
    </div>
  );
}
