Backend Deployment Guide (dashboard.guardiandentalbilling.com)
=============================================================

Architecture
------------
Static frontend: https://dashboard.guardiandentalbilling.com (Hostinger shared hosting)
Backend API: https://api.dashboard.guardiandentalbilling.com (Managed Node host e.g. Render)

1. Prerequisites
-----------------
* GitHub repository connected
* MongoDB Atlas cluster + connection string
* Domain DNS managed where you can add CNAME records
* Node.js 18+ runtime recommended on host

2. Environment Variables (.env on backend host)
-----------------------------------------------
NODE_ENV=production
PORT=5000
MONGO_URI=YOUR_ATLAS_URI
JWT_SECRET=REPLACE_WITH_LONG_RANDOM_SECRET
ALLOWED_ORIGINS=https://dashboard.guardiandentalbilling.com,https://www.dashboard.guardiandentalbilling.com
API_RATE_LIMIT=100
GEMINI_API_KEY=YOUR_GEMINI_KEY (server usage only if needed)

Optional:
LOG_LEVEL=info
SESSION_SECRET=ANOTHER_RANDOM_SECRET
UPLOAD_PATH=/uploads
MAX_FILE_SIZE=10485760

3. Render Deployment (example)
------------------------------
1. Create new Web Service -> Select repository -> Root: employee-dashboard folder
2. Build Command: (leave blank / none) because no build step
3. Start Command: npm start
4. Add Environment Variables (above list)
5. Deploy -> wait for healthy status

4. Verify Health
----------------
curl https://<render-service>.onrender.com/api/health
Should return JSON: { status: "OK", mongoConnected: true }

5. DNS Setup
------------
Add CNAME record:
Host: api.dashboard  Points to: <render-service-hostname>  TTL: 300
(Exact host depends on registrar UI; final FQDN: api.dashboard.guardiandentalbilling.com)

After propagation (5-30m) test:
curl https://api.dashboard.guardiandentalbilling.com/api/health

6. Frontend API Base
--------------------
The frontend auto-detects production and uses:
https://api.dashboard.guardiandentalbilling.com/api
You can override manually in browser console:
localStorage.setItem('GLOBAL_API_BASE_URL','https://api.dashboard.guardiandentalbilling.com/api');

7. CORS
-------
Configured via ALLOWED_ORIGINS. Update env var if you add www or alternate domains.

8. Logs & Monitoring
--------------------
* Render dashboard -> Logs for stdout/stderr
* Add uptime monitor hitting /api/health every 1m

9. Rate Limiting / Security
---------------------------
* Adjust API_RATE_LIMIT if users > ~50 active per 15m window
* Helmet CSP already applied; modify in server.js if adding CDNs

10. File Uploads
----------------
Current uploads stored locally under /uploads. For scaling, move to S3-compatible storage and replace multer destination.

11. Post-Deployment Checklist
-----------------------------
[ ] /api/health returns OK
[ ] Frontend pages load without mixed-content warnings
[ ] Login works
[ ] Employee CRUD works
[ ] Attendance check-in/out works
[ ] Loan requests list loads
[ ] Rate limiting not triggering during normal usage
[ ] Error logs clean (no unhandled rejections)

12. Troubleshooting
-------------------
Problem: CORS blocked
Solution: Confirm ALLOWED_ORIGINS matches exact scheme + host (no trailing slash).

Problem: Mongo not connected
Solution: Check IP access list in Atlas, confirm username/password, retry deploy.

Problem: Health OK but frontend 404
Solution: Ensure static assets uploaded to Hostinger public_html and correct index/login paths.

---
Update this document as infrastructure evolves.
