import { redirect } from "next/navigation";
import { getAuthenticatedUser, isAdmin } from "@/lib/auth-server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import AdminActions from "./admin-actions";
import { supabasePublishableKey, supabaseUrl } from "@/lib/supabase/config";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  if (!supabaseUrl || !supabasePublishableKey) redirect("/auth?mode=login");
  const { user } = await getAuthenticatedUser();
  if (!user) redirect("/auth?mode=login");
  if (!isAdmin(user.id)) redirect("/");
  const admin = createSupabaseAdminClient();
  const { data: payments } = await admin.from("payment_requests").select("id,user_id,payment_method,amount,currency,payment_reference,proof_url,submitted_at,status").order("submitted_at", { ascending: false }).limit(100);
  const userIds = [...new Set((payments || []).map((payment) => payment.user_id))];
  const emails = new Map<string, string>();
  await Promise.all(userIds.map(async (id) => {
    const { data } = await admin.from("profiles").select("email").eq("id", id).maybeSingle();
    if (data?.email) emails.set(id, data.email);
  }));
  return <main className="account-shell admin-shell"><section className="account-card"><span className="step-label">DEV DOCTOR / ADMIN</span><h1>Payment requests</h1><div className="admin-table">{payments?.length ? payments.map((payment) => <article className="admin-row" key={payment.id}><div><strong>{emails.get(payment.user_id) || "Unknown user"}</strong><span>{payment.payment_method.replace("_", " ")} · {payment.amount} {payment.currency}</span><span>{payment.payment_reference || "No reference"} · {new Date(payment.submitted_at).toLocaleString()}</span></div><span className={`confidence ${payment.status === "pending" ? "warning" : ""}`}>{payment.status}</span>{payment.proof_url && <a href={payment.proof_url} target="_blank" rel="noreferrer">View proof</a>}{payment.status === "pending" && payment.payment_method === "bank_transfer" && <AdminActions paymentId={payment.id} />}</article>) : <p className="muted-copy">No payment requests yet.</p>}</div></section></main>;
}