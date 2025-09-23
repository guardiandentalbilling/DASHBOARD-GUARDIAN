# 🚀 Guardian Dental Dashboard - Production Deployment Guide

## Overview

This guide will help you deploy the Guardian Dental Dashboard system to production. The system is now production-ready with proper security, environment configuration, and deployment settings.

## 📋 Pre-Deployment Checklist

### ✅ System Requirements
- Node.js 16+ installed on your server
- MongoDB database (MongoDB Atlas recommended for production)
- Domain name configured (dashboard.guardiandentalbilling.com)
- SSL certificate for HTTPS
- Email account for notifications (optional)

### ✅ Required Environment Variables
Before deployment, you must configure these environment variables:

```bash
# REQUIRED: Change these for production
MONGO_URI=mongodb+srv://guardian_admin:SECURE_PASSWORD@cluster0.mongodb.net/guardian_dental_db
JWT_SECRET=REPLACE_WITH_SECURE_RANDOM_JWT_SECRET_MINIMUM_32_CHARACTERS_LONG
SESSION_SECRET=REPLACE_WITH_SECURE_SESSION_SECRET_KEY

# REQUIRED: Domain configuration
ALLOWED_ORIGINS=https://dashboard.guardiandentalbilling.com,https://www.dashboard.guardiandentalbilling.com
FRONTEND_URL=https://dashboard.guardiandentalbilling.com

# OPTIONAL: API keys for features
GEMINI_API_KEY=your_google_generative_ai_api_key
```

## 🏗️ Deployment Methods

### Method 1: VPS/Dedicated Server (Recommended)

#### Step 1: Server Setup
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 16+
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2 for process management
sudo npm install -g pm2

# Install Nginx for reverse proxy
sudo apt install nginx -y
```

#### Step 2: Deploy Application
```bash
# Clone repository
git clone https://github.com/guardiandentalbilling/DASHBOARD-GUARDIAN.git
cd DASHBOARD-GUARDIAN

# Install dependencies
npm install

# Configure environment
cp GuardianDashBaordAI/env.production.example GuardianDashBaordAI/.env
nano GuardianDashBaordAI/.env  # Edit with your values

