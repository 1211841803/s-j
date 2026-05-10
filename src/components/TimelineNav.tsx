import type { YearBlock } from "../types/memoir";

interface TimelineNavProps {
  years: YearBlock[];
  activeYear?: number;
  onSelect(yearId: string): void;
}

export function TimelineNav({ years, activeYear, onSelect }: TimelineNavProps) {
  return (
    <nav
      aria-label="岁月时间轴"
      className="sticky top-24 hidden self-start pl-3 pr-1 sm:block"
    >
      <ol className="flex flex-col items-start">
        {years.map((year, index) => {
          const isActive = activeYear === year.year;
          const previous = years[index - 1];
          const hasGap = previous ? year.year - previous.year > 1 : false;

          return (
            <li key={year.id} className="flex min-h-16 items-start gap-2">
              <div className="flex w-5 flex-col items-center">
                <span
                  className={`h-4 border-l-2 ${
                    hasGap ? "border-dashed border-tea/38" : "border-tea/26"
                  }`}
                />
                <span
                  className={`h-3 w-3 rounded-full border-2 transition ${
                    isActive
                      ? "border-rosewood bg-rosewood"
                      : "border-tea/45 bg-paper"
                  }`}
                />
                <span className="min-h-8 flex-1 border-l-2 border-tea/24" />
              </div>
              <button
                type="button"
                onClick={() => onSelect(year.id)}
                className={`min-h-10 rounded-full px-3 text-sm font-semibold transition ${
                  isActive ? "bg-rosewood text-paper" : "text-ink/48"
                }`}
              >
                {year.year}
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
