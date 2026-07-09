import Link from "next/link";
import { LogoutButton } from "@/features/admin/components/logout-button";
import { requireAdmin } from "@/features/admin/lib/dal";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();
  return (
    <div className="flex min-h-full flex-1 flex-col">
      <header className="flex items-center justify-between border-border border-b px-6 py-4">
        <Link href="/admin/campaigns" className="font-bold text-lg">
          Garoulette Admin
        </Link>
        <LogoutButton />
      </header>
      <main className="flex-1 p-6">{children}</main>
    </div>
  );
}
