import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { initialMemoirs } from "../data/initialMemoirs";
import {
  localMemoirRepository,
  type MemoirStorageMode,
} from "../services/memoirRepository";
import type {
  MemoirCollection,
  MemoryDraft,
  MemoryItem,
  MemoryKind,
  YearBlock,
} from "../types/memoir";
import { createId, moveById } from "../utils/reorder";

interface MemoirContextValue {
  collection: MemoirCollection;
  isReady: boolean;
  saveState: "idle" | "saving" | "saved" | "local";
  storageMode: MemoirStorageMode;
  updateCollection(patch: Partial<Pick<MemoirCollection, "familyName" | "welcomeText" | "heroImage">>): void;
  replaceCollection(collection: MemoirCollection): void;
  addYear(year: number, label?: string): string;
  updateYear(yearId: string, patch: Partial<Pick<YearBlock, "year" | "label" | "note" | "hidden">>): void;
  deleteYear(yearId: string): void;
  toggleYearHidden(yearId: string): void;
  reorderYears(activeId: string, overId: string): void;
  reorderItems(yearId: string, activeId: string, overId: string): void;
  addMemory(yearId: string, kind: MemoryKind, draft?: Partial<MemoryDraft>): void;
  addMemoriesToYear(year: number, label: string | undefined, drafts: MemoryDraft[]): void;
  updateMemory(yearId: string, memoryId: string, patch: Partial<Omit<MemoryItem, "id" | "yearId">>): void;
  moveMemoryToYear(fromYearId: string, memoryId: string, toYearId: string): void;
  deleteMemory(yearId: string, memoryId: string): void;
  toggleLike(memoryId: string): void;
  resetAllData(): void;
}

const MemoirContext = createContext<MemoirContextValue | null>(null);

function mapYears(
  collection: MemoirCollection,
  mapper: (years: MemoirCollection["years"]) => MemoirCollection["years"],
): MemoirCollection {
  return {
    ...collection,
    years: mapper(collection.years),
  };
}

function createMemory(yearId: string, kind: MemoryKind): MemoryItem {
  const id = createId("memory");

  return {
    id,
    yearId,
    kind,
    title: kind === "photo" ? "新照片" : "新视频",
    date: new Date().toISOString().slice(0, 10),
    place: "待补充",
    mediaUrl: "",
    posterUrl: undefined,
    alt: "",
    caption: "",
    liked: false,
  };
}

function createMemoryFromDraft(yearId: string, draft: MemoryDraft): MemoryItem {
  return {
    ...draft,
    id: createId("memory"),
    yearId,
    liked: draft.liked ?? false,
  };
}

