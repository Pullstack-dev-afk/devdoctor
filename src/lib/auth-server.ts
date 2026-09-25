import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function getAuthenticatedUser() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  return { supabase, user };
}

export function isAdmin(userId: string) {
  return (process.env.ADMIN_USER_IDS || "").split(",").map((id) => id.trim()).includes(userId);
}