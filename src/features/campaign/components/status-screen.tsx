"use client";

type StatusScreenProps = {
  logoUrl?: string;
  title: string;
  subtitle: string;
};

export function StatusScreen({ logoUrl, title, subtitle }: StatusScreenProps) {
  return (
    <div className="flex min-h-full w-full flex-1 flex-col items-center justify-center gap-6 px-6 py-10 text-center">
      {logoUrl && (
        // biome-ignore lint/performance/noImgElement: campaign logo is a runtime volume file, not a build-time asset
        <img src={logoUrl} alt="" className="h-12 w-auto object-contain sm:h-14" />
      )}
      <div className="flex max-w-md flex-col items-center gap-3 rounded-2xl bg-card px-8 py-10 shadow-[var(--shadow-card)]">
        <h1 className="text-balance font-black text-3xl text-foreground leading-tight tracking-tight">{title}</h1>
        <p className="text-muted-foreground">{subtitle}</p>
      </div>
    </div>
  );
}
