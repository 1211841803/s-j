import type { YearBlock } from "../types/memoir";

interface MobileYearRailProps {
  years: YearBlock[];
  activeYear?: number;
  onSelect(yearId: string): void;
}

export function MobileYearRail({
  years,
  activeYear,
  onSelect,
}: MobileYearRailProps) {
  if (years.length === 0) return null;

  return (
    <div className="-mx-4 mb-6 overflow-x-auto px-4 pt-4 no-scrollbar sm:hidden">
      <div className="flex min-w-max items-center gap-2">
        {years.map((year, index) => {
          const isActive = activeYear === year.year;
          const previous = years[index - 1];
          const hasGap = previous ? year.year - previous.year > 1 : false;

          return (
            <div key={year.id} className="flex items-center gap-2">
              {index > 0 ? (
                <span
                  className={`h-px w-8 border-t-2 ${
                    hasGap ? "border-dashed border-sage/42" : "border-ink/12"
                  }`}
                />
              ) : null}
              <button
                type="button"
                onClick={() => onSelect(year.id)}
                className={`min-h-11 rounded-full px-4 text-sm font-bold shadow-sm transition ${
                  isActive
                    ? "bg-clay text-white"
                    : "glass text-ink/58 shadow-none"
                }`}
              >
                {year.year}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
