"use client";

import { useLayoutEffect, useRef } from "react";
import { cn } from "@/lib/utils";

/** Fixed filter control — width never grows with the selected label. */
export const FILTER_SELECT_TRIGGER =
  "h-11 w-full min-w-0 max-w-full overflow-x-hidden overflow-y-visible rounded-xl border-border/70 bg-surface px-3 py-0 text-sm shadow-none whitespace-normal data-[size=default]:h-11 sm:w-44 sm:min-w-44 sm:max-w-44 sm:shrink-0 *:data-[slot=select-value]:min-w-0 *:data-[slot=select-value]:flex-1 *:data-[slot=select-value]:overflow-x-hidden *:data-[slot=select-value]:overflow-y-visible *:data-[slot=select-value]:line-clamp-none";

/** Shrinks text to stay on one line inside a fixed-width parent. */
export function FitLabel({
  children,
  className,
  maxPx = 14,
  minPx = 11,
}: {
  children: string;
  className?: string;
  maxPx?: number;
  minPx?: number;
}) {
  const ref = useRef<HTMLSpanElement>(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;

    const fit = () => {
      el.style.fontSize = `${maxPx}px`;
      let size = maxPx;
      while (size > minPx && el.scrollWidth > el.clientWidth + 0.5) {
        size -= 0.5;
        el.style.fontSize = `${size}px`;
      }
    };

    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(el);
    if (el.parentElement) ro.observe(el.parentElement);
    return () => ro.disconnect();
  }, [children, maxPx, minPx]);

  return (
    <span
      ref={ref}
      title={children}
      className={cn(
        "flex h-6 min-h-6 w-full min-w-0 items-center overflow-x-hidden overflow-y-visible text-left text-[14px] leading-6 whitespace-nowrap text-ellipsis",
        className
      )}
    >
      {children}
    </span>
  );
}
