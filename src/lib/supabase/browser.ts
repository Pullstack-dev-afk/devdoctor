import { createBrowserClient } from "@supabase/ssr";
import { supabasePublishableKey, supabaseUrl } from "./config";

export function createSupabaseBrowserClient() {
  return createBrowserClient(
    supabaseUrl || "https://placeholder.supabase.co",
    supabasePublishableKey || "placeholder-anon-key",
  );
}