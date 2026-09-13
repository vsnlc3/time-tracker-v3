# Cadence frontend

Next.js frontend for the time tracker. The browser talks to the Spring Boot API
through the same-origin `/spring-api` rewrite, so the session and CSRF cookies
remain same-origin.

## Development

From the repository root, copy `.env.example` to `.env`, set the Google OAuth
values, and start the stack:

```bash
docker compose up --build
```

Open <http://localhost:3000> and sign in with Google. For frontend-only work:

```bash
pnpm install --frozen-lockfile
pnpm dev
```

The frontend-only server expects Spring Boot at `http://localhost:8080` unless
`SPRING_API_URL` or `NEXT_PUBLIC_SPRING_API_URL` is set.

## Checks

```bash
pnpm typecheck
pnpm lint
pnpm build
```
