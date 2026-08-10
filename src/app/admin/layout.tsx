import { AdminAuthGuard } from "@/components/portal/portal-auth-guard";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="admin-theme h-screen overflow-hidden">
      <AdminAuthGuard>{children}</AdminAuthGuard>
    </div>
  );
}
