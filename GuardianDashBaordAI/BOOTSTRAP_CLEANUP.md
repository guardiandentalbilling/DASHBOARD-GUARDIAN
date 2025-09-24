# Bootstrap & Admin Reset Cleanup Guide

After confirming your permanent admin account works, you should harden the deployment by removing or disabling temporary bootstrap functionality.

## 1. Verify Admin Account
1. Log in via `/login.html` using your permanent admin credentials.
2. Open the browser console and run:
   ```js
   JSON.parse(localStorage.getItem('userData'))
   ```
   Confirm `role` is `"admin"`.
3. (Optional) Call the API directly:
   ```bash
   curl -s https://<your-domain>/api/auth/login -H "Content-Type: application/json" \
     -d '{"username":"yourAdmin","password":"yourSecret"}' | jq '.role'
   ```

## 2. Remove Bootstrap Route (Optional After Stabilization)
Bootstrap routes live in `backend/routes/bootstrapRoutes.js` and are mounted unconditionally in `server.js`:
```js
app.use('/api/bootstrap', require('./backend/routes/bootstrapRoutes'));
```
To remove:
1. Comment or delete that `app.use` line.
2. Delete the `bootstrapRoutes.js` file if no longer needed.
3. Remove any now-unused environment variables (see below).

## 3. Rotate / Remove Environment Variables
Remove `ADMIN_BOOTSTRAP_TOKEN` from your Railway / hosting environment variables. If you keep it (for rare emergencies), rotate it to a new random value and store it securely (password manager / secret manager). Never commit it to version control.

## 4. Disable Auth Debug Logging
Unset (or set to `false`) the following once you finish testing:
- `AUTH_DEBUG`

## 5. Optional: Harden Rate Limits
Current rate limiting is global for `/api/`. Consider adding a stricter limiter for `/api/auth/login` (e.g., 5 attempts per 5 minutes per IP) and a short cooldown for password reset endpoints.

## 6. Add Monitoring / Alerts
Set up basic alerts:
- HTTP 5xx spike
- Authentication failure spike (> X per minute)
- Sudden increase in `force-reset` attempts (should be zero after removal)

## 7. Validate No Public Exposure of Reset Endpoint
After redeploying without the bootstrap route:
```bash
curl -i https://<your-domain>/api/bootstrap/health
```
Should return `404`.

## 8. Commit & Redeploy Checklist
- [ ] `server.js` bootstrap mount removed or commented
- [ ] `bootstrapRoutes.js` deleted (if fully decommissioned)
- [ ] `ADMIN_BOOTSTRAP_TOKEN` removed/rotated
- [ ] `AUTH_DEBUG` disabled
- [ ] 404 page present (`404.html`)
- [ ] Smoke test: login (admin + employee) OK

## 9. Disaster Recovery Note
If you ever lose admin access again and have removed bootstrap:
1. Temporarily reintroduce `bootstrapRoutes.js` (keep a secured copy off‑repo or retrieve from git history).
2. Add a **new** `ADMIN_BOOTSTRAP_TOKEN` env var.
3. Deploy, run a single `force-reset` call, then repeat cleanup steps.

## 10. Future Improvements (Roadmap)
- Consolidate auth responses into standardized shape: `{ user: { ... }, token }`.
- Add refresh token + short-lived access token.
- Implement password reset email flow.
- Enforce MFA for admin accounts.
- Audit logging for role changes & privileged actions.

---
**Security Reminder:** Never leave emergency bootstrap or reset endpoints active in production longer than strictly necessary.
