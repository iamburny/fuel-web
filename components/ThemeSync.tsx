"use client";

import { useEffect, useRef } from "react";
import { usePreferences } from "@/lib/preferences";

/**
 * Keeps <html data-theme="..."> in sync with the saved theme preference after the initial paint.
 * The very first paint's theme is set synchronously by an inline script in layout.tsx (before
 * hydration, so there's no flash) — this component takes over from there, so a change made on the
 * Settings page is reflected immediately without a reload.
 */
export default function ThemeSync() {
  const [prefs] = usePreferences();
  const isFirstRun = useRef(true);

  useEffect(() => {
    if (isFirstRun.current) {
      // usePreferences() itself starts from a placeholder default (see its own comment) and only
      // syncs the real saved value in its own effect afterward. The inline script already applied
      // the correct theme for the very first paint using the real value read straight from
      // localStorage — applying this hook's still-default "system" on that same first pass would
      // flash the theme back to system for an instant before the real value loads in.
      isFirstRun.current = false;
      return;
    }
    if (prefs.theme === "system") {
      document.documentElement.removeAttribute("data-theme");
    } else {
      document.documentElement.setAttribute("data-theme", prefs.theme);
    }
  }, [prefs.theme]);

  return null;
}
