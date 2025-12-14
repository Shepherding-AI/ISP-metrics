# ISP Health AI (Dashboard + On‑Prem Probe Agent)

- `apps/web` — Next.js dashboard + API ingest endpoints + Postgres persistence via Prisma
- `apps/agent` — On‑prem probe agent (Python) that runs tests and POSTs results to the cloud API

## Web env (`apps/web/.env`)
```bash
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/isphealth?schema=public"
INGEST_API_KEY="dev_ingest_key_change_me"
NEXT_PUBLIC_APP_NAME="ISP Health AI"
NEXT_PUBLIC_BASE_URL="http://localhost:3000"
```

## Agent env (`apps/agent/.env`)
```bash
CLOUD_BASE_URL="http://localhost:3000"
INGEST_API_KEY="dev_ingest_key_change_me"
SITE_SLUG="lab"
PROBE_NAME="onprem-1"
INTERVAL_SECONDS="15"
PING_TARGETS="1.1.1.1,8.8.8.8"
HTTP_TARGETS="https://www.google.com,https://www.cloudflare.com"
DNS_HOSTNAME="www.google.com"
DNS_SERVERS="1.1.1.1,8.8.8.8"
```

## Run
```bash
npm install
cd apps/web
npx prisma generate
npx prisma migrate dev --name init
cd ../..
npm run dev
```
