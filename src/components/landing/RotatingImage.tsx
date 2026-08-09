import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface RotatingImageProps {
  images: string[];
  caption?: string;
  className?: string;
  intervalMs?: number;
  delayMs?: number;
  showDots?: boolean;
}

/** Shows one image; if more than one is provided it cross-fades every 2s. */
export function RotatingImage({ images, caption, className, intervalMs = 2000, delayMs = 0, showDots = true }: RotatingImageProps) {
  const list = (images || []).filter(Boolean);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (list.length < 2) return;
    let interval: ReturnType<typeof setInterval>;
    const start = setTimeout(() => {
      interval = setInterval(() => setIndex((i) => (i + 1) % list.length), intervalMs);
    }, delayMs);
    return () => { clearTimeout(start); if (interval) clearInterval(interval); };
  }, [list.length, intervalMs, delayMs]);

  if (list.length === 0) {
    return (
      <div className={cn("glass-card flex items-center justify-center rounded-2xl text-xs text-muted-foreground", className)}>
        Chưa có ảnh
      </div>
    );
  }

  return (
    <div className={cn("group relative overflow-hidden rounded-2xl glass-card", className)}>
      <AnimatePresence mode="sync">
        <motion.img
          key={list[index] + index}
          src={list[index]}
          alt={caption || "Hình ảnh trung tâm"}
          loading="lazy"
          initial={{ opacity: 0, scale: 1.04 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6 }}
          className="absolute inset-0 h-full w-full object-cover"
        />
      </AnimatePresence>
      {caption && (
        <div className="absolute inset-x-0 bottom-0 z-10 bg-gradient-to-t from-background/90 to-transparent p-3 text-xs font-semibold text-foreground">
          {caption}
        </div>
      )}
      {showDots && list.length > 1 && (
        <div className="absolute right-2 top-2 z-10 flex gap-1">
          {list.map((_, i) => (
            <span key={i} className={cn("h-1.5 w-1.5 rounded-full transition-colors", i === index ? "bg-primary" : "bg-foreground/30")} />
          ))}
        </div>
      )}
    </div>
  );
}
