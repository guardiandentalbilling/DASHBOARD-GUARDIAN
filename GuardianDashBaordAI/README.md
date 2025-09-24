## Guardian Dashboard (AI Variant)

This folder contains the live application (dashboard + API) prepared for production deployment.

### Live Mode vs Previous Demo Mode
Earlier iterations silently entered a "demo" state when MongoDB was unreachable, responding with empty datasets so the UI stayed clickable. This has been hardened:

Key changes:
1. Central config: `backend/config/index.js` validates required env vars at startup when `NODE_ENV=production`.
2. Demo fallback disabled unless you explicitly set `ALLOW_DEMO_FALLBACK=true` (NOT recommended in production).
3. If DB is down and fallback disabled, API returns `503 Service Unavailable` instead of fake data.
4. Production start aborts if `MONGO_URI` or a sufficiently strong `JWT_SECRET` (>=32 chars) missing.

### Required Environment Variables
Copy `env.production.example` to `.env` and fill at minimum:
- NODE_ENV=production
- MONGO_URI=your_mongo_connection_string
- JWT_SECRET=long_random_secret_min32chars
- ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
- API_RATE_LIMIT=100
- ALLOW_DEMO_FALLBACK=false

Optional: EMAIL_* (if email features), GEMINI_API_KEY for AI proxy.

### Running Locally (Prod Simulation)
1. `npm install`
2. Create `.env` with above vars (can still point to local Mongo).
3. `NODE_ENV=production node server.js`

### Health & Diagnostics
- `GET /health` basic liveness + mongo flag
- `GET /api/health` extended status
- `GET /api/debug/env` (only non-production) snapshots environment context (sanitized)

### Failure Table
| Condition | Behavior |
|-----------|----------|
| DB connected | All feature routes operate normally |
| DB down & ALLOW_DEMO_FALLBACK=false | 503 responses for data routes (prevents silent data loss) |
| DB down & ALLOW_DEMO_FALLBACK=true | Mock empty/ok responses (legacy demo style) |

### Deployment Hardening
- Run behind reverse proxy (Nginx/Traefik/Cloudflare) forcing HTTPS.
- Use process manager (PM2, systemd, Docker) with auto-restart.
- Configure `pm2-logrotate` or external log rotation.
- Regular offsite Mongo backups + retention policy.
- Uptime monitoring hitting `/health` every minute.
- Security headers via Helmet already enabled; adjust CSP if you add new CDNs.

### Directory Highlights
- `server.js` Express app startup (production hardened)
- `backend/config/index.js` Central config & validation
- `backend/routes/*` API route handlers
- `backend/middleware/*` Auth, validation, logging
- `uploads/` User-uploaded assets (ensure restricted permissions in production)

### Next Steps / TODO (Optional Enhancements)
- Add structured logging (pino) with JSON output for observability stack.
- Add integration tests for critical routes.
- Introduce versioned API prefix (e.g. `/api/v1`).
- Implement password reset & email verification flows.

## Live Launch Final Checklist
1. Environment: `.env` present, required vars validated at startup (see earlier section).
2. Security:
	- `ALLOW_DEMO_FALLBACK=false`.
	- CORS `ALLOWED_ORIGINS` matches production domains.
	- `JWT_SECRET` length >= 32.
3. Database:
	- Mongo cluster reachable from host (network rules / IP whitelist updated).
	- Backups scheduled (Atlas automated or cron `mongodump`).
4. Process Manager:
	- `pm2 start ecosystem.config.js --env production`.
	- `pm2 save` & configure startup.
5. Logging & Monitoring:
	- PM2 logs or aggregated via external stack.
	- Uptime monitor hitting `/health`.
	- Alert if `mongoConnected=false` persists > 2 mins.
6. TLS / Reverse Proxy:
	- Nginx/Traefik/Cloudflare enforcing HTTPS & HTTP/2.
7. Tests:
	- Run `npm test` (in-memory Mongo) before deploy.
8. Rate Limits:
	- Adjust `API_RATE_LIMIT` to expected traffic.
9. Data Protection:
	- Regular review of logs for sensitive leakage (redaction configured via Pino).
10. Disaster Recovery:
	- Confirm restoration drill (restore dump to staging) at least once.

## Running Tests
Tests use an in-memory MongoDB instance; they don't touch production data.

Commands:
```
npm test
```

Structure:
- `jest.config.js` config.
- `tests/setup.js` spins up MongoMemoryServer.
- `tests/health.test.js` validates basic liveness endpoints.

Add more tests by creating additional `*.test.js` files under `tests/`.

## Directory Consolidation Recommendation
Two parallel directories existed (`employee-dashboard/` and `GuardianDashBaordAI/`). The hardened, production-ready version is in `GuardianDashBaordAI/`.

Suggested action:
1. Archive legacy folder: `git mv employee-dashboard archive-employee-dashboard` (or remove once confirmed unnecessary).
2. Update docs/tools to reference only `GuardianDashBaordAI`.
3. If unique models or routes exist only in the old folder, merge them manually before removal.
4. Enforce in CI: fail build if new commits touch archived folder.

---
For core feature documentation also see the sibling `employee-dashboard` directory README.

### Auth Response Shape (Backward Compatible Upgrade)
Authentication endpoints (`POST /api/users/login`, `POST /api/auth/login`, `POST /api/users/register`) now return BOTH:
1. Legacy flat fields: `_id, name, email, username, role, token`
2. A nested object: `user: { id, _id, name, email, username, role }`

Reason: Eases migration to a consistent response contract (`{ user, token }`) without breaking existing front‑end code that expected flat values.

Recommended new usage (frontend):
```js
const payload = await resp.json();
const user = payload.user || {
	id: payload._id,
	name: payload.name,
	email: payload.email,
	username: payload.username,
	role: payload.role
};
store(user, payload.token);
```

Flat fields will remain for at least one deprecation cycle. Plan to remove them once all consuming clients standardize.

### Focused Login Rate Limiting
A dedicated limiter protects login endpoints:
- Window: 5 minutes
- Max failed attempts: 10 (successful attempts are skipped via `skipSuccessfulRequests`)
- Affected routes: `POST /api/users/login`, `POST /api/auth/login`

Environment-wide limiter (default 15 min / global API) still applies in parallel. Tune via future env vars if necessary.

If you observe false positives (legitimate users blocked), consider raising `max` or adding IP allowlisting logic based on a reverse proxy header.

### Removed Bootstrap Reset Route
The emergency `/api/bootstrap/*` routes have been commented out in `server.js` after successful administrator seeding. For re‑enable steps see `BOOTSTRAP_CLEANUP.md`.

Security reminder: Never leave ad‑hoc credential reset endpoints active in production longer than required.
