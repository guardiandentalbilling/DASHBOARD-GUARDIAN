Monorepo export prepared for GitHub.

This directory contains a cleaned subset structured for version control. The backend (employee-dashboard) retains source, while deployment artifacts and secrets are excluded.

## Deployment


This project is configured for Netlify (frontend) and Railway (backend) deployment.

### Backend (Railway) Health Check
After each deploy you can verify the service quickly:

1. Open the Railway service URL in your browser: `https://<your-service>.up.railway.app/health`
2. You should receive JSON: `{ "status": "ok", "mongo": true|false, "time": "..." }`
3. If it times out or shows the Railway placeholder, check logs – most common cause is a slow Mongo connection. We now set short (5s) Mongo timeouts via environment variables:
	- `MONGO_SERVER_SELECTION_TIMEOUT_MS=5000`
	- `MONGO_CONNECT_TIMEOUT_MS=5000`
	You can adjust these in Railway Variables if your cluster needs longer.

If Mongo is unreachable the API still boots in demo mode so the frontend won’t hang.
See employee-dashboard/README.md for service details.

### Hostinger VPS
For deploying everything onto a single Hostinger VPS (Node.js + PM2 + Nginx + SSL) see: [HOSTINGER_VPS_DEPLOYMENT.md](./HOSTINGER_VPS_DEPLOYMENT.md)

Guide covers:
1. SSH login & user hardening
2. Installing Node & PM2
3. Reverse proxy with Nginx and HTTPS (Certbot)
4. Environment variables & `.env` setup
5. Optional separate API domain (api.assests.online)
6. Troubleshooting & security quick wins


