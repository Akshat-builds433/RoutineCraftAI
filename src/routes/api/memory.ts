import { createFileRoute } from "@tanstack/react-router";

interface Body {
  action: "search" | "upsert";
  text: string;
  qdrantUrl?: string;
  qdrantKey?: string;
  collection?: string;
}

const DIM = 1536;

async function embed(text: string): Promise<number[] | null> {
  const key = process.env["LOVABLE_API_KEY"];
  if (!key) return null;
  const res = await fetch("https://ai.gateway.lovable.dev/v1/embeddings", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model: "openai/text-embedding-3-small", input: text }),
  });
  if (!res.ok) return null;
  const json = (await res.json()) as { data?: { embedding: number[] }[] };
  return json.data?.[0]?.embedding ?? null;
}

export const Route = createFileRoute("/api/memory")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const body = (await request.json()) as Body;
        const url = (body.qdrantUrl || process.env["QDRANT_URL"] || "").replace(
          /\/$/,
          "",
        );
        const apiKey = body.qdrantKey || process.env["QDRANT_API_KEY"] || "";
        const collection = body.collection || "routinecraft_memory";
        if (!url) return Response.json({ ok: false, reason: "no_qdrant", results: [] });

        const headers: Record<string, string> = {
          "Content-Type": "application/json",
        };
        if (apiKey) headers["api-key"] = apiKey;

        const vector = await embed(body.text);
        if (!vector) return Response.json({ ok: false, reason: "no_embeddings", results: [] });

        try {
          if (body.action === "upsert") {
            await fetch(`${url}/collections/${collection}`, {
              method: "PUT",
              headers,
              body: JSON.stringify({
                vectors: { size: DIM, distance: "Cosine" },
              }),
            }).catch(() => undefined);

            const res = await fetch(
              `${url}/collections/${collection}/points?wait=true`,
              {
                method: "PUT",
                headers,
                body: JSON.stringify({
                  points: [
                    {
                      id: Date.now(),
                      vector,
                      payload: { text: body.text, ts: new Date().toISOString() },
                    },
                  ],
                }),
              },
            );
            return Response.json({ ok: res.ok });
          }

          const res = await fetch(
            `${url}/collections/${collection}/points/search`,
            {
              method: "POST",
              headers,
              body: JSON.stringify({ vector, limit: 4, with_payload: true }),
            },
          );
          if (!res.ok) return Response.json({ ok: false, results: [] });
          const json = (await res.json()) as {
            result?: { payload?: { text?: string } }[];
          };
          return Response.json({
            ok: true,
            results: (json.result ?? [])
              .map((r) => r.payload?.text)
              .filter(Boolean),
          });
        } catch (err) {
          return Response.json({ ok: false, error: String(err), results: [] });
        }
      },
    },
  },
});
