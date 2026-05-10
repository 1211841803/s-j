import { initialMemoirs } from "../data/initialMemoirs";
import type { MemoirCollection } from "../types/memoir";

export interface MemoirRepository {
  load(): Promise<MemoirCollection>;
  save(collection: MemoirCollection): Promise<MemoirStorageMode>;
}

export type MemoirStorageMode = "cloud" | "local";

const STORAGE_KEY = "family-memoirs.collection.v2";
const LEGACY_STORAGE_KEYS = ["family-memoirs.collection.v2", "family-memoirs.collection.v1"];
const DB_NAME = "family-memoirs-editor";
const DB_VERSION = 1;
const STORE_NAME = "collections";
const COLLECTION_KEY = "current";
const CLOUD_MEMOIRS_ENDPOINT = "/.netlify/functions/memoirs";

function cloneCollection(collection: MemoirCollection): MemoirCollection {
  return JSON.parse(JSON.stringify(collection)) as MemoirCollection;
}

function openMemoirDb() {
  return new Promise<IDBDatabase>((resolve, reject) => {
    if (typeof window === "undefined" || !window.indexedDB) {
      reject(new Error("IndexedDB is not available."));
      return;
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function idbGetCollection() {
  const db = await openMemoirDb();

  return new Promise<MemoirCollection | null>((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, "readonly");
    const store = transaction.objectStore(STORE_NAME);
    const request = store.get(COLLECTION_KEY);

    request.onsuccess = () => resolve((request.result as MemoirCollection | undefined) ?? null);
    request.onerror = () => reject(request.error);
    transaction.oncomplete = () => db.close();
  });
}

async function idbSaveCollection(collection: MemoirCollection) {
  const db = await openMemoirDb();

  return new Promise<void>((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, "readwrite");
    const store = transaction.objectStore(STORE_NAME);
    const request = store.put(collection, COLLECTION_KEY);

    request.onerror = () => reject(request.error);
    transaction.oncomplete = () => {
      db.close();
      resolve();
    };
    transaction.onerror = () => reject(transaction.error);
  });
}

function loadLegacyLocalStorage() {
  if (typeof window === "undefined") return null;

  for (const key of LEGACY_STORAGE_KEYS) {
    const saved = window.localStorage.getItem(key);
    if (!saved) continue;

    try {
      return JSON.parse(saved) as MemoirCollection;
    } catch {
      window.localStorage.removeItem(key);
    }
  }

  return null;
}

function isLocalHost() {
  if (typeof window === "undefined") return true;

  return ["localhost", "127.0.0.1", "::1"].includes(window.location.hostname);
}

async function loadCloudCollection() {
  const response = await fetch(CLOUD_MEMOIRS_ENDPOINT, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Cloud collection is not available.");
  }

  const payload = (await response.json()) as {
    collection?: MemoirCollection | null;
  };

  return payload.collection ?? null;
}

async function saveCloudCollection(collection: MemoirCollection) {
  const response = await fetch(CLOUD_MEMOIRS_ENDPOINT, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(collection),
  });

  if (!response.ok) {
    throw new Error("Cloud collection save failed.");
  }
}

export const localMemoirRepository: MemoirRepository = {
  async load() {
    if (typeof window === "undefined") {
      return cloneCollection(initialMemoirs);
    }

    try {
      const cloudCollection = await loadCloudCollection();
      if (cloudCollection) return cloudCollection;
      if (!isLocalHost()) return cloneCollection(initialMemoirs);
    } catch {
      // Local Vite previews do not expose Netlify Functions. Use local storage there.
    }

    try {
      const saved = await idbGetCollection();
      if (saved) return saved;
    } catch {
      // Fall through to legacy localStorage for older browsers or blocked IDB.
    }

    return loadLegacyLocalStorage() ?? cloneCollection(initialMemoirs);
  },

  async save(collection) {
    if (typeof window === "undefined") {
      return "local";
    }

    try {
      await saveCloudCollection(collection);
      await idbSaveCollection(collection);
      window.localStorage.removeItem(STORAGE_KEY);
      return "cloud";
    } catch {
      if (!isLocalHost()) {
        console.warn("Cloud save failed; falling back to browser storage.");
      }
    }

    try {
      await idbSaveCollection(collection);
      window.localStorage.removeItem(STORAGE_KEY);
      return "local";
    } catch {
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(collection));
        return "local";
      } catch {
        window.alert("照片/视频太大，当前浏览器没有保存成功。请先导出数据，或减少单次导入数量。");
        return "local";
      }
    }
  },
};

export function createBaaSRepository(): MemoirRepository {
  return {
    async load() {
      throw new Error("BaaS repository is not configured yet.");
    },
    async save() {
      throw new Error("BaaS repository is not configured yet.");
    },
  };
}
