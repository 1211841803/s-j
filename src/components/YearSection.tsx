import { Images } from "lucide-react";
import { Link } from "react-router-dom";
import type { MemoryItem, YearBlock } from "../types/memoir";
import { MemoryStack } from "./MemoryStack";

interface YearSectionProps {
  year: YearBlock;
  items: MemoryItem[];
  onLike(memoryId: string): void;
  register(node: HTMLElement | null): void;
}

export function YearSection({ year, items, onLike, register }: YearSectionProps) {
  return (
    <section
      id={year.id}
      ref={register}
      data-year={year.year}
      className="scroll-mt-24 py-6 sm:scroll-mt-28 sm:py-12"
    >
      <div className="mb-5 px-1 sm:mb-8">
        <p className="mb-2 text-base font-bold text-clay">{year.year}</p>
        <h2 className="text-4xl font-semibold leading-tight text-ink sm:text-5xl">
          {year.label}
        </h2>
        {year.note ? (
          <p className="mt-4 max-w-2xl text-lg leading-relaxed text-ink/62">
            {year.note}
          </p>
        ) : null}
      </div>
      <MemoryStack items={items} onLike={onLike} />
      {items.length === 0 ? (
        <Link
          to="/admin"
          className="mt-4 inline-flex min-h-[3.25rem] w-full items-center justify-center gap-2 rounded-2xl bg-sage px-5 text-lg font-bold text-white shadow-soft"
        >
          <Images className="h-5 w-5" aria-hidden="true" />
          添加这一年的照片/视频
        </Link>
      ) : null}
    </section>
  );
}
