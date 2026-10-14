import { CloseCaseForm } from "../../../../components/CloseCaseForm";

export default async function CloseCasePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <CloseCaseForm caseId={id} />;
}
