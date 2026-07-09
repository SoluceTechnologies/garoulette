import { LoginForm } from "@/features/admin/components/login-form";

export const dynamic = "force-dynamic";

export default function AdminLoginPage() {
  return (
    <main className="flex min-h-full flex-1 items-center justify-center">
      <LoginForm />
    </main>
  );
}
