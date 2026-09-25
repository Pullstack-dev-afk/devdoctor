"use client";

import { useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

export default function AccountActions({ action }: { action: "logout" | "delete" | "cancel" }) {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  async function run() {
    setError("");
    if (action === "delete" && !window.confirm("Delete your account and all associated payment records? This cannot be undone.")) return;
    setLoading(true);
    if (action === "logout") {
      await createSupabaseBrowserClient().auth.signOut();
      return window.location.assign("/");
    }
    const response = await fetch(action === "delete" ? "/api/auth/delete" : "/api/membership/cancel", { method: "POST" });
    const data = await response.json().catch(() => ({}));
    setLoading(false);
    if (!response.ok) return setError(data.error || "That action could not be completed.");
    window.location.reload();
  }
  return <span className="action-wrap"><button type="button" className={action === "delete" ? "text-action danger" : "text-action"} onClick={() => void run()} disabled={loading}>{loading ? "Working..." : action === "logout" ? "Logout" : action === "delete" ? "Delete account" : "Cancel membership"}</button>{error && <small className="error-message">{error}</small>}</span>;
}