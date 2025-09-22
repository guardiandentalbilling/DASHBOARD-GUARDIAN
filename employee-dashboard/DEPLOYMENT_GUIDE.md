# 🚀 Employee Dashboard - Deployment Guide

## 📋 **Quick Start Deployment**

### **Prerequisites**
- Node.js 16+ and npm 8+
- MongoDB database (local or MongoDB Atlas)
- Git for version control

### **1. Prepare for Deployment**

#### Install Production Dependencies
```bash
npm install
```

#### Set Environment Variables
```bash
cp .env.production .env
# Edit .env with your production values
```

#### Install Additional Production Dependencies
```bash
npm install helmet express-rate-limit express-validator compression morgan winston
```

---

## 🌐 **Deployment Options**

### **Option A: Heroku (Recommended - Easiest)**

#### Step 1: Setup Heroku
```bash
# Install Heroku CLI
npm install -g heroku

# Login to Heroku
heroku login

# Create Heroku app
heroku create your-app-name
```

#### Step 2: Configure Environment Variables
```bash
# Set environment variables
heroku config:set NODE_ENV=production
heroku config:set JWT_SECRET=your_super_secure_jwt_secret_key
heroku config:set MONGO_URI=your_mongodb_atlas_connection_string
```

#### Step 3: Deploy
```bash
# Add Heroku remote
heroku git:remote -a your-app-name

# Deploy
git add .
git commit -m "Prepare for deployment"
git push heroku main
```

#### Step 4: Setup MongoDB Atlas
1. Create account at [MongoDB Atlas](https://cloud.mongodb.com)
2. Create a cluster
3. Get connection string
4. Add to Heroku config: `heroku config:set MONGO_URI=mongodb+srv://...`

---

### **Option B: Vercel (Good for Frontend + API)**

#### Step 1: Install Vercel CLI
```bash
npm install -g vercel
```

#### Step 2: Deploy
```bash
vercel

# Follow prompts to deploy
```

#### Step 3: Environment Variables
- Add environment variables in Vercel dashboard
- Configure MongoDB Atlas connection

---

### **Option C: DigitalOcean App Platform**

#### Step 1: Create Account
- Sign up at [DigitalOcean](https://digitalocean.com)
- Go to App Platform

#### Step 2: Connect Repository
- Connect your GitHub repository
- Configure build settings

#### Step 3: Environment Variables
- Add all required environment variables
- Configure database

---

### **Option D: VPS/Dedicated Server**

#### Step 1: Server Setup
```bash
# Connect to your server
ssh user@your-server-ip

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2 for process management
sudo npm install -g pm2
```

#### Step 2: Deploy Application
```bash
# Clone repository
git clone https://github.com/yourusername/employee-dashboard.git
cd employee-dashboard

# Install dependencies
npm install --production

# Set environment variables
cp .env.production .env
# Edit .env file with production values

# Start with PM2
pm2 start server.js --name "employee-dashboard"
pm2 startup
pm2 save
```

#### Step 3: Setup Nginx (Optional)
```nginx
server {
    listen 80;
    server_name your-domain.com;
    
    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

---

## 🔒 **Security Configuration for Production**

### **1. Update server.js with Production Middleware**

Add this to the beginning of your middleware section:

```javascript
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const compression = require('compression');

// Security middleware
app.use(helmet());

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// Compression
app.use(compression());
```

### **2. Environment-Specific Configuration**

```javascript
// Add to server.js
if (process.env.NODE_ENV === 'production') {
    // Production-specific middleware
    app.use(helmet());
    app.use(compression());
}
```

---

## 📊 **Database Setup**

### **MongoDB Atlas (Recommended)**

1. **Create Cluster**
   - Go to [MongoDB Atlas](https://cloud.mongodb.com)
   - Create free cluster
   - Choose region close to your users

2. **Security Setup**
   - Add database user
   - Configure IP whitelist (0.0.0.0/0 for full access or specific IPs)

3. **Get Connection String**
   ```
   mongodb+srv://username:password@cluster.mongodb.net/employee_dashboard?retryWrites=true&w=majority
   ```

4. **Initial Data**
   ```bash
   # Run database seeder
   npm run seed
   ```

---

## ✅ **Post-Deployment Checklist**

### **Immediate Testing**
- [ ] Admin page loads: `https://your-domain.com/admin.html`
- [ ] Employee dashboard loads: `https://your-domain.com/`
- [ ] All navigation links work
- [ ] API endpoints respond correctly
- [ ] Database connection is successful

### **Security Verification**
- [ ] HTTPS is enabled
- [ ] Environment variables are secure
- [ ] No sensitive data in client-side code
- [ ] Rate limiting is working
- [ ] CORS is properly configured

### **Performance Check**
- [ ] Page load times are acceptable
- [ ] Images are optimized
- [ ] Compression is enabled
- [ ] CDN is configured (if applicable)

---

## 🚨 **Common Issues & Solutions**

### **Problem: "Cannot GET /admin.html"**
**Solution:** Ensure static file serving is configured in server.js

### **Problem: Database connection failed**
**Solutions:**
1. Check MongoDB Atlas IP whitelist
2. Verify connection string format
3. Ensure username/password are correct

### **Problem: Environment variables not working**
**Solutions:**
1. Check .env file location
2. Verify variable names match exactly
3. Restart server after changes

### **Problem: CORS errors**
**Solution:** Configure CORS for your domain:
```javascript
app.use(cors({
    origin: ['https://your-domain.com', 'http://localhost:3000']
}));
```

---

## 📈 **Monitoring & Maintenance**

### **Health Checks**
Add health check endpoint:
```javascript
app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});
```

### **Logging**
Monitor logs for errors:
```bash
# Heroku
heroku logs --tail

# PM2
pm2 logs

# Check log files
tail -f logs/error.log
```

### **Backup Strategy**
- Regular database backups
- Code repository backups
- Environment variable documentation

---

## 📞 **Support**

If you encounter issues:
1. Check the logs first
2. Verify environment variables
3. Test database connectivity
4. Check server status

**Need help?** The deployment checklist in `DEPLOYMENT_CHECKLIST.md` has additional details.