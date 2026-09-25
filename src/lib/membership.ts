export const membershipConfig = {
  proPrice: Number(process.env.PRO_PRICE || "19"),
  currency: process.env.PRO_CURRENCY || "USD",
  durationDays: Number(process.env.PRO_DURATION_DAYS || "30"),
  bank: {
    name: process.env.BANK_NAME || "Configured in Vercel",
    accountHolder: process.env.BANK_ACCOUNT_HOLDER || "Configured in Vercel",
    iban: process.env.BANK_IBAN || "Configured in Vercel",
    swift: process.env.BANK_SWIFT || "Configured in Vercel",
  },
};

export function hasActiveProMembership(membership: { plan: string; status: string; expires_at: string | null } | null) {
  return Boolean(membership?.plan === "pro" && ["active", "canceled"].includes(membership.status) && membership.expires_at && new Date(membership.expires_at) > new Date());
}

export function effectiveMembershipStatus(membership: { status: string; expires_at: string | null } | null) {
  if (!membership) return "active";
  if (membership.expires_at && new Date(membership.expires_at) <= new Date()) return "expired";
  return membership.status;
}