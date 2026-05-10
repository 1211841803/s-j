import {
  CalendarPlus,
  Check,
  Eye,
  Heart,
  ImagePlus,
  Images,
  Pencil,
  Plus,
  Trash2,
  Upload,
  Video,
} from "lucide-react";
import {
  type ChangeEvent,
  type FormEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useMemoirs } from "../hooks/useMemoirs";
import { fileToSharedMemoryDraft, readHeroFile } from "../services/cloudMedia";
import type { MemoryDraft, MemoryItem, YearBlock } from "../types/memoir";
import { getYearFromDate } from "../utils/mediaFiles";
import { MemoryStack } from "./MemoryStack";
import { MobileYearRail } from "./MobileYearRail";
import { OpeningHero } from "./OpeningHero";
import { TimelineNav } from "./TimelineNav";

const INTRO_COPY = "时光不语，却在这些定格的光影里写满了爱与牵挂";

export function ClientView() {
  const {
    collection,
    saveState,
    storageMode,
    updateCollection,
    addYear,
    updateYear,
    deleteYear,
    addMemoriesToYear,
    updateMemory,
    deleteMemory,
    toggleLike,
  } = useMemoirs();
  const visibleYears = useMemo(
    () => collection.years.filter((year) => !year.hidden),
    [collection.years],
  );
  const [mode, setMode] = useState<"preview" | "edit">("preview");
  const [unlocked, setUnlocked] = useState(false);
  const [activeYear, setActiveYear] = useState<number | undefined>(
    visibleYears[0]?.year,
  );
  const [newYear, setNewYear] = useState(String(new Date().getFullYear()));
  const [newLabel, setNewLabel] = useState("");
  const [isImporting, setIsImporting] = useState(false);
  const mediaInputRef = useRef<HTMLInputElement | null>(null);
  const heroInputRef = useRef<HTMLInputElement | null>(null);
  const uploadTargetYear = useRef<YearBlock | null>(null);
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({});

  useEffect(() => {
    if (!visibleYears.some((year) => year.year === activeYear)) {
      setActiveYear(visibleYears[0]?.year);
    }
  }, [activeYear, visibleYears]);

  useEffect(() => {
    if (mode !== "preview") return;
    const sections = Object.values(sectionRefs.current).filter(
      (section): section is HTMLElement => section !== null,
    );
    if (sections.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible?.target instanceof HTMLElement) {
          const year = Number(visible.target.dataset.year);
          if (!Number.isNaN(year)) setActiveYear(year);
        }
      },
      { rootMargin: "-34% 0px -48% 0px", threshold: [0.08, 0.22, 0.38] },
    );

    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, [mode, visibleYears]);

  const handleHeroUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      updateCollection({ heroImage: await readHeroFile(file) });
    } catch (error) {
      window.alert(error instanceof Error ? error.message : "封面上传失败。");
    }
    event.target.value = "";
  };

  const handleMediaUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    const targetYear = uploadTargetYear.current;
    uploadTargetYear.current = null;
    if (files.length === 0) return;

    setIsImporting(true);
    try {
      const drafts = (await Promise.all(files.map(fileToSharedMemoryDraft))).filter(
        (draft): draft is MemoryDraft => draft !== null,
      );

      if (targetYear) {
        addMemoriesToYear(targetYear.year, targetYear.label, drafts);
      } else {
        const grouped = new Map<number, MemoryDraft[]>();
        drafts.forEach((draft) => {
          const year = getYearFromDate(draft.date);
          grouped.set(year, [...(grouped.get(year) ?? []), draft]);
        });
        grouped.forEach((yearDrafts, year) => {
          addMemoriesToYear(year, `${year} 年`, yearDrafts);
        });
      }
    } catch (error) {
      window.alert(error instanceof Error ? error.message : "照片/视频上传失败。");
    } finally {
      setIsImporting(false);
      event.target.value = "";
    }
  };

  const openUpload = (target?: YearBlock) => {
    uploadTargetYear.current = target ?? null;
    mediaInputRef.current?.click();
  };

  const handleAddYear = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const year = Number(newYear);
    if (!Number.isInteger(year) || year < 1900 || year > 2100) return;
    addYear(year, newLabel);
    setNewYear(String(year + 1));
    setNewLabel("");
  };

  const unlock = () => {
    setUnlocked(true);
    window.setTimeout(() => {
      document.getElementById("memoirs")?.scrollIntoView({ behavior: "smooth" });
    }, 90);
  };

  return (
    <>
      <input
        ref={mediaInputRef}
        type="file"
        multiple
        accept="image/*,video/*"
        className="hidden"
        onChange={handleMediaUpload}
      />
      <input
        ref={heroInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleHeroUpload}
      />

      <OpeningHero
        image={collection.heroImage}
        title={collection.familyName}
        text={collection.welcomeText.trim() || INTRO_COPY}
        visible={mode === "preview" && !unlocked}
        onUnlock={unlock}
      />

      <main id="memoirs" className="memoir-bg min-h-screen text-ink">
        {mode === "preview" ? (
          <button
            type="button"
            onClick={() => setMode("edit")}
            className="fixed right-4 top-4 z-40 inline-flex min-h-11 items-center gap-2 rounded-full bg-white/32 px-3 text-sm font-bold text-white/70 shadow-glass backdrop-blur-xl transition hover:bg-white/70 hover:text-ink"
          >
            <Pencil className="h-4 w-4" aria-hidden="true" />
            编辑
          </button>
        ) : (
          <div className="px-4 pt-4 sm:px-8 lg:px-10">
            <div className="mx-auto max-w-md rounded-[1.75rem] border border-white/70 bg-white/76 p-1.5 shadow-glass backdrop-blur-2xl">
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setMode("preview");
                    setUnlocked(false);
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                  className="inline-flex min-h-12 flex-1 items-center justify-center gap-2 rounded-full bg-ink px-3 font-bold text-paper"
                >
                  <Eye className="h-5 w-5" aria-hidden="true" />
                  完成预览
                </button>
                <button
                  type="button"
                  onClick={() => openUpload()}
                  disabled={isImporting}
                  className="inline-flex min-h-12 flex-1 items-center justify-center gap-2 rounded-full bg-sage px-3 font-bold text-white disabled:opacity-60"
                >
                  <Upload className="h-5 w-5" aria-hidden="true" />
                  添加
                </button>
              </div>
              <p className="px-4 pb-2 pt-2 text-center text-sm font-semibold text-ink/54">
                {saveState === "saving"
                  ? "正在保存"
                  : storageMode === "cloud" && saveState === "saved"
                    ? "云端已保存，其他设备刷新可见"
                    : "本机预览；部署到 Netlify 后自动同步"}
              </p>
            </div>
          </div>
        )}

        {mode === "preview" ? (
          visibleYears.length > 0 ? (
            <PreviewMemoir
              years={visibleYears}
              activeYear={activeYear}
              onLike={toggleLike}
              onSelectYear={(yearId) =>
                sectionRefs.current[yearId]?.scrollIntoView({
                  behavior: "smooth",
                  block: "start",
                })
              }
              register={(yearId, node) => {
                sectionRefs.current[yearId] = node;
              }}
            />
          ) : (
            <EmptyPreview />
          )
        ) : (
          <EditMemoir
            collection={collection}
            years={visibleYears}
            newYear={newYear}
            newLabel={newLabel}
            isImporting={isImporting}
            onCollectionChange={updateCollection}
            onHeroUpload={() => heroInputRef.current?.click()}
            onUpload={openUpload}
            onNewYear={setNewYear}
            onNewLabel={setNewLabel}
            onAddYear={handleAddYear}
            onUpdateYear={updateYear}
            onDeleteYear={deleteYear}
            onUpdateMemory={updateMemory}
            onDeleteMemory={deleteMemory}
            onLike={toggleLike}
          />
        )}
      </main>
    </>
  );
}

