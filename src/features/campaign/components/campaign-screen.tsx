"use client";

import { useCallback, useRef, useState } from "react";
import { spinAction } from "../actions/spin";
import { fireConfetti } from "./confetti";
import { PrizeReveal } from "./prize-reveal";
import { SpinStage } from "./spin-stage";
import { StatusScreen } from "./status-screen";
import type { WheelPrize } from "./wheel";

type Status = "ready" | "spinning" | "result" | "soldOut" | "expired";

type CampaignScreenProps = {
  slug: string;
  logoUrl?: string;
  welcomeMessage?: string;
  resetDelaySeconds: number;
  spinDurationMs: number;
  prizes: WheelPrize[];
  initialStatus: "ready" | "soldOut" | "expired";
};

/**
 * Client orchestrator for the kiosk: owns the spin state machine and delegates
 * all rendering to the presentational stage / reveal / status components.
 */
export function CampaignScreen({
  slug,
  logoUrl,
  welcomeMessage,
  resetDelaySeconds,
  spinDurationMs,
  prizes,
  initialStatus,
}: CampaignScreenProps) {
  const [status, setStatus] = useState<Status>(initialStatus);
  const [rotation, setRotation] = useState(0);
  const [wonPrize, setWonPrize] = useState<WheelPrize | null>(null);
  const pendingPrize = useRef<WheelPrize | null>(null);
  const resetTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

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
    // Kick off a visible spin immediately to mask network latency.
    setRotation((r) => r + 360 * 2);

    const res = await spinAction({ slug });
    const data = res?.data;

    if (!data || res?.serverError) {
      // Treat an unexpected failure as a soft reset back to ready.
      setStatus("ready");
      return;
    }
    if (data.status === "expired") {
      setStatus("expired");
      return;
    }
    if (data.status === "soldOut") {
      setStatus("soldOut");
      return;
    }

    pendingPrize.current = prizes[data.prizeIndex] ?? null;
    setRotation(landingRotation(data.prizeIndex));
  }, [status, slug, prizes, landingRotation]);

  const handleSpinEnd = useCallback(() => {
    if (status !== "spinning" || !pendingPrize.current) return;
    setWonPrize(pendingPrize.current);
    pendingPrize.current = null;
    setStatus("result");
    fireConfetti();
    resetTimer.current = setTimeout(reset, resetDelaySeconds * 1000);
  }, [status, resetDelaySeconds, reset]);

  const handleTap = useCallback(() => {
    if (status === "ready") void spin();
    else if (status === "result") reset();
  }, [status, spin, reset]);

  if (initialStatus === "expired" || status === "expired") {
    return <StatusScreen logoUrl={logoUrl} title="Campaign ended" subtitle="Thanks for playing!" />;
  }
  if (initialStatus === "soldOut" || status === "soldOut") {
    return <StatusScreen logoUrl={logoUrl} title="All prizes have been given out 🎉" subtitle="See you next time!" />;
  }

  return (
    <button
      type="button"
      onClick={handleTap}
      disabled={status === "spinning"}
      className="relative flex min-h-full w-full flex-1 cursor-pointer flex-col bg-background disabled:cursor-default"
    >
      <SpinStage
        logoUrl={logoUrl}
        welcomeMessage={status === "ready" ? welcomeMessage : undefined}
        prizes={prizes}
        rotation={rotation}
        spinDurationMs={spinDurationMs}
        onSpinEnd={handleSpinEnd}
        showCta={status === "ready"}
        dimmed={status === "result"}
      />
      {status === "result" && wonPrize && <PrizeReveal prize={wonPrize} />}
    </button>
  );
}