# Start with PM2
cd GuardianDashBaordAI
pm2 start server.js --name "guardian-dashboard"
pm2 save
pm2 startup
```

#### Step 3: Configure Nginx
```nginx
# /etc/nginx/sites-available/guardian-dashboard
server {
    listen 80;
    server_name dashboard.guardiandentalbilling.com www.dashboard.guardiandentalbilling.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name dashboard.guardiandentalbilling.com www.dashboard.guardiandentalbilling.com;

    ssl_certificate /path/to/your/ssl/certificate.crt;
    ssl_certificate_key /path/to/your/ssl/private.key;

    # API proxy
    location /api/ {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Static files
    location / {
        root /path/to/DASHBOARD-GUARDIAN/GuardianDashBaordAI;
        try_files $uri $uri/ /index.html;
        index index.html;
    }
}
```

### Method 2: Platform as a Service (PaaS)

#### Railway Deployment
1. Connect your GitHub repository to Railway
2. Set environment variables in Railway dashboard
3. Deploy from the GuardianDashBaordAI directory
4. Configure custom domain

#### Heroku Deployment
1. Create Heroku app
2. Set buildpack: `heroku/nodejs`
3. Configure environment variables
4. Deploy from Git

#### DigitalOcean App Platform
1. Create new app from GitHub
2. Configure build settings
3. Set environment variables
4. Deploy

## 🔧 Environment Configuration

### Production Environment Variables (.env)
```bash
# Environment
NODE_ENV=production
PORT=5000

# Database (REQUIRED)
MONGO_URI=mongodb+srv://guardian_admin:YOUR_PASSWORD@cluster0.mongodb.net/guardian_dental_db?retryWrites=true&w=majority
MONGO_SERVER_SELECTION_TIMEOUT_MS=10000
MONGO_CONNECT_TIMEOUT_MS=10000

# Security (REQUIRED - Generate secure random strings)
JWT_SECRET=your_secure_jwt_secret_minimum_32_characters_long
SESSION_SECRET=your_secure_session_secret_key
BCRYPT_ROUNDS=12

# Domain Configuration (REQUIRED)
FRONTEND_URL=https://dashboard.guardiandentalbilling.com
ALLOWED_ORIGINS=https://dashboard.guardiandentalbilling.com,https://www.dashboard.guardiandentalbilling.com

# File Upload
MAX_FILE_SIZE=10485760
UPLOAD_PATH=/uploads

# Rate Limiting
API_RATE_LIMIT=100

# Logging
LOG_LEVEL=info

# Optional: AI Features
GEMINI_API_KEY=your_google_generative_ai_api_key
```

### Security Best Practices

1. **JWT Secret**: Use a cryptographically secure random string (32+ characters)
   ```bash
   node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
   ```

2. **Database Security**: 
   - Use MongoDB Atlas with IP whitelisting
   - Create dedicated database user with minimal permissions
   - Enable database authentication

3. **HTTPS**: Always use SSL/TLS in production
   - Use Let's Encrypt for free SSL certificates
   - Configure secure headers in Nginx

4. **Environment Variables**: Never commit secrets to Git
   - Use platform-specific environment variable systems
   - Rotate secrets regularly

## 🗄️ Database Setup

### MongoDB Atlas (Recommended)

1. **Create MongoDB Atlas Account**
   - Go to https://cloud.mongodb.com
   - Create account and new project

2. **Create Cluster**
   - Choose shared cluster (free tier available)
   - Select region closest to your server
   - Create cluster

3. **Configure Security**
   ```
   Database Access → Add Database User:
   - Username: guardian_admin
   - Password: [Generate secure password]
   - Roles: Read and write to any database
   
   Network Access → Add IP Address:
   - Add your server's IP address
   - Or add 0.0.0.0/0 for universal access (less secure)
   ```

4. **Get Connection String**
   - Go to Clusters → Connect → Connect your application
   - Copy connection string and add to your .env file

### Local MongoDB Setup (Development Only)
```bash
# Install MongoDB
sudo apt install mongodb -y
sudo systemctl start mongodb
sudo systemctl enable mongodb

# Create database and user
mongo
> use guardian_dental_db
> db.createUser({
  user: "guardian_admin",
  pwd: "secure_password",
  roles: ["readWrite"]
})
```

## 🚀 First Time Setup

1. **Clone and Install**
   ```bash
   git clone https://github.com/guardiandentalbilling/DASHBOARD-GUARDIAN.git
   cd DASHBOARD-GUARDIAN
   npm install
   ```

2. **Configure Environment**
   ```bash
   cp GuardianDashBaordAI/env.production.example GuardianDashBaordAI/.env
   # Edit .env with your production values
   ```

3. **Seed Database (Optional)**
   ```bash
   cd GuardianDashBaordAI
   npm run seed
   ```

4. **Test Configuration**
   ```bash
   npm run health
   # Should return: {"status":"OK","mongoConnected":true}
   ```

5. **Start Production Server**
   ```bash
   npm start
   ```

## 🔍 Health Monitoring

### Health Check Endpoint
```bash
curl https://api.dashboard.guardiandentalbilling.com/api/health
```

Expected Response:
```json
{
  "status": "OK",
  "message": "Server is running",
  "port": 5000,
  "mode": "production",
  "mongoConnected": true
}
```

### Monitoring Setup
- Set up uptime monitoring (Pingdom, UptimeRobot)
- Configure log aggregation (LogDNA, Papertrail)
- Set up error tracking (Sentry)
- Monitor database performance (MongoDB Atlas monitoring)

## 🔒 Security Checklist

- [ ] Strong JWT and session secrets configured
- [ ] HTTPS enabled with valid SSL certificate
- [ ] Database access restricted by IP/VPN
- [ ] Rate limiting configured (100 req/15min in production)
- [ ] CORS properly configured for your domain only
- [ ] No hardcoded secrets in code
- [ ] Regular security updates scheduled
- [ ] Backup strategy implemented
- [ ] Error logging without exposing sensitive data

## 🚨 Troubleshooting

### Common Issues

1. **MongoDB Connection Timeout**
   ```bash
   # Increase timeout values in .env
   MONGO_SERVER_SELECTION_TIMEOUT_MS=15000
   MONGO_CONNECT_TIMEOUT_MS=15000
   ```

2. **CORS Errors**
   ```bash
   # Check ALLOWED_ORIGINS includes your exact domain
   ALLOWED_ORIGINS=https://dashboard.guardiandentalbilling.com
   ```

3. **403 Forbidden Errors**
   - Check file permissions on server
   - Verify Nginx configuration
   - Check firewall settings

4. **API Not Working**
   ```bash
   # Check if server is running
   pm2 status
   
   # Check logs
   pm2 logs guardian-dashboard
   
   # Restart if needed
   pm2 restart guardian-dashboard
   ```

### Log Locations
- Application logs: `pm2 logs guardian-dashboard`
- Nginx logs: `/var/log/nginx/access.log` and `/var/log/nginx/error.log`
- System logs: `/var/log/syslog`

## 📞 Support

For deployment assistance:
- Check GitHub issues: https://github.com/guardiandentalbilling/DASHBOARD-GUARDIAN/issues
- Review application logs for specific error messages
- Ensure all environment variables are properly configured

---

**Production Deployment Status: ✅ READY**

This system is production-ready with enterprise-grade security, monitoring, and scalability features.