function EmptyPreview() {
  return (
    <section className="mx-auto flex min-h-[72svh] max-w-3xl items-center px-4 py-16 text-center">
      <div className="glass w-full rounded-lg p-8">
        <p className="text-3xl font-semibold">回忆录正在准备中</p>
        <p className="mt-4 text-lg leading-relaxed text-ink/58">
          点击角落里的编辑入口，添加封面、年份、照片和视频。
        </p>
      </div>
    </section>
  );
}

function PreviewMemoir({
  years,
  activeYear,
  onLike,
  onSelectYear,
  register,
}: {
  years: YearBlock[];
  activeYear?: number;
  onLike(memoryId: string): void;
  onSelectYear(yearId: string): void;
  register(yearId: string, node: HTMLElement | null): void;
}) {
  return (
    <div className="mx-auto grid w-full max-w-6xl grid-cols-1 px-4 pb-24 pt-4 sm:grid-cols-[8rem_minmax(0,1fr)] sm:px-6 lg:px-8">
      <TimelineNav years={years} activeYear={activeYear} onSelect={onSelectYear} />
      <div className="min-w-0">
        <MobileYearRail years={years} activeYear={activeYear} onSelect={onSelectYear} />
        {years.map((year) => {
          const items = year.items.filter((item) => !item.hidden);
          const labelIsYear =
            year.label.trim() === `${year.year}` ||
            year.label.trim() === `${year.year} 年`;

          return (
            <section
              key={year.id}
              id={year.id}
              ref={(node) => register(year.id, node)}
              data-year={year.year}
              className="scroll-mt-24 py-6 sm:scroll-mt-28 sm:py-12"
            >
              <div className="mb-5 px-1 sm:mb-8">
                <h2 className="text-5xl font-semibold leading-tight text-ink sm:text-6xl">
                  {year.year}
                </h2>
                {!labelIsYear && year.label.trim() ? (
                  <p className="mt-3 text-2xl font-semibold text-clay">
                    {year.label}
                  </p>
                ) : null}
                {year.note ? (
                  <p className="mt-4 max-w-2xl text-lg leading-relaxed text-ink/62">
                    {year.note}
                  </p>
                ) : null}
              </div>
              <MemoryStack items={items} onLike={onLike} />
            </section>
          );
        })}
      </div>
    </div>
  );
}

