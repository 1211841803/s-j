export type MemoryKind = "photo" | "video";
export type MemoryFilter = "all" | MemoryKind;

export interface VoiceMemo {
  audioUrl?: string;
  transcript?: string;
}

export interface MemoryItem {
  id: string;
  yearId: string;
  kind: MemoryKind;
  title: string;
  date: string;
  place: string;
  mediaUrl: string;
  posterUrl?: string;
  alt: string;
  caption: string;
  voiceMemo?: VoiceMemo;
  liked: boolean;
  hidden?: boolean;
}

export type MemoryDraft = Omit<MemoryItem, "id" | "yearId">;

export interface YearBlock {
  id: string;
  year: number;
  label: string;
  note: string;
  hidden?: boolean;
  items: MemoryItem[];
}

export interface MemoirCollection {
  familyName: string;
  welcomeText: string;
  heroImage?: string;
  years: YearBlock[];
}
