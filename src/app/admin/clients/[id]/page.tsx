import { ClientDetailPage } from "@/components/admin/client-detail-page";

export default async function ClientDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <ClientDetailPage clientId={id} />;
}