export function MemoirProvider({ children }: { children: ReactNode }) {
  const [collection, setCollection] = useState<MemoirCollection>(initialMemoirs);
  const [isReady, setIsReady] = useState(false);
  const [saveState, setSaveState] = useState<MemoirContextValue["saveState"]>("idle");
  const [storageMode, setStorageMode] = useState<MemoirStorageMode>("local");
  const hasLoaded = useRef(false);

  useEffect(() => {
    let active = true;

    localMemoirRepository.load().then((loaded) => {
      if (!active) return;
      setCollection(loaded);
      setIsReady(true);
      hasLoaded.current = true;
    });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!hasLoaded.current) return;
    const saveTimer = window.setTimeout(() => {
      setSaveState("saving");
      void localMemoirRepository.save(collection).then((mode) => {
        setStorageMode(mode);
        setSaveState(mode === "cloud" ? "saved" : "local");
      });
    }, 650);

    return () => window.clearTimeout(saveTimer);
  }, [collection]);

  const updateCollection = useCallback(
    (patch: Partial<Pick<MemoirCollection, "familyName" | "welcomeText" | "heroImage">>) => {
      setCollection((current) => ({ ...current, ...patch }));
    },
    [],
  );

  const replaceCollection = useCallback((nextCollection: MemoirCollection) => {
    setCollection(nextCollection);
  }, []);

  const addYear = useCallback((year: number, label?: string) => {
    const existing = collection.years.find((item) => item.year === year);
    if (existing) {
      return existing.id;
    }

    const id = createId("year");

    setCollection((current) =>
      mapYears(current, (years) => [
        ...years,
        {
          id,
          year,
          label: label?.trim() || `${year} 年`,
          note: "",
          items: [],
        },
      ].sort((a, b) => a.year - b.year)),
    );

    return id;
  }, [collection.years]);

  const updateYear = useCallback((yearId: string, patch: Partial<Pick<YearBlock, "year" | "label" | "note" | "hidden">>) => {
    setCollection((current) =>
      mapYears(current, (years) =>
        years.map((year) =>
          year.id === yearId ? { ...year, ...patch } : year,
        ),
      ),
    );
  }, []);

  const deleteYear = useCallback((yearId: string) => {
    setCollection((current) =>
      mapYears(current, (years) => years.filter((year) => year.id !== yearId)),
    );
  }, []);

  const toggleYearHidden = useCallback((yearId: string) => {
    setCollection((current) =>
      mapYears(current, (years) =>
        years.map((year) =>
          year.id === yearId ? { ...year, hidden: !year.hidden } : year,
        ),
      ),
    );
  }, []);

  const reorderYears = useCallback((activeId: string, overId: string) => {
    setCollection((current) =>
      mapYears(current, (years) => moveById(years, activeId, overId)),
    );
  }, []);

  const reorderItems = useCallback(
    (yearId: string, activeId: string, overId: string) => {
      setCollection((current) =>
        mapYears(current, (years) =>
          years.map((year) =>
            year.id === yearId
              ? { ...year, items: moveById(year.items, activeId, overId) }
              : year,
          ),
        ),
      );
    },
    [],
  );

  const addMemory = useCallback((yearId: string, kind: MemoryKind, draft?: Partial<MemoryDraft>) => {
    setCollection((current) =>
      mapYears(current, (years) =>
        years.map((year) =>
          year.id === yearId
            ? {
                ...year,
                items: [{ ...createMemory(yearId, kind), ...draft }, ...year.items],
              }
            : year,
        ),
      ),
    );
  }, []);

  const addMemoriesToYear = useCallback(
    (yearNumber: number, label: string | undefined, drafts: MemoryDraft[]) => {
      if (drafts.length === 0) return;

      setCollection((current) => {
        const existing = current.years.find((year) => year.year === yearNumber);
        const yearId = existing?.id ?? createId("year");
        const newItems = drafts.map((draft) => createMemoryFromDraft(yearId, draft));

        if (existing) {
          return mapYears(current, (years) =>
            years.map((year) =>
              year.id === existing.id
                ? { ...year, items: [...year.items, ...newItems] }
                : year,
            ),
          );
        }

        return mapYears(current, (years) => [
          ...years,
          {
            id: yearId,
            year: yearNumber,
            label: label?.trim() || `${yearNumber} 年`,
            note: "",
            items: newItems,
          },
        ].sort((a, b) => a.year - b.year));
      });
    },
    [],
  );

  const updateMemory = useCallback(
    (yearId: string, memoryId: string, patch: Partial<Omit<MemoryItem, "id" | "yearId">>) => {
      setCollection((current) =>
        mapYears(current, (years) =>
          years.map((year) =>
            year.id === yearId
              ? {
                  ...year,
                  items: year.items.map((memory) =>
                    memory.id === memoryId ? { ...memory, ...patch } : memory,
                  ),
                }
              : year,
          ),
        ),
      );
    },
    [],
  );

  const moveMemoryToYear = useCallback(
    (fromYearId: string, memoryId: string, toYearId: string) => {
      if (fromYearId === toYearId) return;

      setCollection((current) => {
        const sourceYear = current.years.find((year) => year.id === fromYearId);
        const memory = sourceYear?.items.find((item) => item.id === memoryId);
        if (!memory) return current;

        return mapYears(current, (years) =>
          years.map((year) => {
            if (year.id === fromYearId) {
              return {
                ...year,
                items: year.items.filter((item) => item.id !== memoryId),
              };
            }

            if (year.id === toYearId) {
              return {
                ...year,
                items: [...year.items, { ...memory, yearId: toYearId }],
              };
            }

            return year;
          }),
        );
      });
    },
    [],
  );

  const deleteMemory = useCallback((yearId: string, memoryId: string) => {
    setCollection((current) =>
      mapYears(current, (years) =>
        years.map((year) =>
          year.id === yearId
            ? {
                ...year,
                items: year.items.filter((memory) => memory.id !== memoryId),
              }
            : year,
        ),
      ),
    );
  }, []);

  const toggleLike = useCallback((memoryId: string) => {
    setCollection((current) =>
      mapYears(current, (years) =>
        years.map((year) => ({
          ...year,
          items: year.items.map((memory) =>
            memory.id === memoryId
              ? { ...memory, liked: !memory.liked }
              : memory,
          ),
        })),
      ),
    );
  }, []);

  const resetAllData = useCallback(() => {
    setCollection(initialMemoirs);
  }, []);

  const value = useMemo<MemoirContextValue>(
    () => ({
      collection,
      isReady,
      saveState,
      storageMode,
      updateCollection,
      replaceCollection,
      addYear,
      updateYear,
      deleteYear,
      toggleYearHidden,
      reorderYears,
      reorderItems,
      addMemory,
      addMemoriesToYear,
      updateMemory,
      moveMemoryToYear,
      deleteMemory,
      toggleLike,
      resetAllData,
    }),
    [
      addMemory,
      addMemoriesToYear,
      addYear,
      collection,
      deleteMemory,
      deleteYear,
      isReady,
      moveMemoryToYear,
      replaceCollection,
      reorderItems,
      reorderYears,
      resetAllData,
      saveState,
      storageMode,
      toggleLike,
      toggleYearHidden,
      updateCollection,
      updateMemory,
      updateYear,
    ],
  );

  return <MemoirContext.Provider value={value}>{children}</MemoirContext.Provider>;
}

export function useMemoirs() {
  const context = useContext(MemoirContext);
  if (!context) {
    throw new Error("useMemoirs must be used inside MemoirProvider.");
  }

  return context;
}
