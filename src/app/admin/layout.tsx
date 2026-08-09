export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="admin-theme h-screen overflow-hidden">{children}</div>;
}
