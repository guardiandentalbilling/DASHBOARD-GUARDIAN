# 🚀 Hostinger Deployment Guide - ZIP Method

Perfect! Hostinger supports Node.js, so you can easily deploy your Employee Dashboard using the ZIP upload method.

---

## 📦 Step-by-Step Hostinger Deployment

### Step 1: Prepare Your Files (2 minutes)

1. **Create ZIP file**:
   - Right-click your `Employee-dashbaoard` folder
   - Select "Send to" → "Compressed (zipped) folder"
   - Rename to: `employee-dashboard.zip`

### Step 2: Login to Hostinger (1 minute)

1. Go to [hostinger.com](https://hostinger.com)
2. Login to your account
3. Click on your domain in the dashboard

### Step 3: Access File Manager (2 minutes)

1. In Hostinger control panel, find **"File Manager"**
2. Click to open File Manager
3. Navigate to **"public_html"** folder (this is your website root)

### Step 4: Upload and Extract (3 minutes)

1. **Upload ZIP**:
   - Click "Upload Files" button
   - Select your `employee-dashboard.zip`
   - Wait for upload to complete

2. **Extract ZIP**:
   - Right-click on `employee-dashboard.zip`
   - Select "Extract"
   - Choose "Extract Here"

3. **Move Files**:
   - Open the extracted `Employee-dashbaoard` folder
   - Select ALL files inside (Ctrl+A)
   - Cut them (Ctrl+X)
   - Go back to `public_html` folder
   - Paste files (Ctrl+V)
   - Delete the empty `Employee-dashbaoard` folder and ZIP file

### Step 5: Set Up Node.js App (5 minutes)

1. **In Hostinger control panel, find "Node.js"**
2. Click "Create Application"
3. Configure:
   ```
   Node.js Version: 18.x or latest
   Application Root: public_html
   Application URL: your-domain.com
   Startup File: server.js
   ```
4. Click "Create"

### Step 6: Install Dependencies (3 minutes)

1. **In Node.js section, click "Open Terminal"** (or use SSH Terminal)
2. Run command:
   ```bash
   npm install
   ```
3. Wait for installation to complete

### Step 7: Set Environment Variables (3 minutes)

1. **In Node.js app settings, find "Environment Variables"**
2. Add these variables:
   ```
   NODE_ENV = production
   PORT = 3000
   MONGO_URI = mongodb+srv://username:password@cluster.mongodb.net/employee_dashboard
   JWT_SECRET = your_secret_key_change_this_123456
   ```
3. Click "Save"

### Step 8: Set Up Database (5 minutes)

**You need MongoDB Atlas (FREE):**

1. Go to [mongodb.com/atlas](https://mongodb.com/atlas)
2. Create free account
3. Create new cluster (choose free tier)
4. Create database user:
   - Username: `employee_admin`
   - Password: `SecurePassword123`
5. Get connection string:
   - Click "Connect" → "Connect your application"
   - Copy the connection string
   - Replace `<password>` with your actual password
6. **Update environment variable**:
   ```
   MONGO_URI = mongodb+srv://employee_admin:SecurePassword123@cluster0.xxxxx.mongodb.net/employee_dashboard
   ```

### Step 9: Start Application (2 minutes)

1. **In Hostinger Node.js panel, click "Start Application"**
2. Status should show "Running"
3. If there are errors, check the logs

### Step 10: Test Your Website (2 minutes)

1. **Visit your domain**: `https://yourdomain.com`
2. **Test admin login**: `https://yourdomain.com/admin.html`
   - Email: `admin@test.com`
   - Password: `admin123`
3. **Test employee login**: `https://yourdomain.com/login.html`
   - Email: `employee@test.com`
   - Password: `emp123`

---

## 🔧 Hostinger-Specific Tips

### If Node.js Option is Missing:
- You need **Business** or **Cloud** hosting plan
- Shared hosting doesn't support Node.js
- Upgrade your plan or use the free Render method

### File Structure Should Look Like:
```
public_html/
├── server.js
├── package.json
├── index.html
├── admin.html
├── login.html
├── pages/
├── js/
├── backend/
└── ... (all your project files)
```

### Common Hostinger Ports:
- Use port `3000` or `8080` in environment variables
- Hostinger automatically handles external port mapping

---

## 🆘 Troubleshooting

### "Application Failed to Start"
1. **Check logs** in Node.js panel
2. **Verify environment variables** are set correctly
3. **Ensure all files** are in `public_html` root (not in subfolder)

### "Database Connection Failed"
1. **Check MongoDB Atlas** connection string
2. **Verify IP whitelist** in Atlas (allow `0.0.0.0/0` for all IPs)
3. **Test connection string** format

### "Files Not Found"
1. **Ensure files are in `public_html`** not in a subfolder
2. **Check file permissions** (755 for folders, 644 for files)
3. **Verify startup file** is set to `server.js`

### "SSL Certificate Issues"
1. **Enable SSL** in Hostinger control panel
2. **Force HTTPS redirect** in hosting settings
3. **Wait 15-30 minutes** for SSL to activate

---

## 🎯 Quick Checklist

**Before starting:**
- [ ] Hostinger Business/Cloud hosting plan
- [ ] Domain connected to Hostinger
- [ ] ZIP file of your project ready

**After deployment:**
- [ ] Files uploaded to `public_html`
- [ ] Node.js application created and running
- [ ] Environment variables configured
- [ ] MongoDB Atlas database set up
- [ ] Website accessible at your domain
- [ ] Admin and employee login working

---

## 🚀 Your Final URLs

- **Main Website**: `https://yourdomain.com`
- **Admin Panel**: `https://yourdomain.com/admin.html`
- **Employee Portal**: `https://yourdomain.com/login.html`

**Default Login Credentials:**
- **Admin**: `admin@test.com` / `admin123`
- **Employee**: `employee@test.com` / `emp123`

---

## 📞 Need Help?

**Common Hostinger support contacts:**
- Live chat available 24/7
- Knowledge base: [support.hostinger.com](https://support.hostinger.com)

**If you get stuck on any step, tell me:**
1. What error message you see
2. Which step you're on
3. Screenshot of the issue (if possible)

---

**🎉 Total time: About 25 minutes and your Employee Dashboard will be live!**

**Next step**: Tell me your domain name and I can help you test everything once it's deployed!