function EditMemoir({
  collection,
  years,
  newYear,
  newLabel,
  isImporting,
  onCollectionChange,
  onHeroUpload,
  onUpload,
  onNewYear,
  onNewLabel,
  onAddYear,
  onUpdateYear,
  onDeleteYear,
  onUpdateMemory,
  onDeleteMemory,
  onLike,
}: {
  collection: { familyName: string; welcomeText: string; heroImage?: string };
  years: YearBlock[];
  newYear: string;
  newLabel: string;
  isImporting: boolean;
  onCollectionChange(patch: Partial<typeof collection>): void;
  onHeroUpload(): void;
  onUpload(year?: YearBlock): void;
  onNewYear(value: string): void;
  onNewLabel(value: string): void;
  onAddYear(event: FormEvent<HTMLFormElement>): void;
  onUpdateYear(yearId: string, patch: Partial<Pick<YearBlock, "year" | "label" | "note">>): void;
  onDeleteYear(yearId: string): void;
  onUpdateMemory(yearId: string, memoryId: string, patch: Partial<Omit<MemoryItem, "id" | "yearId">>): void;
  onDeleteMemory(yearId: string, memoryId: string): void;
  onLike(memoryId: string): void;
}) {
  return (
    <div className="mx-auto max-w-7xl px-4 pb-16 pt-4 sm:px-8 lg:px-10">
      <section className="grid gap-4 lg:grid-cols-[minmax(20rem,0.85fr)_minmax(0,1.15fr)]">
        <div className="relative min-h-[22rem] overflow-hidden rounded-lg bg-[linear-gradient(145deg,#2d2924,#667864_56%,#9a5b44)] p-5 text-paper shadow-soft">
          {collection.heroImage ? (
            <img src={collection.heroImage} alt="" className="absolute inset-0 h-full w-full object-cover" />
          ) : null}
          <div className="absolute inset-0 bg-gradient-to-b from-black/18 via-black/18 to-black/58" />
          <div className="relative flex h-full min-h-[20rem] flex-col justify-between">
            <div>
              <p className="text-sm font-bold tracking-[0.22em] text-paper/76">编辑封面</p>
              <textarea
                value={collection.familyName}
                onChange={(event) => onCollectionChange({ familyName: event.target.value })}
                rows={2}
                aria-label="相册名称"
                className="mt-5 w-full resize-none bg-transparent text-4xl font-semibold leading-tight text-paper outline-none placeholder:text-paper/50"
                placeholder="写下相册名称"
              />
              <textarea
                value={collection.welcomeText}
                onChange={(event) => onCollectionChange({ welcomeText: event.target.value })}
                rows={3}
                aria-label="欢迎语"
                className="mt-4 w-full resize-none bg-transparent text-lg leading-relaxed text-paper/82 outline-none placeholder:text-paper/50"
                placeholder="写一句开场的话"
              />
            </div>
            <button
              type="button"
              onClick={onHeroUpload}
              className="glass-dark inline-flex min-h-[3.25rem] items-center justify-center gap-2 rounded-full px-5 text-lg font-bold text-paper"
            >
              <ImagePlus className="h-6 w-6" aria-hidden="true" />
              {collection.heroImage ? "更换封面" : "添加封面"}
            </button>
          </div>
        </div>

        <div className="rounded-lg border border-ink/10 bg-white/72 p-4 shadow-glass">
          <p className="text-sm font-bold text-clay">轻量编辑</p>
          <h1 className="mt-1 text-3xl font-semibold">添加内容后切到预览，就是回忆录成品</h1>
          <p className="mt-3 text-lg leading-relaxed text-ink/58">
            这里不是后台表格，而是把封面、年份和照片视频放在回忆录对应的位置上编辑。
          </p>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => onUpload()}
              disabled={isImporting}
              className="inline-flex min-h-16 items-center justify-center gap-2 rounded-2xl bg-ink px-5 text-lg font-bold text-paper shadow-soft disabled:opacity-60"
            >
              <Upload className="h-6 w-6" aria-hidden="true" />
              {isImporting ? "正在添加" : "添加照片/视频"}
            </button>
            <form onSubmit={onAddYear} className="grid gap-2">
              <div className="grid grid-cols-[7rem_minmax(0,1fr)] gap-2">
                <input
                  value={newYear}
                  onChange={(event) => onNewYear(event.target.value)}
                  type="number"
                  inputMode="numeric"
                  aria-label="新增年份"
                  className="min-h-12 rounded-2xl border border-ink/12 bg-white px-4 text-lg font-bold outline-none ring-clay/20 focus:ring-4"
                />
                <input
                  value={newLabel}
                  onChange={(event) => onNewLabel(event.target.value)}
                  aria-label="新增年份标题"
                  placeholder="年份标题"
                  className="min-h-12 rounded-2xl border border-ink/12 bg-white px-4 outline-none ring-clay/20 focus:ring-4"
                />
              </div>
              <button type="submit" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-clay px-5 font-bold text-white shadow-soft">
                <CalendarPlus className="h-5 w-5" aria-hidden="true" />
                添加年份
              </button>
            </form>
          </div>
        </div>
      </section>

      <section className="mt-5 grid gap-5">
        {years.length === 0 ? (
          <div className="grid gap-4 rounded-lg border border-dashed border-ink/18 bg-white/58 p-5 text-center shadow-glass sm:grid-cols-3">
            <SetupHint title="1. 放封面" text="点击封面上的按钮上传一张主图。" />
            <SetupHint title="2. 加年份" text="手动添加年份，或上传照片自动分年。" />
            <SetupHint title="3. 切预览" text="完成后点顶部预览，查看漂亮相册。" />
          </div>
        ) : (
          years.map((year) => (
            <EditYearBlock
              key={year.id}
              year={year}
              onUpload={() => onUpload(year)}
              onUpdateYear={(patch) => onUpdateYear(year.id, patch)}
              onDeleteYear={() => {
                if (window.confirm(`删除 ${year.year} 年和里面的内容？`)) onDeleteYear(year.id);
              }}
              onUpdateMemory={(memoryId, patch) => onUpdateMemory(year.id, memoryId, patch)}
              onDeleteMemory={(memoryId) => {
                if (window.confirm("删除这条内容？")) onDeleteMemory(year.id, memoryId);
              }}
              onLike={onLike}
            />
          ))
        )}
      </section>
    </div>
  );
}

