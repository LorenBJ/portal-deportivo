"use client";

import { useEffect, useState } from "react";

export function usePortalFeed() {
  const [matches, setMatches] = useState([]);
  const [meta, setMeta] = useState({ source: "loading" });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const response = await fetch("/api/feed", { cache: "no-store" });
        if (!response.ok) {
          throw new Error(`feed_request_failed:${response.status}`);
        }

        const payload = await response.json();
        if (cancelled) return;

        setMatches(payload.matches ?? []);
        setMeta(payload.meta ?? { source: "unknown" });
        setError("");
      } catch (loadError) {
        if (cancelled) return;
        setError(loadError instanceof Error ? loadError.message : "feed_error");
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    load();
    const intervalId = window.setInterval(load, 60000);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, []);

  return { matches, meta, isLoading, error };
}
