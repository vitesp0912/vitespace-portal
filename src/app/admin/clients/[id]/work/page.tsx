import { ClientWorkPage } from "@/components/admin/client-work-page";

export default async function WorkPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <ClientWorkPage clientId={id} />;
}
