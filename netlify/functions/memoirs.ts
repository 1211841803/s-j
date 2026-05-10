import { getStore } from "@netlify/blobs";

const COLLECTION_KEY = "current";

const jsonHeaders = {
  "Content-Type": "application/json; charset=utf-8",
  "Cache-Control": "no-store",
};

function getMemoirsStore() {
  return getStore({ name: "family-memoirs-data", consistency: "strong" });
}

export default async (req: Request) => {
  const store = getMemoirsStore();

  if (req.method === "GET") {
    const collection = await store.get(COLLECTION_KEY, { type: "json" });

    return new Response(JSON.stringify({ collection }), {
      headers: jsonHeaders,
    });
  }

  if (req.method === "PUT") {
    const collection = await req.json();
    await store.setJSON(COLLECTION_KEY, collection, {
      metadata: { updatedAt: new Date().toISOString() },
    });

    return new Response(JSON.stringify({ ok: true }), {
      headers: jsonHeaders,
    });
  }

  return new Response(JSON.stringify({ error: "Method not allowed" }), {
    status: 405,
    headers: jsonHeaders,
  });
};
