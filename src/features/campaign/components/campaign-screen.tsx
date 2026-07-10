"use client";

import { Volume2, VolumeOff } from "lucide-react";
import { type KeyboardEvent, useCallback, useRef, useState } from "react";
import { spinAction } from "../actions/spin.action";
import { useKioskSounds } from "../hooks/use-sounds";
import { landingRotationFor } from "../lib/landing";
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
  spinOnTapAnywhere: boolean;
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
  spinOnTapAnywhere,
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
    (prizeIndex: number) => landingRotationFor(prizeIndex, seg, rotation),
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
    setRotation((r) => r + 360 * 2);

    const res = await spinAction({ slug });
    const data = res?.data;

    if (!data || res?.serverError) {
      setStatus("ready");
      return;
    }
    if (data.status !== "win") {
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

  const surfaceInteractive =
    status === "result" || (spinOnTapAnywhere && status === "ready");
  const surfaceProps = surfaceInteractive
    ? {
        role: "button" as const,
        tabIndex: 0,
        "aria-label": status === "result" ? "Continue" : "Spin the wheel",
        onClick: handleTap,
        onKeyDown: (e: KeyboardEvent) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            handleTap();
          }
        },
      }
    : {};

  return (
    // biome-ignore lint/a11y/useSemanticElements: the whole kiosk surface is a tap target; a nested mute <button> can't live inside a <button>.
    <div
      {...surfaceProps}
      className={`relative flex h-dvh w-full flex-1 flex-col overflow-hidden bg-background focus:outline-none ${
        surfaceInteractive ? "cursor-pointer" : ""
      }`}
    >
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
          className="pointer-events-none absolute top-4 left-4 z-20 h-16 w-auto object-contain sm:h-24"
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
        spinning={status === "spinning"}
        tapAnywhere={spinOnTapAnywhere}
        onSpin={() => void spin()}
      />
      {status === "result" && wonPrize && <PrizeReveal prize={wonPrize} />}
    </div>
  );
}