function SetupHint({ title, text }: { title: string; text: string }) {
  return (
    <div>
      <p className="text-xl font-semibold">{title}</p>
      <p className="mt-2 text-ink/58">{text}</p>
    </div>
  );
}

function EditYearBlock({
  year,
  onUpload,
  onUpdateYear,
  onDeleteYear,
  onUpdateMemory,
  onDeleteMemory,
  onLike,
}: {
  year: YearBlock;
  onUpload(): void;
  onUpdateYear(patch: Partial<Pick<YearBlock, "year" | "label" | "note">>): void;
  onDeleteYear(): void;
  onUpdateMemory(memoryId: string, patch: Partial<Omit<MemoryItem, "id" | "yearId">>): void;
  onDeleteMemory(memoryId: string): void;
  onLike(memoryId: string): void;
}) {
  return (
    <article className="rounded-lg border border-ink/10 bg-white/72 p-4 shadow-glass">
      <div className="mb-4 grid gap-3 lg:grid-cols-[8rem_minmax(0,1fr)_auto] lg:items-start">
        <input
          value={year.year}
          type="number"
          inputMode="numeric"
          aria-label="年份"
          onChange={(event) => onUpdateYear({ year: Number(event.target.value) })}
          className="min-h-[3.25rem] rounded-2xl border border-ink/12 bg-canvas px-4 text-3xl font-semibold outline-none ring-clay/20 focus:ring-4"
        />
        <div className="grid gap-2">
          <input
            value={year.label}
            aria-label="年份标题"
            onChange={(event) => onUpdateYear({ label: event.target.value })}
            className="min-h-[3.25rem] rounded-2xl border border-ink/12 bg-canvas px-4 text-2xl font-semibold outline-none ring-clay/20 focus:ring-4"
            placeholder="这一年的标题"
          />
          <textarea
            value={year.note}
            aria-label="年份说明"
            onChange={(event) => onUpdateYear({ note: event.target.value })}
            rows={2}
            className="min-h-20 resize-y rounded-2xl border border-ink/12 bg-canvas px-4 py-3 outline-none ring-clay/20 focus:ring-4"
            placeholder="写一点这一年的说明"
          />
        </div>
        <div className="flex gap-2 lg:justify-end">
          <button type="button" onClick={onUpload} className="inline-flex min-h-[3.25rem] flex-1 items-center justify-center gap-2 rounded-2xl bg-sage px-4 font-bold text-white shadow-soft lg:flex-none">
            <Plus className="h-5 w-5" aria-hidden="true" />
            添加内容
          </button>
          <button type="button" onClick={onDeleteYear} className="grid min-h-[3.25rem] min-w-[3.25rem] place-items-center rounded-2xl bg-clay/10 text-clay" aria-label="删除年份">
            <Trash2 className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>
      </div>

      {year.items.length === 0 ? (
        <button type="button" onClick={onUpload} className="flex min-h-44 w-full flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed border-ink/16 bg-canvas/70 text-ink/56">
          <Upload className="h-10 w-10" aria-hidden="true" />
          <span className="text-xl font-bold">给 {year.year} 年添加照片/视频</span>
        </button>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {year.items.map((memory) => (
            <EditMemoryCard
              key={memory.id}
              memory={memory}
              onUpdate={(patch) => onUpdateMemory(memory.id, patch)}
              onDelete={() => onDeleteMemory(memory.id)}
              onLike={() => onLike(memory.id)}
            />
          ))}
        </div>
      )}
    </article>
  );
}

