import Image from "next/image";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="flex min-h-full flex-1 flex-col items-center justify-center gap-8 px-6 py-14">
      <Image
        src="/logo@2x.png"
        alt="Garoulette"
        width={160}
        height={160}
        priority
        className="h-auto w-32 sm:w-40"
      />
      {children}
    </main>
  );
}
