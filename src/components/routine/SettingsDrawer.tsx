import { useState } from "react";
import type { ApiKeys } from "@/types/routine";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  keys: ApiKeys;
  onSave: (keys: ApiKeys) => void;
}

const FIELDS: { id: keyof ApiKeys; label: string; hint: string }[] = [
  { id: "groq", label: "Groq API Key", hint: "llama-3.1-8b-instant orchestration" },
  { id: "rime", label: "Rime API Key", hint: "Low-latency streaming TTS" },
  { id: "qdrantUrl", label: "Qdrant URL", hint: "https://xyz.cloud.qdrant.io:6333" },
  { id: "qdrantKey", label: "Qdrant API Key", hint: "Vector memory access" },
  { id: "deepgram", label: "Deepgram API Key", hint: "Nova-2 streaming STT (optional)" },
];

export function SettingsDrawer({ open, onOpenChange, keys, onSave }: Props) {
  const [draft, setDraft] = useState<ApiKeys>(keys);

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (next) setDraft(keys);
        onOpenChange(next);
      }}
    >
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>API Keys</DialogTitle>
          <DialogDescription>
            Stored locally in your browser. Leave blank to use the built-in
            managed AI fallback for language and speech.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          {FIELDS.map((field) => (
            <div key={field.id} className="space-y-1">
              <Label htmlFor={field.id} className="text-xs">
                {field.label}
              </Label>
              <Input
                id={field.id}
                type={field.id === "qdrantUrl" ? "text" : "password"}
                value={draft[field.id]}
                placeholder={field.hint}
                onChange={(e) =>
                  setDraft({ ...draft, [field.id]: e.target.value })
                }
              />
            </div>
          ))}
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={() => {
              onSave(draft);
              onOpenChange(false);
            }}
          >
            Save keys
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
