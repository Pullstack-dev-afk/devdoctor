"use client";

import { useState } from "react";

export default function AdminActions({ paymentId }: { paymentId: string }) {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  async function review(status: "approved" | "rejected") {
    setLoading(true); setError("");
    const response = await fetch("/api/admin/payments/review", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ paymentId, status }) });
    const data = await response.json().catch(() => ({})); setLoading(false);
    if (!response.ok) return setError(data.error || "Review failed.");
    window.location.reload();
  }
  return <span className="admin-actions"><button type="button" className="secondary-button" disabled={loading} onClick={() => void review("approved")}>Approve</button><button type="button" className="text-action danger" disabled={loading} onClick={() => void review("rejected")}>Reject</button>{error && <small className="error-message">{error}</small>}</span>;
}