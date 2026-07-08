"use client";

import { useCallback, useEffect, useRef } from "react";
import type { SoundUrls } from "../lib/sounds";

/**
 * Manages the kiosk's three audio channels. All playback is triggered from user
 * gestures (the spin tap), so it complies with browser autoplay policies.
 */
export function useKioskSounds(urls: SoundUrls) {
  const background = useRef<HTMLAudioElement | null>(null);
  const spin = useRef<HTMLAudioElement | null>(null);
  const result = useRef<HTMLAudioElement | null>(null);
  const muted = useRef(false);
  const started = useRef(false);

  useEffect(() => {
    const bg = new Audio(urls.background);
    bg.loop = true;
    bg.volume = 0.3;
    const sp = new Audio(urls.spin);
    sp.loop = true;
    sp.volume = 0.6;
    const rs = new Audio(urls.result);
    rs.volume = 0.9;
    background.current = bg;
    spin.current = sp;
    result.current = rs;
    return () => {
      for (const audio of [bg, sp, rs]) {
        audio.pause();
        audio.src = "";
      }
    };
  }, [urls.background, urls.spin, urls.result]);

  const startSpin = useCallback(() => {
    started.current = true;
    if (muted.current) return;
    background.current?.play().catch(() => {});
    const sp = spin.current;
    if (sp) {
      sp.currentTime = 0;
      sp.play().catch(() => {});
    }
  }, []);

  const endSpin = useCallback(() => {
    spin.current?.pause();
    if (muted.current) return;
    const rs = result.current;
    if (rs) {
      rs.currentTime = 0;
      rs.play().catch(() => {});
    }
  }, []);

  const setMuted = useCallback((value: boolean) => {
    muted.current = value;
    if (value) {
      background.current?.pause();
      spin.current?.pause();
    } else if (started.current) {
      background.current?.play().catch(() => {});
    }
  }, []);

  return { startSpin, endSpin, setMuted };
}
