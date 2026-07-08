export function prizeImageUrl(slug: string, image: string): string {
  const file = image.replace(/^\/?images\//, "").replace(/^\/+/, "");
  return `/campaign/${encodeURIComponent(slug)}/images/${file}`;
}
