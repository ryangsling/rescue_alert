import { createClient } from "../lib/supabase/server";
import { FeedList } from "../components/FeedList";

/** DESIGN.md 14.2 nearby feed - the app's default discovery surface. Public: browsing does not require sign-in, matching PRD 10.5's "list-default discovery" and is_case_visible()'s own anon-readable rule. */
export default async function Home() {
  const supabase = await createClient();
  const { data: animalTypes } = await supabase
    .from("animal_types")
    .select("id, slug, label_en, label_bn")
    .eq("is_active", true)
    .order("sort_order");

  return <FeedList animalTypes={animalTypes ?? []} />;
}
