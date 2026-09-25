import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth-server";
import { membershipConfig } from "@/lib/membership";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  try {
    const { user } = await getAuthenticatedUser();
    if (!user) return NextResponse.json({ error: "Sign in before submitting a payment." }, { status: 401 });
    const body = await request.json().catch(() => ({})) as { paymentReference?: string; proofUrl?: string };
    const paymentReference = typeof body.paymentReference === "string" ? body.paymentReference.trim().slice(0, 200) : "";
    if (!paymentReference) return NextResponse.json({ error: "Enter your bank payment reference." }, { status: 400 });
    const admin = createSupabaseAdminClient();
    const { data: existing } = await admin.from("payment_requests").select("id").eq("user_id", user.id).eq("payment_method", "bank_transfer").eq("status", "pending").limit(1);
    if (existing?.length) return NextResponse.json({ error: "You already have a bank transfer waiting for verification." }, { status: 409 });
    const { error } = await admin.from("payment_requests").insert({ user_id: user.id, payment_method: "bank_transfer", amount: membershipConfig.proPrice, currency: membershipConfig.currency, plan: "pro", status: "pending", payment_reference: paymentReference, proof_url: typeof body.proofUrl === "string" ? body.proofUrl.trim().slice(0, 500) : null });
    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Payment submission is unavailable. Try again shortly." }, { status: 503 });
  }
}