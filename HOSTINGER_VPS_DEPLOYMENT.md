# Hostinger VPS Deployment Guide

This guide walks you through deploying the Guardian Dashboard (Node.js + MongoDB) on a Hostinger VPS with **PM2** + **Nginx** + **SSL (Let's Encrypt)**.

---
## 1. Prerequisites
- Hostinger VPS (Ubuntu 20.04/22.04 assumed)
- Root or sudo user
- Domain (e.g. `assests.online`) with DNS access
- MongoDB Atlas account (recommended) OR local Mongo on VPS

---
## 2. SSH Into VPS
```bash
ssh root@YOUR_SERVER_IP
# OR with user
essh deploy@YOUR_SERVER_IP
```
Create a non-root deploy user (recommended):
```bash
adduser deploy
usermod -aG sudo deploy
su - deploy
```
Add your public key:
```bash
mkdir -p ~/.ssh && chmod 700 ~/.ssh
nano ~/.ssh/authorized_keys  # paste key
chmod 600 ~/.ssh/authorized_keys
```

---
## 3. Install System Packages
```bash
sudo apt update && sudo apt -y upgrade
sudo apt install -y build-essential git ufw curl unzip
```

---
## 4. Install Node.js (LTS)
```bash
# Using NodeSource (adjust VERSION= for newer LTS)
curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
sudo apt install -y nodejs
node -v
npm -v
```

(Optional) Install Yarn:
```bash
sudo npm i -g yarn
```

---
## 5. Install PM2
```bash
sudo npm i -g pm2
pm2 startup systemd
# Follow the printed command (e.g.)
sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u deploy --hp /home/deploy
```

---
## 6. Clone Repository
```bash
cd /var/www
sudo mkdir guardian && sudo chown $USER:$USER guardian
cd guardian
git clone https://github.com/guardiandentalbilling/DASHBOARD-GUARDIAN.git
cd DASHBOARD-GUARDIAN/GuardianDashBaordAI
npm install
```

If you ONLY want the backend on VPS and frontend stays on Netlify: you can serve static assets from Netlify. If you want BOTH served from VPS, keep the static files (the app already serves them).

---
## 7. Environment File
Copy the example and edit:
```bash
cp .env.example .env
nano .env
```
Fill in:
```
MONGO_URI=mongodb+srv://<USER>:<PASS>@<CLUSTER>.mongodb.net/employee_dashboard?retryWrites=true&w=majority
JWT_SECRET=<LONG_RANDOM_HEX>
NODE_ENV=production
PORT=5000
ALLOWED_ORIGINS=https://assests.online,https://www.assests.online
```
Generate secure secret:
```bash
openssl rand -hex 48
```

If using local MongoDB instead of Atlas:
```bash
sudo apt install -y mongodb
# or install 6.x from official MongoDB repo (recommended for production)
```

---
## 8. Start Application with PM2
From inside `GuardianDashBaordAI`:
```bash
pm2 start server.js --name guardian-dashboard
pm2 logs guardian-dashboard --lines 50
pm2 save
```
Check health:
```bash
curl http://127.0.0.1:5000/health
curl http://127.0.0.1:5000/api/health
```

---
## 9. Firewall (UFW)
```bash
sudo ufw allow OpenSSH
sudo ufw allow 80
sudo ufw allow 443
sudo ufw enable
sudo ufw status
```
(Port 5000 stays internal; Nginx will proxy.)

---
## 10. Install & Configure Nginx
```bash
sudo apt install -y nginx
sudo nano /etc/nginx/sites-available/guardian.conf
```
Example config (replace domain):
```
server {
    listen 80;
    server_name assests.online www.assests.online;

    # Redirect HTTP to HTTPS
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name assests.online www.assests.online;

    # SSL certs (populated after certbot)
    ssl_certificate /etc/letsencrypt/live/assests.online/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/assests.online/privkey.pem;

    # Security headers
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header Referrer-Policy strict-origin-when-cross-origin;

    # Proxy API & static
    location / {
        proxy_pass http://127.0.0.1:5000/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    client_max_body_size 20m;
}
```
Enable site:
```bash
sudo ln -s /etc/nginx/sites-available/guardian.conf /etc/nginx/sites-enabled/guardian.conf
sudo nginx -t
sudo systemctl reload nginx
```

---
## 11. SSL with Certbot
```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d assests.online -d www.assests.online --agree-tos -m you@example.com --redirect
```
Auto-renew check:
```bash
sudo systemctl status certbot.timer
sudo certbot renew --dry-run
```

---
## 12. Log Management
PM2 keeps app logs:
```bash
pm2 logs guardian-dashboard
pm2 flush  # clear logs if large
```
Nginx logs:
```
/var/log/nginx/access.log
/var/log/nginx/error.log
```
Rotate (logrotate already installed for Nginx). For PM2 you may add cron cleanup if needed.

---
## 13. Updating Deployment
```bash
cd /var/www/guardian/DASHBOARD-GUARDIAN
git pull origin main
cd GuardianDashBaordAI
npm install --production
pm2 restart guardian-dashboard
pm2 save
```

---
## 14. Optional: Separate Frontend & Backend
If you keep frontend on Netlify (recommended):
- Keep backend API at https://api.assests.online (create A record pointing to VPS IP)
- In `api-config.js` set PROD_API_ROOT to `https://api.assests.online/api`
- Use a second Nginx server block for `api.assests.online` only proxying to Node.

Example second server:
```
server {
    listen 80;
    server_name api.assests.online;
    return 301 https://$host$request_uri;
}
server {
    listen 443 ssl http2;
    server_name api.assests.online;
    ssl_certificate /etc/letsencrypt/live/api.assests.online/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.assests.online/privkey.pem;
    location / {
        proxy_pass http://127.0.0.1:5000/;
        proxy_set_header Host $host;
    }
}
```

---
## 15. Troubleshooting
| Issue | Fix |
|-------|-----|
| 502 Bad Gateway | Check `pm2 logs` – app probably crashed. |
| Stale code | Forgot `git pull` or `pm2 restart`. |
| CORS blocked | Ensure `ALLOWED_ORIGINS` includes your domain(s). |
| Mongo timeout | Check network rules / IP allowlist in Atlas. |
| SSL not issuing | DNS not propagated or rate limited. |
| Large upload fails | Increase `client_max_body_size` in Nginx & ensure body-parser limit. |

---
## 16. Security Hardening (Quick Wins)
- Disable root SSH or use key-only auth.
- Keep system updated: `sudo unattended-upgrades`.
- Fail2ban (optional): `sudo apt install fail2ban`.
- Limit MongoDB to Atlas; avoid self-host unless needed.
- Rotate `JWT_SECRET` if leaked; revoke tokens.

---
## 17. Environment Variable Recap
```
MONGO_URI=...
JWT_SECRET=...
NODE_ENV=production
PORT=5000
ALLOWED_ORIGINS=https://assests.online,https://www.assests.online,https://api.assests.online
API_RATE_LIMIT=100
GEMINI_API_KEY= (optional)
```

---
## 18. Verification Checklist
- [ ] DNS A record points to VPS
- [ ] Nginx running and responding
- [ ] SSL certificates valid
- [ ] /health returns JSON
- [ ] Login works (JWT issued)
- [ ] Admin dashboard loads data
- [ ] PM2 resurrects app after reboot (`sudo reboot` test)

---
Deployment complete. 🎉
