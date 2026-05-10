import type { MemoryDraft } from "../types/memoir";
import {
  fileToMemoryDraft,
  prepareFileForUpload,
  readFileAsDataUrl,
} from "../utils/mediaFiles";

const CLOUD_MEDIA_ENDPOINT = "/.netlify/functions/media";
const MAX_FUNCTION_PAYLOAD_BYTES = 5_500_000;

function isLocalHost() {
  return ["localhost", "127.0.0.1", "::1"].includes(window.location.hostname);
}

async function uploadDataUrlToCloud(
  dataUrl: string,
  fileName: string,
  contentType: string,
) {
  const payload = JSON.stringify({ contentType, dataUrl, fileName });

  if (payload.length > MAX_FUNCTION_PAYLOAD_BYTES) {
    throw new Error(
      "这个文件超过 Netlify Functions 的单次上传限制。请压缩后再上传，或改用 Supabase/对象存储处理大视频。",
    );
  }

  const response = await fetch(CLOUD_MEDIA_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: payload,
  });

  if (!response.ok) {
    throw new Error("媒体上传到 Netlify Blobs 失败。");
  }

  const result = (await response.json()) as { url: string };
  return result.url;
}

export async function uploadFileForSharedUrl(file: File) {
  const prepared = await prepareFileForUpload(file);

  try {
    return await uploadDataUrlToCloud(
      prepared.dataUrl,
      prepared.fileName,
      prepared.contentType,
    );
  } catch (error) {
    if (isLocalHost()) {
      return prepared.dataUrl;
    }

    throw error;
  }
}

export async function fileToSharedMemoryDraft(
  file: File,
): Promise<MemoryDraft | null> {
  const prepared = await prepareFileForUpload(file);
  const localDraft = await fileToMemoryDraft(file, prepared.dataUrl);

  if (!localDraft) return null;

  try {
    return {
      ...localDraft,
      mediaUrl: await uploadDataUrlToCloud(
        prepared.dataUrl,
        prepared.fileName,
        prepared.contentType,
      ),
    };
  } catch (error) {
    if (isLocalHost()) {
      return localDraft;
    }

    throw error;
  }
}

export async function readHeroFile(file: File) {
  try {
    return await uploadFileForSharedUrl(file);
  } catch (error) {
    if (isLocalHost()) {
      return readFileAsDataUrl(file);
    }

    throw error;
  }
}
