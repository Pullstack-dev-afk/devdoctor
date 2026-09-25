import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { supabasePublishableKey, supabaseUrl } from "./config";

export async function createSupabaseServerClient() {
  const cookieStore = await cookies();

  return createServerClient(
    supabaseUrl!,
    supabasePublishableKey!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(values) {
          try {
            values.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
          } catch {
            // Server Components cannot always write cookies; middleware refreshes sessions.
          }
        },
      },
    },
  );
}

export function assertSupabaseConfigured() {
  if (!supabaseUrl || !supabasePublishableKey) {
    throw new Error("Supabase is not configured.");
  }
}