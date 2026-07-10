export const POINTER_ANGLE_DEG = 270;

export function landingRotationFor(
  prizeIndex: number,
  seg: number,
  currentRotation: number,
  jitter = (Math.random() - 0.5) * seg * 0.6,
): number {
  const center = prizeIndex * seg;
  const currentTurns = Math.floor(currentRotation / 360) + 6;
  return currentTurns * 360 - center + POINTER_ANGLE_DEG + jitter;
}
