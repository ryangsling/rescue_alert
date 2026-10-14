import { listVerifiedDirectory } from "@rescue-alert/api";
import { createClient } from "../../lib/supabase/server";
import { DirectoryList } from "../../components/DirectoryList";

export default async function DirectoryPage() {
  const supabase = await createClient();
  const { data } = await listVerifiedDirectory(supabase);
  return <DirectoryList organizations={data ?? []} />;
}
