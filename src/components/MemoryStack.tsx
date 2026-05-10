import { AnimatePresence, motion } from "framer-motion";
import { Heart, ImageIcon, Pause, Play, Video } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { MemoryItem } from "../types/memoir";

interface MemoryStackProps {
  items: MemoryItem[];
  onLike(memoryId: string): void;
}

export function MemoryStack({ items, onLike }: MemoryStackProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    setActiveIndex((current) => Math.min(current, Math.max(items.length - 1, 0)));
  }, [items.length]);

  const stopVoice = useCallback(() => {
    audioRef.current?.pause();
    audioRef.current = null;

    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }

    setPlayingId(null);
  }, []);

  useEffect(() => stopVoice, [stopVoice]);

  const playVoice = useCallback(
    (item: MemoryItem) => {
      if (!item.voiceMemo) return;

      if (playingId === item.id) {
        stopVoice();
        return;
      }

      stopVoice();
      setPlayingId(item.id);

      if (item.voiceMemo.audioUrl) {
        const audio = new Audio(item.voiceMemo.audioUrl);
        audioRef.current = audio;
        audio.addEventListener("ended", () => setPlayingId(null), { once: true });
        audio.addEventListener("error", () => setPlayingId(null), { once: true });
        void audio.play().catch(() => setPlayingId(null));
        return;
      }

      if (item.voiceMemo.transcript && "speechSynthesis" in window) {
        const utterance = new SpeechSynthesisUtterance(item.voiceMemo.transcript);
        utterance.lang = "zh-CN";
        utterance.rate = 0.92;
        utterance.pitch = 0.96;
        utterance.onend = () => setPlayingId(null);
        utterance.onerror = () => setPlayingId(null);
        window.speechSynthesis.speak(utterance);
      }
    },
    [playingId, stopVoice],
  );

  const visibleCards = useMemo(() => {
    return items.slice(activeIndex, activeIndex + 3).reverse();
  }, [activeIndex, items]);

  const showPrevious = useCallback(() => {
    setActiveIndex((current) => Math.max(0, current - 1));
  }, []);

  const showNext = useCallback(() => {
    setActiveIndex((current) => Math.min(items.length - 1, current + 1));
  }, [items.length]);

  if (items.length === 0) {
    return (
      <div className="glass flex min-h-64 items-center justify-center rounded-lg px-8 text-center text-lg font-medium text-ink/54">
        这一类回忆暂时空着
      </div>
    );
  }

  return (
    <div className="relative mx-auto w-full max-w-[30rem]">
      <div className="relative h-[min(64svh,32rem)] min-h-[25rem] w-full">
        <AnimatePresence initial={false}>
          {visibleCards.map((item, renderIndex) => {
            const depth = visibleCards.length - 1 - renderIndex;
            const isTop = depth === 0;
            const isPlaying = playingId === item.id;

            return (
              <motion.article
                key={item.id}
                className="absolute inset-0 overflow-hidden rounded-lg bg-ink shadow-soft"
                style={{
                  zIndex: 20 - depth,
                  transformOrigin: "50% 100%",
                }}
                initial={{ opacity: 0, y: 26, scale: 0.94, rotate: -2 }}
                animate={{
                  opacity: 1,
                  y: depth * 15,
                  scale: isPlaying ? 1.025 - depth * 0.045 : 1 - depth * 0.045,
                  rotate: depth === 0 ? 0 : depth % 2 === 0 ? -4 : 4,
                }}
                exit={{ opacity: 0, x: -130, rotate: -9, scale: 0.92 }}
                transition={{ type: "spring", stiffness: 260, damping: 28 }}
                drag={isTop ? "x" : false}
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.26}
                onDragEnd={(_, info) => {
                  if (info.offset.x < -74 || info.velocity.x < -420) showNext();
                  if (info.offset.x > 74 || info.velocity.x > 420) showPrevious();
                }}
                whileTap={isTop ? { scale: isPlaying ? 1.018 : 0.992 } : undefined}
              >
                {item.mediaUrl ? (
                  item.kind === "video" ? (
                    <video
                      src={item.mediaUrl}
                      poster={item.posterUrl}
                      controls={isTop}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <img
                      src={item.mediaUrl}
                      alt={item.alt || item.title}
                      className="h-full w-full object-cover"
                    />
                  )
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-[linear-gradient(145deg,#e9e2d7,#dfe8dd)] text-ink/36">
                    {item.kind === "photo" ? (
                      <ImageIcon className="h-16 w-16" aria-hidden="true" />
                    ) : (
                      <Video className="h-16 w-16" aria-hidden="true" />
                    )}
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-black/72" />

                <div className="absolute left-4 top-4 flex gap-2">
                  <span className="glass-dark flex min-h-11 items-center gap-2 rounded-full px-4 text-sm font-bold text-paper">
                    {item.kind === "photo" ? (
                      <ImageIcon className="h-4 w-4" aria-hidden="true" />
                    ) : (
                      <Video className="h-4 w-4" aria-hidden="true" />
                    )}
                    {item.date}
                  </span>
                </div>

                {item.kind === "video" && !isTop ? (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="glass-dark grid h-20 w-20 place-items-center rounded-full text-paper">
                      <Play className="ml-1 h-9 w-9 fill-current" aria-hidden="true" />
                    </span>
                  </div>
                ) : null}

                {item.voiceMemo ? (
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      playVoice(item);
                    }}
                    className="glass-dark absolute right-4 top-4 grid min-h-14 min-w-14 place-items-center rounded-full text-paper"
                    aria-label={isPlaying ? "暂停声音备忘录" : "播放声音备忘录"}
                  >
                    {isPlaying ? (
                      <Pause className="h-7 w-7 fill-current" aria-hidden="true" />
                    ) : (
                      <Play className="ml-0.5 h-7 w-7 fill-current" aria-hidden="true" />
                    )}
                  </button>
                ) : null}

                <div className="absolute inset-x-0 bottom-0 p-5 text-paper">
                  <div className="mb-4 flex items-end justify-between gap-4">
                    <div className="min-w-0">
                      {item.place ? (
                        <p className="mb-2 text-sm font-semibold text-paper/72">
                          {item.place}
                        </p>
                      ) : null}
                      {item.title.trim() ? (
                        <h3 className="text-3xl font-semibold leading-tight">
                          {item.title}
                        </h3>
                      ) : null}
                    </div>
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        onLike(item.id);
                      }}
                      className={`grid min-h-14 min-w-14 shrink-0 place-items-center rounded-full transition ${
                        item.liked
                          ? "bg-rosewood text-paper"
                          : "bg-white/22 text-paper backdrop-blur"
                      }`}
                      aria-label={item.liked ? "取消喜欢" : "喜欢这张回忆"}
                    >
                      <Heart
                        className={`h-7 w-7 ${item.liked ? "fill-current" : ""}`}
                        aria-hidden="true"
                      />
                    </button>
                  </div>
                  <p className="line-clamp-2 text-base leading-relaxed text-paper/84">
                    {item.caption}
                  </p>
                </div>
              </motion.article>
            );
          })}
        </AnimatePresence>
      </div>

      <div className="mt-7 flex items-center justify-center">
        <div className="glass rounded-full px-5 py-3 text-base font-bold text-ink/72">
          {activeIndex + 1} / {items.length}
        </div>
      </div>
    </div>
  );
}
