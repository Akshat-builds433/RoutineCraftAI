import { createFileRoute } from "@tanstack/react-router";

interface Body {
  messages: { role: string; content: string }[];
  system: string;
  groqKey?: string;
  memory?: string;
}

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const body = (await request.json()) as Body;
        const messages = [
          { role: "system", content: body.system },
          ...(body.memory
            ? [
                {
                  role: "system",
                  content: `Relevant long-term memory about this student:\n${body.memory}`,
                },
              ]
            : []),
          ...body.messages,
        ];

        const groqKey = body.groqKey || process.env["GROQ_API_KEY"];
        const endpoint = groqKey
          ? "https://api.groq.com/openai/v1/chat/completions"
          : "https://ai.gateway.lovable.dev/v1/chat/completions";
        const model = groqKey ? "llama-3.1-8b-instant" : "google/gemini-3.6-flash";
        const authKey = groqKey || process.env["LOVABLE_API_KEY"];
        if (!authKey) {
          return new Response("No LLM credentials configured", { status: 500 });
        }

        const upstream = await fetch(endpoint, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${authKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ model, messages, stream: true, temperature: 0.4 }),
          signal: request.signal,
        });

        if (!upstream.ok || !upstream.body) {
          const text = await upstream.text().catch(() => "");
          return new Response(`LLM error [${upstream.status}]: ${text}`, {
            status: upstream.status || 502,
          });
        }

        // Re-emit as a plain token text stream for the client.
        const stream = new ReadableStream<Uint8Array>({
          async start(controller) {
            const reader = upstream.body!.getReader();
            const decoder = new TextDecoder();
            const encoder = new TextEncoder();
            let buf = "";
            try {
              for (;;) {
                const { done, value } = await reader.read();
                if (done) break;
                buf += decoder.decode(value, { stream: true });
                const lines = buf.split("\n");
                buf = lines.pop() ?? "";
                for (const line of lines) {
                  const trimmed = line.trim();
                  if (!trimmed.startsWith("data:")) continue;
                  const data = trimmed.slice(5).trim();
                  if (data === "[DONE]") continue;
                  try {
                    const parsed = JSON.parse(data);
                    const delta = parsed?.choices?.[0]?.delta?.content;
                    if (delta) controller.enqueue(encoder.encode(delta));
                  } catch {
                    /* partial chunk */
                  }
                }
              }
            } catch {
              /* aborted */
            } finally {
              controller.close();
            }
          },
        });

        return new Response(stream, {
          headers: {
            "Content-Type": "text/plain; charset=utf-8",
            "Cache-Control": "no-cache",
          },
        });
      },
    },
  },
});
