import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-full w-full max-w-lg flex-1 flex-col items-center justify-center gap-5 px-6 py-16 text-center">
      <p className="font-black text-7xl text-primary leading-none tracking-tight sm:text-8xl">
        404
      </p>
      <h1 className="text-balance font-black text-2xl text-foreground leading-tight tracking-tight sm:text-3xl">
        This page spun off the wheel
      </h1>
      <p className="max-w-sm text-balance text-muted-foreground">
        The campaign you're looking for doesn't exist or has been removed.
      </p>
      <Link
        href="/"
        className="mt-2 rounded-full bg-primary px-8 py-4 font-black text-primary-foreground uppercase tracking-wide shadow-(--shadow-pop) transition duration-200 ease-out hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2"
      >
        Back to campaigns
      </Link>
    </main>
  );
}
