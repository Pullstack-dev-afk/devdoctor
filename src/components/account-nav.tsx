"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

export default function AccountNav() {
  const [email, setEmail] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [supabase] = useState(createSupabaseBrowserClient);

  useEffect(() => {
    void fetch("/api/auth/me").then((response) => response.json()).then((data: { email: string | null; isAdmin: boolean }) => { setEmail(data.email); setIsAdmin(data.isAdmin); });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => setEmail(session?.user.email ?? null));
    return () => listener.subscription.unsubscribe();
  }, [supabase]);

  return <nav className="account-nav" aria-label="Account navigation"><Link href="/">Diagnose</Link>{email ? <><Link href="/account">Account</Link>{isAdmin && <Link href="/admin">Admin</Link>}<button type="button" onClick={() => void supabase.auth.signOut().then(() => window.location.assign("/"))}>Logout</button></> : <><Link href="/auth?mode=login">Login</Link><Link className="nav-cta" href="/auth?mode=signup">Create account</Link></>}</nav>;
}