import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface ImageSlideshowProps {
  images: string[];
  alt?: string;
  className?: string;
  imgClassName?: string;
  interval?: number;
}

/**
 * Hiển thị 1 ô ảnh. Nếu có từ 2 ảnh trở lên sẽ tự động chuyển ảnh sau mỗi 2 giây.
 */
export function ImageSlideshow({
  images,
  alt = "",
  className,
  imgClassName,
  interval = 2000,
}: ImageSlideshowProps) {
  const list = (images || []).filter(Boolean);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (list.length < 2) return;
    const id = setInterval(() => setIndex((i) => (i + 1) % list.length), interval);
    return () => clearInterval(id);
  }, [list.length, interval]);

  useEffect(() => { setIndex(0); }, [list.length]);

  if (list.length === 0) return null;

  return (
    <div className={cn("relative overflow-hidden", className)}>
      {list.map((src, i) => (
        <img
          key={src + i}
          src={src}
          alt={alt}
          loading="lazy"
          className={cn(
            "absolute inset-0 h-full w-full object-cover transition-opacity duration-700",
            i === index ? "opacity-100" : "opacity-0",
            imgClassName
          )}
        />
      ))}
      {/* giữ chiều cao bằng ảnh đầu tiên khi container không có kích thước cố định */}
      <img src={list[0]} alt="" aria-hidden className={cn("invisible h-full w-full object-cover", imgClassName)} />
      {list.length > 1 && (
        <div className="absolute bottom-2 left-1/2 z-10 flex -translate-x-1/2 gap-1.5">
          {list.map((_, i) => (
            <span
              key={i}
              className={cn(
                "h-1.5 rounded-full transition-all",
                i === index ? "w-4 bg-primary" : "w-1.5 bg-foreground/30"
              )}
            />
          ))}
        </div>
      )}
    </div>
  );
}
