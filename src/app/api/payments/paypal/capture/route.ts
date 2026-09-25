import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth-server";
import { membershipConfig } from "@/lib/membership";
import { capturePayPalOrder } from "@/lib/payments/paypal";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const orderId = url.searchParams.get("token");
  try {
    const { user } = await getAuthenticatedUser();
    if (!user || !orderId) return NextResponse.redirect(new URL("/upgrade?error=Payment%20could%20not%20be%20verified", request.url));
    const admin = createSupabaseAdminClient();
    const { data: payment } = await admin.from("payment_requests").select("id,status,user_id").eq("provider_transaction_id", orderId).eq("user_id", user.id).maybeSingle();
    if (!payment) return NextResponse.redirect(new URL("/upgrade?error=Payment%20record%20was%20not%20found", request.url));
    if (payment.status === "approved") return NextResponse.redirect(new URL("/account?payment=complete", request.url));
    const result = await capturePayPalOrder(orderId);
    const capture = result.purchase_units?.[0]?.payments?.captures?.[0];
    if (result.status !== "COMPLETED" || capture?.status !== "COMPLETED") throw new Error("PayPal payment was not completed.");
    const expiresAt = new Date(Date.now() + membershipConfig.durationDays * 86400000).toISOString();
    await admin.from("payment_requests").update({ status: "approved", provider_transaction_id: capture.id || orderId, reviewed_at: new Date().toISOString(), updated_at: new Date().toISOString() }).eq("id", payment.id).eq("status", "pending");
    await admin.from("memberships").update({ plan: "pro", status: "active", started_at: new Date().toISOString(), expires_at: expiresAt, canceled_at: null, updated_at: new Date().toISOString() }).eq("user_id", user.id);
    return NextResponse.redirect(new URL("/account?payment=complete", request.url));
  } catch {
    if (orderId) await createSupabaseAdminClient().from("payment_requests").update({ status: "failed", updated_at: new Date().toISOString() }).eq("provider_transaction_id", orderId).eq("status", "pending");
    return NextResponse.redirect(new URL("/upgrade?error=Payment%20verification%20failed", request.url));
  }
}