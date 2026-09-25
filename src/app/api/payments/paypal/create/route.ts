import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth-server";
import { membershipConfig } from "@/lib/membership";
import { createPayPalOrder } from "@/lib/payments/paypal";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  try {
    const { user } = await getAuthenticatedUser();
    if (!user) return NextResponse.json({ error: "Sign in before upgrading." }, { status: 401 });
    const body = await request.json().catch(() => ({})) as { origin?: string };
    const origin = typeof body.origin === "string" && /^https?:\/\//.test(body.origin) ? body.origin : new URL(request.url).origin;
    const admin = createSupabaseAdminClient();
    const { data: existing } = await admin.from("payment_requests").select("id").eq("user_id", user.id).eq("payment_method", "paypal").in("status", ["pending", "approved"]).limit(1);
    if (existing?.length) return NextResponse.json({ error: "You already have a PayPal payment in progress or completed." }, { status: 409 });
    const order = await createPayPalOrder(membershipConfig.proPrice, membershipConfig.currency, `${origin}/api/payments/paypal/capture`, `${origin}/upgrade?cancelled=1`);
    const { error } = await admin.from("payment_requests").insert({ user_id: user.id, payment_method: "paypal", amount: membershipConfig.proPrice, currency: membershipConfig.currency, plan: "pro", status: "pending", provider_transaction_id: order.id });
    if (error) throw error;
    const approvalUrl = order.links?.find((link) => link.rel === "approve")?.href;
    if (!approvalUrl) throw new Error("PayPal did not provide an approval link.");
    return NextResponse.json({ approvalUrl });
  } catch (error) {
    const message = error instanceof Error && ["PayPal is not configured.", "PayPal authentication failed."].includes(error.message) ? error.message : "PayPal checkout is unavailable. Try again shortly.";
    return NextResponse.json({ error: message }, { status: 503 });
  }
}