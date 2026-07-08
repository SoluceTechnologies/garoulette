"use client";

import { useCallback, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { spinAction } from "../actions/spin";
import { fireConfetti } from "./confetti";
import { Wheel, type WheelPrize } from "./wheel";

const SPIN_DURATION_MS = 4500;

type Status = "ready" | "spinning" | "result" | "soldOut" | "expired";

type CampaignScreenProps = {
  slug: string;
  logoUrl?: string;
  welcomeMessage?: string;
  resetDelaySeconds: number;
  prizes: WheelPrize[];
  initialStatus: "ready" | "soldOut" | "expired";
};

export function CampaignScreen({
  slug,
  logoUrl,
  welcomeMessage,
  resetDelaySeconds,
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

  const reset = useCallback(() => {
    if (resetTimer.current) clearTimeout(resetTimer.current);
    resetTimer.current = null;
    setWonPrize(null);
    setStatus("ready");
  }, []);

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
    return <FullMessage title="Campaign ended" subtitle="Thanks for playing!" />;
  }
  if (initialStatus === "soldOut" || status === "soldOut") {
    return <FullMessage title="All prizes have been given out 🎉" subtitle="See you next time!" />;
  }

  return (
    <button
      type="button"
      onClick={handleTap}
      disabled={status === "spinning"}
      className="flex min-h-full w-full flex-1 cursor-pointer flex-col items-center justify-center gap-8 bg-secondary p-8 text-center disabled:cursor-default"
    >
      {logoUrl && (
        <div>
          {/* biome-ignore lint/performance/noImgElement: campaign logo is a runtime volume file, not a build-time asset */}
          <img src={logoUrl} alt="" className="h-20 w-auto object-contain" />
        </div>
      )}

      {welcomeMessage && status === "ready" && (
        <h1 className="max-w-2xl font-black text-4xl text-white">{welcomeMessage}</h1>
      )}

      <Wheel prizes={prizes} rotation={rotation} spinDurationMs={SPIN_DURATION_MS} onSpinEnd={handleSpinEnd} />

      {status === "ready" && (
        <span className="rounded-full bg-primary px-10 py-4 font-black text-2xl text-white shadow-lg">TAP TO SPIN</span>
      )}

      {status === "result" && wonPrize && (
        <div className="flex flex-col items-center gap-4">
          <p className="font-bold text-2xl text-white">You won</p>
          {/* biome-ignore lint/performance/noImgElement: prize images are runtime volume files, not build-time assets */}
          <img
            src={wonPrize.imageUrl}
            alt=""
            className="h-40 w-40 rounded-2xl bg-white/10 object-contain p-2"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).style.visibility = "hidden";
            }}
          />
          <p className="font-black text-4xl text-primary">{wonPrize.name}</p>
          <p className="text-sm text-white/70">Tap to continue</p>
        </div>
      )}
    </button>
  );
}

function FullMessage({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div
      className={cn(
        "flex min-h-full w-full flex-1 flex-col items-center justify-center gap-4 bg-secondary p-8 text-center",
      )}
    >
      <h1 className="max-w-2xl font-black text-4xl text-white">{title}</h1>
      <p className="text-lg text-white/70">{subtitle}</p>
    </div>
  );
}
