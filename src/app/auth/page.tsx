"use client";

import { FormEvent, useState } from "react";
import { useSearchParams } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

export default function AuthPage() {
  const searchParams = useSearchParams();
  const [mode, setMode] = useState(searchParams.get("mode") === "login" ? "login" : "signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const supabase = createSupabaseBrowserClient();

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError(""); setMessage("");
    if (!/^\S+@\S+\.\S+$/.test(email)) return setError("Enter a valid email address.");
    if (password.length < 8) return setError("Use at least 8 characters for your password.");
    if (mode === "signup" && password !== confirmPassword) return setError("Passwords do not match.");
    setLoading(true);
    try {
      const result = mode === "login"
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({ email, password, options: { emailRedirectTo: `${window.location.origin}/auth/callback` } });
      if (result.error) return setError(result.error.message.includes("already registered") ? "An account with that email already exists." : result.error.message);
      if (mode === "signup" && !result.data.session) return setMessage("Account created. Check your email to confirm your account, then log in.");
      window.location.assign("/account");
    } catch {
      setError("Supabase is not configured for this app. Add the project URL and publishable key to .env.local, then restart the dev server.");
    } finally {
      setLoading(false);
    }
  }

  return <main className="account-shell"><div className="auth-card"><span className="step-label">DEV DOCTOR / ACCOUNT</span><h1>{mode === "login" ? "Welcome back." : "Create your account."}</h1><p>{mode === "login" ? "Sign in to manage your Dev Doctor account." : "Start free and keep your diagnosis workspace open."}</p><form onSubmit={submit}><label>Email<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" required /></label><label>Password<input type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete={mode === "login" ? "current-password" : "new-password"} required /></label>{mode === "signup" && <label>Confirm password<input type="password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} autoComplete="new-password" required /></label>}<button className="diagnose-button" type="submit" disabled={loading}>{loading ? "Working..." : mode === "login" ? "Log in" : "Create account"}</button></form>{error && <p className="error-message" role="alert">{error}</p>}{message && <p className="success-message">{message}</p>}<button className="text-action" type="button" onClick={() => { setMode(mode === "login" ? "signup" : "login"); setError(""); }}>{mode === "login" ? "Create an account" : "Already have an account? Log in"}</button></div></main>;
}