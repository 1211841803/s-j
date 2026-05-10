import type { MemoryFilter } from "../types/memoir";

const filters: Array<{ value: MemoryFilter; label: string }> = [
  { value: "all", label: "全部" },
  { value: "photo", label: "照片" },
  { value: "video", label: "视频" },
];

interface FilterBarProps {
  value: MemoryFilter;
  onChange(value: MemoryFilter): void;
}

export function FilterBar({ value, onChange }: FilterBarProps) {
  return (
    <div className="sticky top-0 z-30 safe-top border-b border-ink/8 bg-canvas/88 px-4 pb-3 pt-3 backdrop-blur-2xl">
      <div className="mx-auto flex max-w-5xl rounded-full border border-white/70 bg-white/68 p-1 shadow-glass">
        {filters.map((filter) => {
          const active = filter.value === value;

          return (
            <button
              key={filter.value}
              type="button"
              onClick={() => onChange(filter.value)}
              className={`min-h-12 flex-1 rounded-full px-4 text-base font-semibold transition ${
                active
                  ? "bg-ink text-paper shadow-soft"
                  : "text-ink/62 hover:bg-white/80"
              }`}
            >
              {filter.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
