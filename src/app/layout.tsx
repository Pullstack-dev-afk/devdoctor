import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Dev Doctor | Diagnose the failure",
  description: "Turn infrastructure errors into clear explanations and exact fixes.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}