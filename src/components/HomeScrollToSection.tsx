"use client";

import { useEffect } from "react";

/**
 * Scrolls to `#book-meeting` (or another id) after the home page mounts.
 * Supports `/#section` in the URL or `sessionStorage` key `mm-scroll-to-section`.
 * Session key is removed only after the target element is found (so React Strict
 * Mode’s double effect does not consume it on the first run and leave the second empty).
 */
export default function HomeScrollToSection() {
  useEffect(() => {
    let id = "";
    let idFromStorage = false;
    try {
      id = window.location.hash.replace(/^#/, "").trim();
    } catch {
      /* ignore */
    }

    if (!id) {
      try {
        id = (sessionStorage.getItem("mm-scroll-to-section") ?? "").trim();
        if (id) idFromStorage = true;
      } catch {
        /* ignore */
      }
    }

    if (!id) return;

    const scrollToId = () => {
      const el = document.getElementById(id);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
        if (idFromStorage) {
          try {
            sessionStorage.removeItem("mm-scroll-to-section");
          } catch {
            /* ignore */
          }
          idFromStorage = false;
        }
      }
    };

    scrollToId();
    const t1 = window.setTimeout(scrollToId, 120);
    const t2 = window.setTimeout(scrollToId, 450);
    const t3 = window.setTimeout(scrollToId, 900);
    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
      window.clearTimeout(t3);
    };
  }, []);

  return null;
}
