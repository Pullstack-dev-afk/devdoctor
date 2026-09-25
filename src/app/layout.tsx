import type { Metadata } from "next";
import "./globals.css";
import AccountNav from "@/components/account-nav";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Dev Doctor | Diagnose the failure",
  description: "Turn infrastructure errors into clear explanations and exact fixes.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body><AccountNav />{children}</body>
    </html>
  );
}