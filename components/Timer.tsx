"use client";

import { useEffect, useState } from "react";
import { formatSeconds } from "@/lib/format";

export default function Timer({
  startedAt,
  baseSeconds,
  running,
  clockOffsetMs = 0,
}: {
  startedAt: string | null;
  baseSeconds: number;
  running: boolean;
  /** diferença (servidor - cliente) em ms, para compensar relógios desalinhados */
  clockOffsetMs?: number;
}) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!running) return;
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, [running]);

  let elapsed = baseSeconds;
  if (running && startedAt) {
    const start = new Date(startedAt.replace(" ", "T")).getTime();
    elapsed = baseSeconds + Math.max(0, Math.floor((now + clockOffsetMs - start) / 1000));
  }

  return <span>{formatSeconds(elapsed)}</span>;
}
