# 🚀 Complete Deployment Guide for Your Employee Dashboard

## 📋 Table of Contents
1. [Prerequisites](#prerequisites)
2. [Option 1: Free Deployment (Render)](#option-1-free-deployment-render)
3. [Option 2: Paid Cloud Server (DigitalOcean)](#option-2-paid-cloud-server-digitalocean)
4. [Option 3: Shared Hosting](#option-3-shared-hosting)
5. [Database Setup](#database-setup)
6. [Domain Configuration](#domain-configuration)
7. [SSL Certificate Setup](#ssl-certificate-setup)
8. [Troubleshooting](#troubleshooting)

---

## Prerequisites ✅

Before deploying, ensure you have:
- ✅ Your project folder ready (Employee-dashbaoard)
- ✅ A GitHub account (for code hosting)
- ✅ A domain name (optional but recommended)
- ✅ Basic understanding of copying/pasting commands

---

## Option 1: Free Deployment (Render) 🆓

**Best for:** Beginners, testing, small businesses
**Cost:** Free (with some limitations)
**Time:** 30 minutes

### Step 1: Upload Code to GitHub

1. **Create GitHub Account**: Go to [github.com](https://github.com) and sign up
2. **Create New Repository**:
   - Click "New" button
   - Name: `employee-dashboard`
   - Set to "Public"
   - Click "Create repository"

3. **Upload Your Code**:
   - Click "uploading an existing file"
   - Drag your entire `Employee-dashbaoard` folder
   - Scroll down and click "Commit changes"

### Step 2: Deploy on Render

1. **Create Render Account**: Go to [render.com](https://render.com) and sign up
2. **Connect GitHub**: Link your GitHub account
3. **Create Web Service**:
   - Click "New +"
   - Select "Web Service"
   - Choose your `employee-dashboard` repository
   - Configure settings:
     ```
     Name: employee-dashboard
     Environment: Node
     Build Command: npm install
     Start Command: npm start
     ```
4. **Click "Deploy Web Service"**

### Step 3: Configure Environment Variables

In Render dashboard:
- Go to "Environment" tab
- Add these variables:
  ```
  NODE_ENV=production
  PORT=5000
  MONGO_URI=your_mongodb_connection_string
  JWT_SECRET=your_secret_key_here
  ```

---

## Option 2: Paid Cloud Server (DigitalOcean) 💰

**Best for:** Production use, full control
**Cost:** $5-20/month
**Time:** 1-2 hours

### Step 1: Create VPS Server

1. **Sign up at DigitalOcean**: [digitalocean.com](https://digitalocean.com)
2. **Create Droplet**:
   - Choose Ubuntu 22.04 LTS
   - Basic plan ($5/month)
   - Add your SSH key or use password

### Step 2: Connect to Server

**Windows (using PowerShell):**
```powershell
ssh root@your_server_ip
```

**First time login:**
- Enter password when prompted
- Server will ask you to change password

### Step 3: Install Node.js and Dependencies

```bash
# Update system
apt update && apt upgrade -y

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
apt-get install -y nodejs

# Install PM2 (process manager)
npm install -g pm2

# Install Nginx (web server)
apt install nginx -y

# Install MongoDB
wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/6.0 multiverse" | tee /etc/apt/sources.list.d/mongodb-org-6.0.list
apt-get update
apt-get install -y mongodb-org
systemctl start mongod
systemctl enable mongod
```

### Step 4: Upload Your Code

**Method 1: Using Git (Recommended)**
```bash
# Install git
apt install git -y

# Clone your repository
git clone https://github.com/yourusername/employee-dashboard.git
cd employee-dashboard

# Install dependencies
npm install
```

**Method 2: Upload via FileZilla**
1. Download FileZilla: [filezilla-project.org](https://filezilla-project.org)
2. Connect using SFTP:
   - Host: your_server_ip
   - Username: root
   - Password: your_password
   - Port: 22
3. Upload your project folder to `/var/www/`

### Step 5: Configure and Start Application

```bash
# Navigate to project directory
cd /var/www/employee-dashboard

# Create environment file
nano .env
```

Add this content to `.env`:
```
NODE_ENV=production
PORT=5000
MONGO_URI=mongodb://localhost:27017/employee_dashboard
JWT_SECRET=your_super_secret_key_change_this
```

```bash
# Start application with PM2
pm2 start server.js --name "employee-dashboard"
pm2 startup
pm2 save
```

### Step 6: Configure Nginx

```bash
# Create Nginx configuration
nano /etc/nginx/sites-available/employee-dashboard
```

Add this content:
```nginx
server {
    listen 80;
    server_name your_domain.com www.your_domain.com;

    location / {
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
}
```

```bash
# Enable site
ln -s /etc/nginx/sites-available/employee-dashboard /etc/nginx/sites-enabled/
nginx -t
systemctl reload nginx
```

---

## Option 3: Shared Hosting 🏠

**Best for:** Budget-conscious, simple setup
**Cost:** $3-10/month
**Time:** 15-30 minutes

### Compatible Hosting Providers:
- A2 Hosting (Node.js support)
- HostGator (Node.js plans)
- Bluehost (VPS plans)
- Namecheap (Shared hosting with Node.js)

### Steps:
1. **Purchase hosting plan** with Node.js support
2. **Upload files** via File Manager or FTP
3. **Install dependencies** through hosting control panel
4. **Configure environment variables** in hosting settings
5. **Start application** using hosting control panel

---

## Database Setup 🗄️

### Option A: MongoDB Atlas (Cloud - Recommended)

1. **Create Account**: Go to [mongodb.com/atlas](https://mongodb.com/atlas)
2. **Create Cluster**: Choose free tier
3. **Get Connection String**:
   - Click "Connect"
   - Choose "Connect your application"
   - Copy connection string
4. **Update Environment Variables**:
   ```
   MONGO_URI=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/employee_dashboard
   ```

### Option B: Local MongoDB (VPS only)

Already installed in DigitalOcean steps above. Use:
```
MONGO_URI=mongodb://localhost:27017/employee_dashboard
```

---

## Domain Configuration 🌐

### Step 1: Point Domain to Server

**For Cloud Server (DigitalOcean):**
1. Go to your domain registrar (GoDaddy, Namecheap, etc.)
2. Update DNS records:
   ```
   Type: A
   Name: @
   Value: your_server_ip
   TTL: 300
   
   Type: A
   Name: www
   Value: your_server_ip
   TTL: 300
   ```

**For Render/Hosting:**
1. Follow provider's custom domain instructions
2. Usually involves adding CNAME records

### Step 2: Wait for Propagation
- DNS changes take 4-48 hours to propagate
- Check status: [whatsmydns.net](https://whatsmydns.net)

---

## SSL Certificate Setup 🔒

### For VPS (DigitalOcean):

```bash
# Install Certbot
apt install snapd -y
snap install core; snap refresh core
snap install --classic certbot

# Create certificate
certbot --nginx -d your_domain.com -d www.your_domain.com
```

### For Hosting/Render:
- Most providers offer free SSL certificates
- Enable in control panel or automatically provided

---

## Final Configuration ⚙️

### Update Application Settings

Edit your project's configuration for production:

1. **Update API URLs** in frontend files:
   ```javascript
   // Change from localhost to your domain
   const API_BASE = 'https://your_domain.com/api';
   ```

2. **Set Production Environment**:
   ```
   NODE_ENV=production
   ```

3. **Restart Application**:
   ```bash
   pm2 restart employee-dashboard
   ```

---

## Testing Your Deployment ✅

1. **Visit your website**: `https://your_domain.com`
2. **Test login**: Use `admin@test.com` / `admin123`
3. **Test features**:
   - Employee management
   - Leave requests
   - Admin dashboard
   - All sidebar functions

---

## Troubleshooting 🔧

### Common Issues:

**"Site can't be reached"**
- Check if server is running: `pm2 status`
- Check Nginx: `systemctl status nginx`
- Verify DNS settings

**"Database connection failed"**
- Check MongoDB status: `systemctl status mongod`
- Verify MONGO_URI in environment variables
- Check MongoDB Atlas IP whitelist

**"500 Internal Server Error"**
- Check application logs: `pm2 logs employee-dashboard`
- Verify all environment variables are set
- Check file permissions

**"SSL Certificate Error"**
- Re-run certbot: `certbot renew`
- Check domain propagation
- Verify Nginx configuration

### Getting Help:
- Check logs: `pm2 logs`
- Restart services: `pm2 restart all`
- Contact your hosting provider's support

---

## 🎉 Congratulations!

Your Employee Dashboard is now live on the internet! 

### Next Steps:
1. **Test all functionality thoroughly**
2. **Set up regular backups**
3. **Monitor server performance**
4. **Update DNS records if needed**
5. **Share the URL with your team**

### Access URLs:
- **Main Site**: `https://your_domain.com`
- **Admin Login**: `https://your_domain.com/admin.html`
- **Employee Login**: `https://your_domain.com/login.html`

---

**Need help?** Keep this guide handy and don't hesitate to ask for assistance with any step!