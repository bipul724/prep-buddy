"use client";

import { useEffect, useState } from "react";

/** Seconds since `running` became true. Local models take 5–30 s, so show the wait honestly. */
export function useElapsed(running: boolean): number {
  const [seconds, setSeconds] = useState(0);
  useEffect(() => {
    if (!running) return;
    const start = Date.now();
    const t = setInterval(() => setSeconds(Math.floor((Date.now() - start) / 1000)), 1000);
    return () => {
      clearInterval(t);
      setSeconds(0);
    };
  }, [running]);
  return seconds;
}
