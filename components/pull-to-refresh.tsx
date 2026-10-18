"use client";

import { isStandalonePwa } from "@/lib/pwa";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

// Installed PWAs lose Safari's native pull-to-refresh, so this reimplements
// it there. Browser tabs keep the native one.
const PULL_THRESHOLD = 70;
const MAX_PULL = 110;

export function PullToRefresh({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [pullDistance, setPullDistance] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const startY = useRef<number | null>(null);

  const handleTouchStart = useCallback((e: TouchEvent) => {
    // Skip if the page or any scroll area under the finger is scrolled.
    for (let el = e.target as Element | null; el; el = el.parentElement) {
      if (el.scrollTop > 0) return;
    }
    startY.current = e.touches[0].clientY;
  }, []);

  const handleTouchMove = useCallback(
    (e: TouchEvent) => {
      if (startY.current === null || refreshing) return;
      const delta = e.touches[0].clientY - startY.current;
      setPullDistance(delta > 0 ? Math.min(MAX_PULL, delta * 0.5) : 0);
    },
    [refreshing]
  );

  const handleTouchEnd = useCallback(() => {
    if (startY.current === null) return;
    startY.current = null;
    if (pullDistance >= PULL_THRESHOLD && !refreshing) {
      setRefreshing(true);
      router.refresh();
      // router.refresh() can't be awaited; just show the spinner briefly.
      setTimeout(() => {
        setRefreshing(false);
        setPullDistance(0);
      }, 600);
    } else {
      setPullDistance(0);
    }
  }, [pullDistance, refreshing, router]);

  // Checked here, not in render, so server and client render the same tree.
  useEffect(() => {
    if (!isStandalonePwa()) return;
    const opts = { passive: true };
    document.addEventListener("touchstart", handleTouchStart, opts);
    document.addEventListener("touchmove", handleTouchMove, opts);
    document.addEventListener("touchend", handleTouchEnd, opts);
    document.addEventListener("touchcancel", handleTouchEnd, opts);
    return () => {
      document.removeEventListener("touchstart", handleTouchStart);
      document.removeEventListener("touchmove", handleTouchMove);
      document.removeEventListener("touchend", handleTouchEnd);
      document.removeEventListener("touchcancel", handleTouchEnd);
    };
  }, [handleTouchStart, handleTouchMove, handleTouchEnd]);

  return (
    <>
      <div
        className="flex shrink-0 items-center justify-center overflow-hidden transition-[height] duration-200 ease-out"
        style={{ height: pullDistance }}
        aria-hidden={pullDistance === 0}
      >
        <Loader2
          className={cn(
            "h-5 w-5 text-muted-foreground",
            refreshing && "animate-spin"
          )}
          style={
            refreshing
              ? undefined
              : { transform: `rotate(${(pullDistance / PULL_THRESHOLD) * 360}deg)` }
          }
        />
      </div>
      {children}
    </>
  );
}
