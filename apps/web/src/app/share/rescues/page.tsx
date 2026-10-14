import { listPublicRescueHistory } from "@rescue-alert/api";
import { createClient } from "../../../lib/supabase/server";
import { PublicRescueHistoryList } from "./public-rescue-history-list";

export const metadata = {
  title: "Rescue history - Rescue Alert",
  description: "Rescues completed through Rescue Alert's pilot community.",
};

export default async function PublicRescueHistoryPage() {
  const supabase = await createClient();
  const { data } = await listPublicRescueHistory(supabase, 50, 0);
  return <PublicRescueHistoryList rescues={data ?? []} />;
}
