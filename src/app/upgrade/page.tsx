import { redirect } from "next/navigation";
import { getAuthenticatedUser } from "@/lib/auth-server";
import { membershipConfig } from "@/lib/membership";
import UpgradeClient from "./upgrade-client";
import { supabasePublishableKey, supabaseUrl } from "@/lib/supabase/config";

export const dynamic = "force-dynamic";

export default async function UpgradePage() {
  if (!supabaseUrl || !supabasePublishableKey) redirect("/auth?mode=login");
  const { user } = await getAuthenticatedUser();
  if (!user) redirect("/auth?mode=login");
  return <UpgradeClient config={membershipConfig} />;
}
