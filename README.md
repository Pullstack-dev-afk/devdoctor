# Dev Doctor

Dev Doctor is a diagnostic workspace for turning infrastructure errors and configuration into a clear root cause, reasoning, and an exact fix. The MVP covers Kubernetes, Docker, GitHub Actions, Terraform, and AWS.

## Run locally

Requires Node.js 18.17+ and npm.

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open `http://localhost:3000`.

The default `mock` provider makes the app usable without a paid model or an API key. Keep real credentials in `.env.local`; never place them in client components or committed files.

## Environment variables

- `AI_PROVIDER=mock` uses the included local provider. Other provider values fail clearly until a matching server-side adapter is configured.
- `OPENAI_API_KEY` is reserved for a future server-side provider adapter and must never be exposed with a `NEXT_PUBLIC_` name.
- `SUPABASE_URL` and `SUPABASE_PUBLISHABLE_KEY` power browser/server sessions. Next.js exposes only these two non-secret values to the browser at build time; `SUPABASE_SECRET_KEY` is server-only and is required for account deletion and payment review. The older `NEXT_PUBLIC_SUPABASE_*` and `SUPABASE_SERVICE_ROLE_KEY` aliases are also supported.
- `PAYPAL_CLIENT_ID`, `PAYPAL_CLIENT_SECRET`, and `PAYPAL_ENVIRONMENT` configure optional PayPal Sandbox/production checkout. The secret is server-only.
- `PRO_PRICE`, `PRO_CURRENCY`, `PRO_DURATION_DAYS`, `BANK_NAME`, `BANK_ACCOUNT_HOLDER`, `BANK_IBAN`, `BANK_SWIFT`, and `ADMIN_USER_IDS` configure membership and manual review.

## Supabase setup

Create a Supabase project, copy its URL and anon key into `.env.local`, and run `supabase/migrations/001_memberships.sql` in the Supabase SQL editor. The migration creates the profile, membership, payment request tables, signup trigger, and RLS policies. Set `ADMIN_USER_IDS` to a comma-separated list of trusted Supabase Auth user IDs.

## Deploy to Vercel

Import the repository into Vercel, keep the default Next.js build settings, and add the variables above in the project environment settings. Deploy, then open the generated URL.

## Architecture

- `src/app/page.tsx` contains the focused diagnostic workflow and calls the server API.
- `src/app/api/diagnose/route.ts` validates the request and owns the HTTP contract.
- `src/lib/ai/index.ts` selects the active provider through `AI_PROVIDER`.
- `src/lib/ai/mock-provider.ts` is the local MVP adapter. A hosted provider can implement the `AIProvider` interface without changing the UI.
- `src/lib/diagnostics.ts` contains the shared request and diagnosis types.

The API currently accepts:

```json
{ "input": "...", "focusArea": "Kubernetes" }
```

and returns a diagnosis with `title`, `summary`, `confidence`, `why`, `fix`, `checks`, and `references`. Authentication, persistence, rate limiting, and billing can be added around this route later without coupling them to the editor surface.

## Production checks

```bash
npm run lint
npm run build
```