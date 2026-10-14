import { listPublicOpenCases } from "@rescue-alert/api";
import { createClient } from "../../../lib/supabase/server";
import { PublicOpenCasesList } from "./public-open-cases-list";

export const metadata = {
  title: "Open cases - Rescue Alert",
  description: "Rescue cases in the pilot area that still need help.",
};

export default async function PublicOpenCasesPage() {
  const supabase = await createClient();
  const { data } = await listPublicOpenCases(supabase, 50, 0);
  return <PublicOpenCasesList cases={data ?? []} />;
}
