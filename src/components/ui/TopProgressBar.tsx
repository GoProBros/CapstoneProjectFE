"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";

type HistoryUrl = string | URL | null | undefined;

type HistoryMethod = (data: unknown, unused: string, url?: HistoryUrl) => void;

const START_PROGRESS = 0.12;
const MAX_PROGRESS = 0.9;
const INCREMENT = 0.03;
const INTERVAL_MS = 180;
const FINISH_DELAY_MS = 200;
const MAX_LOADING_MS = 12000;

function resolveUrl(url: HistoryUrl): URL | null {
  if (!url) return null;
  try {
    return new URL(url.toString(), window.location.href);
  } catch {
    return null;
  }
}

function shouldStartForUrl(nextUrl: URL | null): boolean {
  if (!nextUrl) return true;
  if (nextUrl.origin !== window.location.origin) return false;
  if (nextUrl.pathname === window.location.pathname && nextUrl.search === window.location.search) {
    return false;
  }
  return true;
}

function isModifiedEvent(event: MouseEvent): boolean {
  return event.metaKey || event.altKey || event.ctrlKey || event.shiftKey;
}

export default function TopProgressBar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [progress, setProgress] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const intervalRef = useRef<number | null>(null);
  const finishTimeoutRef = useRef<number | null>(null);
  const maxTimeoutRef = useRef<number | null>(null);
  const isAnimatingRef = useRef(false);
  const isInitialRenderRef = useRef(true);

  const clearTimers = useCallback(() => {
    if (intervalRef.current) {
      window.clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (finishTimeoutRef.current) {
      window.clearTimeout(finishTimeoutRef.current);
      finishTimeoutRef.current = null;
    }
    if (maxTimeoutRef.current) {
      window.clearTimeout(maxTimeoutRef.current);
      maxTimeoutRef.current = null;
    }
  }, []);

  const finish = useCallback(() => {
    if (!isAnimatingRef.current) return;

    clearTimers();
    setProgress(1);

    finishTimeoutRef.current = window.setTimeout(() => {
      setIsVisible(false);
      setProgress(0);
      isAnimatingRef.current = false;
    }, FINISH_DELAY_MS);
  }, [clearTimers]);

  const start = useCallback(() => {
    if (isAnimatingRef.current) return;

    isAnimatingRef.current = true;
    setIsVisible(true);
    setProgress((prev) => (prev < START_PROGRESS ? START_PROGRESS : prev));

    clearTimers();

    intervalRef.current = window.setInterval(() => {
      setProgress((prev) => {
        if (prev >= MAX_PROGRESS) return prev;
        return Math.min(prev + INCREMENT, MAX_PROGRESS);
      });
    }, INTERVAL_MS);

    maxTimeoutRef.current = window.setTimeout(() => {
      finish();
    }, MAX_LOADING_MS);
  }, [clearTimers, finish]);

  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0 || isModifiedEvent(event)) return;

      const target = event.target;
      if (!(target instanceof Element)) return;

      const anchor = target.closest("a");
      if (!anchor) return;
      if (anchor.target && anchor.target !== "_self") return;
      if (anchor.hasAttribute("download")) return;
      if (anchor.getAttribute("data-no-progress") === "true") return;

      const href = anchor.getAttribute("href");
      if (!href || href.startsWith("#")) return;

      const nextUrl = resolveUrl(href);
      if (!shouldStartForUrl(nextUrl)) return;

      start();
    };

    document.addEventListener("click", handleClick);
    return () => {
      document.removeEventListener("click", handleClick);
    };
  }, [start]);

  useEffect(() => {
    const originalPushState = history.pushState.bind(history) as HistoryMethod;
    const originalReplaceState = history.replaceState.bind(history) as HistoryMethod;

    history.pushState = (data: unknown, unused: string, url?: HistoryUrl) => {
      const nextUrl = resolveUrl(url);
      if (shouldStartForUrl(nextUrl)) {
        start();
      }
      originalPushState(data, unused, url);
    };

    history.replaceState = (data: unknown, unused: string, url?: HistoryUrl) => {
      const nextUrl = resolveUrl(url);
      if (shouldStartForUrl(nextUrl)) {
        start();
      }
      originalReplaceState(data, unused, url);
    };

    const handlePopState = () => {
      start();
    };

    window.addEventListener("popstate", handlePopState);

    return () => {
      history.pushState = originalPushState;
      history.replaceState = originalReplaceState;
      window.removeEventListener("popstate", handlePopState);
    };
  }, [start]);

  useEffect(() => {
    if (isInitialRenderRef.current) {
      isInitialRenderRef.current = false;
      return;
    }

    finish();
  }, [pathname, searchParams, finish]);

  useEffect(() => {
    return () => {
      clearTimers();
    };
  }, [clearTimers]);

  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none fixed left-0 top-0 z-[9999] w-full transition-opacity duration-200 ${
        isVisible ? "opacity-100" : "opacity-0"
      }`}
    >
      <div
        className="h-[3px] bg-emerald-400 transition-[width] duration-200 ease-out"
        style={{ width: `${progress * 100}%` }}
      />
    </div>
  );
}
