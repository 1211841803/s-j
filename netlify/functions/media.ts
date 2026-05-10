import { getStore } from "@netlify/blobs";

const jsonHeaders = {
  "Content-Type": "application/json; charset=utf-8",
  "Cache-Control": "no-store",
};

function getMediaStore() {
  return getStore({ name: "family-memoirs-media", consistency: "strong" });
}

function safeFileName(value: string) {
  return value
    .replace(/[^\w.\-]+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 80);
}

function parseDataUrl(dataUrl: string) {
  const match = dataUrl.match(/^data:([^;,]+);base64,(.+)$/);
  if (!match) {
    throw new Error("Invalid data URL");
  }

  return {
    contentType: match[1],
    buffer: Buffer.from(match[2], "base64"),
  };
}

export default async (req: Request) => {
  const store = getMediaStore();
  const url = new URL(req.url);

  if (req.method === "GET") {
    const key = url.searchParams.get("key");
    if (!key) {
      return new Response("Missing key", { status: 400 });
    }

    const [data, metadata] = await Promise.all([
      store.get(key, { type: "arrayBuffer" }),
      store.getMetadata(key),
    ]);

    if (!data) {
      return new Response("Not found", { status: 404 });
    }

    const contentType =
      typeof metadata?.metadata?.contentType === "string"
        ? metadata.metadata.contentType
        : "application/octet-stream";

    return new Response(data, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  }

  if (req.method === "POST") {
    const body = (await req.json()) as {
      contentType?: string;
      dataUrl?: string;
      fileName?: string;
    };

    if (!body.dataUrl || !body.fileName) {
      return new Response(JSON.stringify({ error: "Missing file payload" }), {
        status: 400,
        headers: jsonHeaders,
      });
    }

    const parsed = parseDataUrl(body.dataUrl);
    const contentType = body.contentType || parsed.contentType;
    const key = `uploads/${Date.now()}-${crypto.randomUUID()}-${safeFileName(
      body.fileName,
    )}`;

    await store.set(key, parsed.buffer, {
      metadata: {
        contentType,
        fileName: body.fileName,
        uploadedAt: new Date().toISOString(),
      },
    });

    return new Response(
      JSON.stringify({
        key,
        url: `/.netlify/functions/media?key=${encodeURIComponent(key)}`,
      }),
      { headers: jsonHeaders },
    );
  }

  return new Response(JSON.stringify({ error: "Method not allowed" }), {
    status: 405,
    headers: jsonHeaders,
  });
};
