export function readableInk(hex: string): "#211e1a" | "#ffffff" {
  const h = hex.replace("#", "");
  const full = h.length === 3 ? [...h].map((c) => c + c).join("") : h;
  const toLinear = (v: number) =>
    v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  const [r, g, b] = [0, 2, 4].map((o) =>
    toLinear(Number.parseInt(full.slice(o, o + 2), 16) / 255),
  );
  const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  const contrastWithBlack = (luminance + 0.05) / 0.05;
  const contrastWithWhite = 1.05 / (luminance + 0.05);
  return contrastWithBlack >= contrastWithWhite ? "#211e1a" : "#ffffff";
}
