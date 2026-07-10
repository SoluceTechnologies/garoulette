import Image from "next/image";
import {
  Dashboard,
  DashboardActions,
  DashboardBrand,
  DashboardContent,
  DashboardHeader,
  DashboardNav,
  DashboardNavLink,
} from "@/features/admin/components/layout/dashboard";
import { LogoutButton } from "@/features/admin/components/layout/logout-button";
import { requireAdmin } from "@/features/admin/lib/dal";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAdmin();
  return (
    <Dashboard>
      <DashboardHeader>
        <DashboardBrand aria-label="Garoulette">
          <Image
            src="/logo@2x.png"
            alt="Garoulette"
            width={256}
            height={256}
            priority
            className="h-9 w-auto"
          />
        </DashboardBrand>
        <DashboardNav>
          <DashboardNavLink href="/admin/campaigns" active>
            Campaigns
          </DashboardNavLink>
        </DashboardNav>
        <DashboardActions>
          <LogoutButton />
        </DashboardActions>
      </DashboardHeader>
      <DashboardContent>{children}</DashboardContent>
    </Dashboard>
  );
}
