'use client';

import { useEffect, useState } from 'react';

function nextClose(now) {
  const d = new Date(now);
  const day = d.getDay();
  d.setDate(d.getDate() + ((7 - day) % 7));
  d.setHours(23, 59, 59, 0);
  if (d.getTime() <= now) d.setDate(d.getDate() + 7);
  return d.getTime();
}

const pad = (n) => String(n).padStart(2, '0');

export function useWeeklyCountdown() {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const ms = Math.max(0, nextClose(now) - now);
  const d = Math.floor(ms / 86400000);
  const h = Math.floor(ms / 3600000) % 24;
  const m = Math.floor(ms / 60000) % 60;
  const s = Math.floor(ms / 1000) % 60;

  const countdown = `${d}d ${pad(h)}:${pad(m)}:${pad(s)}`;
  const timeParts = [
    { v: pad(d), l: 'Days' },
    { v: pad(h), l: 'Hrs' },
    { v: pad(m), l: 'Min' },
    { v: pad(s), l: 'Sec' },
  ];

  return { countdown, timeParts, stickyNote: `Closes in ${countdown}` };
}
