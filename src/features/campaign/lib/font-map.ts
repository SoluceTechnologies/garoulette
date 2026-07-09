/**
 * Pure name → CSS variable mapping for the campaign font whitelist.
 *
 * Deliberately has no `next/font/google` import: `next/font` calls its font
 * loader functions at module-evaluation time, which throws outside the
 * Next.js build pipeline (e.g. under vitest's node environment). Keeping the
 * lookup table and its consumers here lets them be unit-tested directly,
 * while `./fonts` wires the same names to real `next/font` instances for
 * runtime use.
 */
export type FontEntry = { name: string; cssVar: string };

export const FONT_MAP: FontEntry[] = [
  { name: "Comfortaa", cssVar: "--font-comfortaa" },
  { name: "Outfit", cssVar: "--font-outfit" },
  { name: "Poppins", cssVar: "--font-poppins" },
  { name: "Montserrat", cssVar: "--font-montserrat" },
  { name: "Nunito", cssVar: "--font-nunito" },
  { name: "Fredoka", cssVar: "--font-fredoka" },
  { name: "Baloo 2", cssVar: "--font-baloo" },
  { name: "Quicksand", cssVar: "--font-quicksand" },
];

/** Options for the admin font dropdown. */
export const FONT_OPTIONS = FONT_MAP.map((f) => ({ label: f.name, value: f.name }));

/** Resolve a campaign font name to a CSS `var(...)`; unknown/missing → default. */
export function resolveFontVar(name?: string): string {
  if (!name) return "var(--font-sans)";
  const match = FONT_MAP.find((f) => f.name.toLowerCase() === name.toLowerCase());
  return match ? `var(${match.cssVar})` : "var(--font-sans)";
}
