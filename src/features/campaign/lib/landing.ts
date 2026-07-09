/**
 * Screen angle (clockwise from top) where the pointer sits.
 * The pointer element is rendered on the LEFT of the wheel = 9 o'clock = 270deg.
 */
export const POINTER_ANGLE_DEG = 270;

/**
 * Rotation (deg) that lands wedge `prizeIndex` under the pointer.
 *
 * Conic gradient starts `from -seg/2`, so wedge i's centre sits at gradient
 * angle `i*seg` clockwise from top. After rotating the wheel by R its centre
 * shows at `i*seg + R`. We want that to equal POINTER_ANGLE_DEG, i.e.
 * R = POINTER_ANGLE_DEG - i*seg, plus several forward turns.
 */
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
