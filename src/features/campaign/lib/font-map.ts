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

export const FONT_OPTIONS = FONT_MAP.map((f) => ({
  label: f.name,
  value: f.name,
}));

export function resolveFontVar(name?: string): string {
  if (!name) return "var(--font-sans)";
  const match = FONT_MAP.find(
    (f) => f.name.toLowerCase() === name.toLowerCase(),
  );
  return match ? `var(${match.cssVar})` : "var(--font-sans)";
}
