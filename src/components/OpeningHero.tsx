import { AnimatePresence, motion } from "framer-motion";
import { ChevronUp } from "lucide-react";
import { useEffect, useState } from "react";

interface OpeningHeroProps {
  image?: string;
  title: string;
  text: string;
  visible: boolean;
  onUnlock(): void;
}

export function OpeningHero({
  image,
  title,
  text,
  visible,
  onUnlock,
}: OpeningHeroProps) {
  const [typedText, setTypedText] = useState("");

  useEffect(() => {
    if (!visible) return;

    setTypedText("");
    let index = 0;
    const timer = window.setInterval(() => {
      index += 1;
      setTypedText(text.slice(0, index));

      if (index >= text.length) {
        window.clearInterval(timer);
      }
    }, 86);

    return () => window.clearInterval(timer);
  }, [text, visible]);

  useEffect(() => {
    document.body.style.overflow = visible ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [visible]);

  return (
    <AnimatePresence>
      {visible ? (
        <motion.section
          aria-label="家庭回忆录开场"
          className="fixed inset-0 z-50 flex min-h-svh touch-none items-center justify-center overflow-hidden bg-ink text-paper"
          drag="y"
          dragConstraints={{ top: 0, bottom: 0 }}
          dragElastic={0.18}
          onDragEnd={(_, info) => {
            if (info.offset.y < -64 || info.velocity.y < -420) {
              onUnlock();
            }
          }}
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, y: "-14%" }}
          transition={{ duration: 0.48, ease: [0.22, 1, 0.36, 1] }}
        >
          {image ? (
            <img
              src={image}
              alt=""
              className="absolute inset-0 h-full w-full object-cover"
            />
          ) : (
            <div className="absolute inset-0 bg-[linear-gradient(145deg,#2d2924_0%,#667864_48%,#9a5b44_100%)]" />
          )}
          <div className="absolute inset-0 bg-gradient-to-b from-black/28 via-black/18 to-black/62" />
          <div className="relative mx-auto flex w-full max-w-xl flex-col items-center px-7 text-center">
            <motion.p
              className="mb-4 text-sm font-semibold tracking-[0.22em] text-paper/74"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.16 }}
            >
              {title}
            </motion.p>
            <motion.h1
              className="min-h-24 max-w-[19rem] font-serif text-3xl font-semibold leading-relaxed sm:max-w-md sm:text-5xl"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.26 }}
            >
              {typedText}
              <span className="ml-1 inline-block h-8 w-px translate-y-1 bg-paper/80" />
            </motion.h1>

            <motion.button
              type="button"
              onClick={onUnlock}
              className="glass-dark safe-bottom mt-12 flex min-h-16 min-w-16 flex-col items-center justify-center rounded-full px-5 text-paper"
              aria-label="进入时间轴"
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.2 }}
              whileTap={{ scale: 0.96 }}
            >
              <ChevronUp className="h-7 w-7 animate-bounce" aria-hidden="true" />
            </motion.button>
          </div>
        </motion.section>
      ) : null}
    </AnimatePresence>
  );
}
