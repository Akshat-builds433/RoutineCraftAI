import { createFileRoute } from "@tanstack/react-router";

interface Body {
  text: string;
  rimeKey?: string;
  speaker?: string;
}

export const Route = createFileRoute("/api/tts")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { text, rimeKey, speaker } = (await request.json()) as Body;
        if (!text?.trim()) return new Response("Empty text", { status: 400 });

        try {
          if (rimeKey) {
            const res = await fetch("https://users.rime.ai/v1/rime-tts", {
              method: "POST",
              headers: {
                Authorization: `Bearer ${rimeKey}`,
                "Content-Type": "application/json",
                Accept: "audio/mp3",
              },
              body: JSON.stringify({
                text,
                speaker: speaker || "cove",
                modelId: "mistv2",
                audioFormat: "mp3",
                samplingRate: 22050,
              }),
              signal: request.signal,
            });
            if (!res.ok) {
              const err = await res.text().catch(() => "");
              return new Response(`Rime error [${res.status}]: ${err}`, {
                status: res.status,
              });
            }
            return new Response(res.body, {
              headers: { "Content-Type": "audio/mpeg" },
            });
          }

          const key = process.env["LOVABLE_API_KEY"];
          if (!key) return new Response("No TTS credentials", { status: 500 });
          const res = await fetch("https://ai.gateway.lovable.dev/v1/audio/speech", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${key}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              model: "openai/gpt-4o-mini-tts",
              input: text,
              voice: "alloy",
              response_format: "mp3",
              stream_format: "audio",
            }),
            signal: request.signal,
          });
          if (!res.ok) {
            const err = await res.text().catch(() => "");
            return new Response(`TTS error [${res.status}]: ${err}`, {
              status: res.status,
            });
          }
          return new Response(res.body, {
            headers: { "Content-Type": "audio/mpeg" },
          });
        } catch (err) {
          if (request.signal.aborted) return new Response(null, { status: 499 });
          throw err;
        }
      },
    },
  },
});