function EditMemoryCard({
  memory,
  onUpdate,
  onDelete,
  onLike,
}: {
  memory: MemoryItem;
  onUpdate(patch: Partial<Omit<MemoryItem, "id" | "yearId">>): void;
  onDelete(): void;
  onLike(): void;
}) {
  return (
    <div className="overflow-hidden rounded-lg border border-ink/10 bg-canvas">
      <div className="relative aspect-[4/3] bg-ink/8">
        {memory.mediaUrl ? (
          memory.kind === "video" ? (
            <video src={memory.mediaUrl} poster={memory.posterUrl} controls className="h-full w-full object-cover" />
          ) : (
            <img src={memory.mediaUrl} alt={memory.alt || memory.title} className="h-full w-full object-cover" />
          )
        ) : (
          <div className="grid h-full place-items-center text-ink/34">
            {memory.kind === "video" ? <Video className="h-12 w-12" aria-hidden="true" /> : <Images className="h-12 w-12" aria-hidden="true" />}
          </div>
        )}
        <button type="button" onClick={onLike} className={`absolute right-3 top-3 inline-flex min-h-10 items-center gap-1 rounded-full px-3 text-sm font-bold ${memory.liked ? "bg-clay text-white" : "bg-white/82 text-ink/62"}`}>
          {memory.liked ? <Check className="h-4 w-4" aria-hidden="true" /> : <Heart className="h-4 w-4" aria-hidden="true" />}
          {memory.liked ? "已喜欢" : "喜欢"}
        </button>
      </div>
      <div className="grid gap-2 p-3">
        <div className="grid grid-cols-[6rem_minmax(0,1fr)] gap-2">
          <select
            value={memory.kind}
            aria-label="类型"
            onChange={(event) => onUpdate({ kind: event.target.value as MemoryItem["kind"] })}
            className="min-h-11 rounded-xl border border-ink/12 bg-white px-3 font-bold outline-none"
          >
            <option value="photo">照片</option>
            <option value="video">视频</option>
          </select>
          <input
            value={memory.date}
            type="date"
            aria-label="日期"
            onChange={(event) => onUpdate({ date: event.target.value })}
            className="min-h-11 rounded-xl border border-ink/12 bg-white px-3 font-bold outline-none"
          />
        </div>
        <input value={memory.title} aria-label="标题" onChange={(event) => onUpdate({ title: event.target.value })} className="min-h-11 rounded-xl border border-ink/12 bg-white px-3 text-lg font-bold outline-none" placeholder="标题" />
        <div className="grid gap-2 sm:grid-cols-[8rem_minmax(0,1fr)]">
          <input value={memory.place} aria-label="地点" onChange={(event) => onUpdate({ place: event.target.value })} className="min-h-11 rounded-xl border border-ink/12 bg-white px-3 outline-none" placeholder="地点" />
          <input value={memory.caption} aria-label="说明" onChange={(event) => onUpdate({ caption: event.target.value })} className="min-h-11 rounded-xl border border-ink/12 bg-white px-3 outline-none" placeholder="说明" />
        </div>
        <button type="button" onClick={onDelete} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-clay/10 font-bold text-clay">
          <Trash2 className="h-5 w-5" aria-hidden="true" />
          删除
        </button>
      </div>
    </div>
  );
}
