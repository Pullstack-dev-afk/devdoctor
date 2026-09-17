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