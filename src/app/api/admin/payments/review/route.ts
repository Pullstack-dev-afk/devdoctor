import { NextResponse } from "next/server";
import { getAuthenticatedUser, isAdmin } from "@/lib/auth-server";
import { membershipConfig } from "@/lib/membership";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  try {
    const { user } = await getAuthenticatedUser();
    if (!user || !isAdmin(user.id)) return NextResponse.json({ error: "Not authorized." }, { status: 403 });
    const body = await request.json().catch(() => ({})) as { paymentId?: string; status?: string };
    if (!body.paymentId || !["approved", "rejected"].includes(body.status || "")) return NextResponse.json({ error: "Invalid review request." }, { status: 400 });
    const admin = createSupabaseAdminClient();
    const { data: payment } = await admin.from("payment_requests").select("id,user_id,status,payment_method").eq("id", body.paymentId).maybeSingle();
    if (!payment || payment.payment_method !== "bank_transfer" || payment.status !== "pending") return NextResponse.json({ error: "This payment is no longer pending." }, { status: 409 });
    const now = new Date().toISOString();
    const { data: reviewed, error } = await admin.from("payment_requests").update({ status: body.status, reviewed_at: now, reviewed_by: user.id, updated_at: now }).eq("id", payment.id).eq("status", "pending").select("id");
    if (error) throw error;
    if (!reviewed?.length) return NextResponse.json({ error: "This payment was already reviewed." }, { status: 409 });
    if (body.status === "approved") {
      const expiresAt = new Date(Date.now() + membershipConfig.durationDays * 86400000).toISOString();
      const { error: membershipError } = await admin.from("memberships").update({ plan: "pro", status: "active", started_at: now, expires_at: expiresAt, canceled_at: null, updated_at: now }).eq("user_id", payment.user_id);
      if (membershipError) throw membershipError;
    }
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Payment review is unavailable. Try again shortly." }, { status: 503 });
  }
}