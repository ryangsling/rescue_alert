import { redirect } from "next/navigation";
import { createClient } from "../../lib/supabase/server";
import { MyOrganizations } from "./my-organizations";

export default async function OrganizationsPage() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();

  if (!data?.claims) {
    redirect("/sign-in");
  }

  return <MyOrganizations userId={String(data.claims.sub ?? "")} />;
}
