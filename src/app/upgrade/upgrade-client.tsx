"use client";

import Link from "next/link";
import { useState } from "react";

type UpgradeConfig = { proPrice: number; currency: string; durationDays: number; bank: { name: string; accountHolder: string; iban: string; swift: string } };

export default function UpgradeClient({ config }: { config: UpgradeConfig }) {
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [reference, setReference] = useState("");
  const [loading, setLoading] = useState("");
  async function paypal() {
    setLoading("paypal"); setError("");
    const response = await fetch("/api/payments/paypal/create", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ origin: window.location.origin }) });
    const data = await response.json().catch(() => ({}));
    setLoading("");
    if (!response.ok) return setError(data.error || "PayPal checkout is unavailable.");
    window.location.assign(data.approvalUrl);
  }
  async function bank(event: React.FormEvent) {
    event.preventDefault(); setLoading("bank"); setError("");
    const response = await fetch("/api/payments/bank", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ paymentReference: reference }) });
    const data = await response.json().catch(() => ({})); setLoading("");
    if (!response.ok) return setError(data.error || "Payment submission is unavailable.");
    setMessage("Payment submitted. Your payment is waiting for verification.");
  }
  return <main className="account-shell"><section className="account-card upgrade-card"><span className="step-label">DEV DOCTOR / PRO</span><h1>Keep the fix moving.</h1><p>Get the full diagnostic workspace with a Pro membership.</p><div className="price"><strong>{config.proPrice} {config.currency}</strong><span>/ {config.durationDays} days</span></div><ul className="benefits"><li>Actionable infrastructure diagnoses</li><li>Corrected commands and configuration</li><li>Copy-ready fixes for your next deploy</li></ul><button className="diagnose-button" type="button" onClick={() => void paypal()} disabled={Boolean(loading)}>{loading === "paypal" ? "Opening PayPal..." : "Pay with PayPal"}</button><div className="or-divider">OR PAY BY BANK TRANSFER</div><div className="bank-details"><div><span>Bank</span><strong>{config.bank.name}</strong></div><div><span>Account holder</span><strong>{config.bank.accountHolder}</strong></div><div><span>IBAN</span><strong>{config.bank.iban}</strong></div><div><span>SWIFT / BIC</span><strong>{config.bank.swift}</strong></div><div><span>Amount</span><strong>{config.proPrice} {config.currency}</strong></div></div><form onSubmit={bank}><label>Payment reference<input value={reference} onChange={(event) => setReference(event.target.value)} placeholder="Reference from your bank transfer" required /></label><button className="secondary-button" type="submit" disabled={Boolean(loading)}>{loading === "bank" ? "Submitting..." : "Submit bank transfer"}</button></form>{error && <p className="error-message" role="alert">{error}</p>}{message && <p className="success-message">{message}</p>}<Link className="text-action" href="/account">Back to account</Link></section></main>;
}