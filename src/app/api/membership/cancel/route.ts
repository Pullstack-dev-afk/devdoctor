import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth-server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export async function POST() {
  try {
    const { user } = await getAuthenticatedUser();
    if (!user) return NextResponse.json({ error: "Sign in to manage your membership." }, { status: 401 });
    const admin = createSupabaseAdminClient();
    const { error } = await admin.from("memberships").update({ status: "canceled", canceled_at: new Date().toISOString(), updated_at: new Date().toISOString() }).eq("user_id", user.id).eq("plan", "pro").eq("status", "active");
    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Membership cancellation is unavailable. Try again shortly." }, { status: 503 });
  }
}