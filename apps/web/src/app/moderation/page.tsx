import { redirect } from "next/navigation";
import { createClient } from "../../lib/supabase/server";
import { ModerationDashboard } from "./moderation-dashboard";

export default async function ModerationPage() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();

  if (!data?.claims) {
    redirect("/sign-in");
  }

  const userId = String(data.claims.sub ?? "");
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .single();

  if (!profile || !["moderator", "administrator"].includes(profile.role)) {
    redirect("/");
  }

  return (
    <ModerationDashboard
      userId={userId}
      isAdministrator={profile.role === "administrator"}
    />
  );
}
