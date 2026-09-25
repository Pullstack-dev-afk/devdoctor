import { createClient } from "@supabase/supabase-js";
import { supabaseSecretKey, supabaseUrl } from "./config";

export function createSupabaseAdminClient() {
  if (!supabaseUrl || !supabaseSecretKey) throw new Error("Server account management is not configured.");
  return createClient(supabaseUrl, supabaseSecretKey, { auth: { autoRefreshToken: false, persistSession: false } });
}