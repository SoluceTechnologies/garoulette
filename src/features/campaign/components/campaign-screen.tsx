"use client";

import { Volume2, VolumeOff } from "lucide-react";
import { useCallback, useRef, useState } from "react";
import { spinAction } from "../actions/spin.action";
import { useKioskSounds } from "../hooks/use-sounds";
import type { SoundUrls } from "../lib/sounds";
import { fireConfetti } from "../utils/confetti";
import { PrizeReveal } from "./prize-reveal";
import { SpinStage } from "./spin-stage";
import { StatusScreen } from "./status-screen";
import type { WheelPrize } from "./wheel";

type TerminalStatus = "soldOut" | "disabled" | "notStarted" | "expired";
type Status = "ready" | "spinning" | "result" | TerminalStatus;

const TERMINAL_MESSAGES: Record<
  TerminalStatus,
  { title: string; subtitle: string }
> = {
  soldOut: {
    title: "All prizes have been given out 🎉",
    subtitle: "See you next time!",
  },
  disabled: {
    title: "Campaign unavailable",
    subtitle: "This campaign is currently disabled.",
  },
  notStarted: {
    title: "Coming soon",
    subtitle: "This campaign hasn't started yet.",
  },
  expired: { title: "Campaign ended", subtitle: "Thanks for playing!" },
};

type CampaignScreenProps = {
  slug: string;
  logoUrl?: string;
  welcomeMessage?: string;
  resetDelaySeconds: number;
  spinDurationMs: number;
  prizes: WheelPrize[];
  soundUrls: SoundUrls;
  initialStatus: "ready" | TerminalStatus;
};

export function CampaignScreen({
  slug,
  logoUrl,
  welcomeMessage,
  resetDelaySeconds,
  spinDurationMs,
  prizes,
  soundUrls,
  initialStatus,
}: CampaignScreenProps) {
  const [status, setStatus] = useState<Status>(initialStatus);
  const [rotation, setRotation] = useState(0);
  const [wonPrize, setWonPrize] = useState<WheelPrize | null>(null);
  const [muted, setMuted] = useState(false);
  const pendingPrize = useRef<WheelPrize | null>(null);
  const resetTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const {
    startSpin,
    endSpin,
    setMuted: setSoundMuted,
  } = useKioskSounds(soundUrls);

  const seg = prizes.length > 0 ? 360 / prizes.length : 0;

  const landingRotation = useCallback(
    (prizeIndex: number) => {
      // Wheel wedge i is centered at screen angle (i*seg) clockwise from top
      // (the conic gradient starts at from:-seg/2, so wedge 0 straddles the top).
      // Rotating the wheel by R moves that center to (i*seg + R); we want it at
      // the top (≡ 0 mod 360), so R ≡ -i*seg. Spin forward several full turns.
      const center = prizeIndex * seg;
      const jitter = (Math.random() - 0.5) * seg * 0.6;
      const currentTurns = Math.floor(rotation / 360) + 6;
      return currentTurns * 360 - center + jitter;
    },
    [rotation, seg],
  );

  const reset = useCallback(() => {
    if (resetTimer.current) clearTimeout(resetTimer.current);
    resetTimer.current = null;
    setWonPrize(null);
    setStatus("ready");
  }, []);

  const spin = useCallback(async () => {
    if (status !== "ready") return;
    setStatus("spinning");
    startSpin();
    // Kick off a visible spin immediately to mask network latency.
    setRotation((r) => r + 360 * 2);

    const res = await spinAction({ slug });
    const data = res?.data;

    if (!data || res?.serverError) {
      // Treat an unexpected failure as a soft reset back to ready.
      setStatus("ready");
      return;
    }
    if (data.status !== "win") {
      // disabled / notStarted / expired / soldOut -> terminal screen.
      setStatus(data.status);
      return;
    }

    pendingPrize.current = prizes[data.prizeIndex] ?? null;
    setRotation(landingRotation(data.prizeIndex));
  }, [status, slug, prizes, landingRotation, startSpin]);

  const handleSpinEnd = useCallback(() => {
    if (status !== "spinning" || !pendingPrize.current) return;
    setWonPrize(pendingPrize.current);
    pendingPrize.current = null;
    setStatus("result");
    endSpin();
    fireConfetti();
    resetTimer.current = setTimeout(reset, resetDelaySeconds * 1000);
  }, [status, resetDelaySeconds, reset, endSpin]);

  const handleTap = useCallback(() => {
    if (status === "ready") void spin();
    else if (status === "result") reset();
  }, [status, spin, reset]);

  const toggleMute = useCallback(() => {
    setMuted((prev) => {
      const next = !prev;
      setSoundMuted(next);
      return next;
    });
  }, [setSoundMuted]);

  if (status !== "ready" && status !== "spinning" && status !== "result") {
    const message = TERMINAL_MESSAGES[status];
    return (
      <StatusScreen
        logoUrl={logoUrl}
        title={message.title}
        subtitle={message.subtitle}
      />
    );
  }

  return (
    // biome-ignore lint/a11y/useSemanticElements: the whole kiosk surface is a tap target; a nested mute <button> can't live inside a <button>.
    <div
      role="button"
      tabIndex={0}
      aria-label="Spin the wheel"
      onClick={handleTap}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          handleTap();
        }
      }}
      className="relative flex min-h-full w-full flex-1 cursor-pointer flex-col bg-background focus:outline-none"
    >
      {/* Soft backdrop tinted with the campaign's secondary colour. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background:
            "radial-gradient(65% 50% at 50% 40%, color-mix(in srgb, var(--secondary) 22%, transparent), transparent 72%)",
        }}
      />

      {logoUrl && (
        // biome-ignore lint/performance/noImgElement: campaign logo is a runtime volume file, not a build-time asset
        <img
          src={logoUrl}
          alt=""
          className="pointer-events-none absolute top-4 left-4 z-20 h-10 w-auto object-contain sm:h-14"
        />
      )}

      <button
        type="button"
        aria-label={muted ? "Unmute sounds" : "Mute sounds"}
        onClick={(e) => {
          e.stopPropagation();
          toggleMute();
        }}
        className="absolute top-4 right-4 z-30 flex h-11 w-11 items-center justify-center rounded-full bg-card text-lg shadow-[var(--shadow-card)] transition hover:scale-105"
      >
        {muted ? <VolumeOff /> : <Volume2 />}
      </button>

      <SpinStage
        welcomeMessage={status === "ready" ? welcomeMessage : undefined}
        prizes={prizes}
        rotation={rotation}
        spinDurationMs={spinDurationMs}
        onSpinEnd={handleSpinEnd}
        showCta={status === "ready"}
        dimmed={status === "result"}
      />
      {status === "result" && wonPrize && <PrizeReveal prize={wonPrize} />}
    </div>
  );
}
