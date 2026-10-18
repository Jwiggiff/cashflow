"use client";

import { isStandalonePwa } from "@/lib/pwa";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

// Installed PWAs (launched from the home-screen icon) lose Safari's native
// pull-to-refresh entirely - it's a browser-chrome gesture, not available in
// a standalone window. Only active in that mode: a regular browser tab
// already has the native gesture, and layering this on top of it would
// just double-trigger a refresh on the same pull.
const PULL_THRESHOLD = 70; // px of drag before a release triggers a refresh
const MAX_PULL = 110; // px - caps how far the indicator can be dragged

export function PullToRefresh({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [pullDistance, setPullDistance] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const startY = useRef<number | null>(null);

  const handleTouchStart = useCallback((e: TouchEvent) => {
    // Only start tracking a pull from the very top of the page - otherwise
    // this would fire mid-scroll on any upward-then-downward swipe.
    if (window.scrollY > 0) return;
    startY.current = e.touches[0].clientY;
  }, []);

  const handleTouchMove = useCallback(
    (e: TouchEvent) => {
      if (startY.current === null || refreshing) return;
      const delta = e.touches[0].clientY - startY.current;
      if (delta <= 0) {
        setPullDistance(0);
        return;
      }
      // Resistance curve so it doesn't feel 1:1 with the finger.
      setPullDistance(Math.min(MAX_PULL, delta * 0.5));
    },
    [refreshing]
  );

  const handleTouchEnd = useCallback(() => {
    if (startY.current === null) return;
    startY.current = null;
    if (pullDistance >= PULL_THRESHOLD && !refreshing) {
      setRefreshing(true);
      router.refresh();
      // router.refresh() doesn't expose a promise tied to the actual
      // server round-trip, so this just gives the spinner a moment to be
      // visible rather than tracking real completion - matches the quick,
      // approximate feedback native pull-to-refresh gives anyway.
      setTimeout(() => {
        setRefreshing(false);
        setPullDistance(0);
      }, 600);
    } else {
      setPullDistance(0);
    }
  }, [pullDistance, refreshing, router]);

  // Checked here rather than during render: the server can't know the
  // display mode, so rendering differently per mode would break hydration.
  // The render below is identical either way - the indicator is 0px tall
  // until a pull, which only these listeners can start.
  useEffect(() => {
    if (!isStandalonePwa()) return;
    document.addEventListener("touchstart", handleTouchStart, {
      passive: true,
    });
    document.addEventListener("touchmove", handleTouchMove, {
      passive: true,
    });
    document.addEventListener("touchend", handleTouchEnd, { passive: true });
    return () => {
      document.removeEventListener("touchstart", handleTouchStart);
      document.removeEventListener("touchmove", handleTouchMove);
      document.removeEventListener("touchend", handleTouchEnd);
    };
  }, [handleTouchStart, handleTouchMove, handleTouchEnd]);

  return (
    <>
      <div
        className="flex items-center justify-center overflow-hidden transition-[height] duration-200 ease-out"
        style={{ height: pullDistance }}
        aria-hidden={pullDistance === 0}
      >
        <Loader2
          className={cn(
            "h-5 w-5 text-muted-foreground",
            refreshing && "animate-spin"
          )}
          style={
            !refreshing
              ? {
                  transform: `rotate(${
                    (pullDistance / PULL_THRESHOLD) * 360
                  }deg)`,
                }
              : undefined
          }
        />
      </div>
      {children}
    </>
  );
}
