import Link from "next/link";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { effectiveMembershipStatus, hasActiveProMembership } from "@/lib/membership";
import AccountActions from "./account-actions";
import { supabasePublishableKey, supabaseUrl } from "@/lib/supabase/config";

export const dynamic = "force-dynamic";

export default async function AccountPage() {
  if (!supabaseUrl || !supabasePublishableKey) redirect("/auth?mode=login");
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth?mode=login");
  const { data: profile } = await supabase.from("profiles").select("created_at, email").eq("id", user.id).maybeSingle();
  const { data: membership } = await supabase.from("memberships").select("plan,status,started_at,expires_at,canceled_at").eq("user_id", user.id).maybeSingle();
  const activePro = hasActiveProMembership(membership);
  const status = effectiveMembershipStatus(membership);
  return <main className="account-shell"><section className="account-card"><div className="account-card-header"><div><span className="step-label">DEV DOCTOR / ACCOUNT</span><h1>Account</h1></div><span className={`confidence ${activePro ? "" : "info"}`}>{activePro ? "● Pro active" : "● Free plan"}</span></div><dl className="account-details"><div><dt>Email</dt><dd>{profile?.email ?? user.email}</dd></div><div><dt>Member since</dt><dd>{formatDate(profile?.created_at ?? user.created_at)}</dd></div><div><dt>Current plan</dt><dd>{activePro ? "Pro" : "Free"}</dd></div><div><dt>Status</dt><dd>{status}</dd></div><div><dt>Membership started</dt><dd>{formatDate(membership?.started_at)}</dd></div>{membership?.expires_at && <div><dt>Membership expires</dt><dd>{formatDate(membership.expires_at)}</dd></div>}</dl><div className="account-actions">{activePro && status === "active" ? <AccountActions action="cancel" /> : !activePro && <Link className="diagnose-button account-button" href="/upgrade">Upgrade to Pro <span>↗</span></Link>}<AccountActions action="logout" /><AccountActions action="delete" /></div></section></main>;
}

function formatDate(value?: string | null) { return value ? new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(new Date(value)) : "Not set"; }