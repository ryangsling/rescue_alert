import { redirect } from "next/navigation";
import { createClient } from "../../lib/supabase/server";
import { AccountSettings } from "./account-settings";

export default async function AccountPage() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();

  if (!data?.claims) {
    redirect("/sign-in");
  }

  return (
    <AccountSettings
      email={String(data.claims.email ?? "")}
      userId={String(data.claims.sub ?? "")}
    />
  );
}
