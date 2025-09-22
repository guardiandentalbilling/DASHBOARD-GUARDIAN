# 🚀 Deploy to guardiandentalbilling.com - Complete Guide

Your Employee Dashboard will be live at **guardiandentalbilling.com** in about 25 minutes!

---

## 📦 Step-by-Step Deployment

### Step 1: Create ZIP File (2 minutes)

1. **Right-click** your `Employee-dashbaoard` folder
2. **Select** "Send to" → "Compressed (zipped) folder"
3. **Rename** to: `employee-dashboard.zip`

### Step 2: Access Hostinger (2 minutes)

1. Go to [hostinger.com](https://hostinger.com) and login
2. Find your domain: **guardiandentalbilling.com**
3. Click on it to access the control panel

### Step 3: Upload Files (5 minutes)

1. **Click "File Manager"** in control panel
2. **Navigate to "public_html"** folder
3. **Upload your ZIP**:
   - Click "Upload Files"
   - Select `employee-dashboard.zip`
   - Wait for upload
4. **Extract files**:
   - Right-click ZIP file → "Extract"
   - Open the extracted folder
   - **Select ALL files** (Ctrl+A)
   - **Cut** (Ctrl+X)
   - **Go back** to `public_html`
   - **Paste** (Ctrl+V)
   - **Delete** empty folder and ZIP

### Step 4: Set Up Node.js (5 minutes)

1. **In Hostinger control panel, find "Node.js"**
2. **Click "Create Application"**
3. **Configure**:
   ```
   Node.js Version: 18.x (latest)
   Application Root: public_html
   Application URL: guardiandentalbilling.com
   Startup File: server.js
   ```
4. **Click "Create"**

### Step 5: Install Dependencies (3 minutes)

1. **In Node.js panel, click "Open Terminal"**
2. **Run command**:
   ```bash
   npm install
   ```
3. **Wait** for installation to complete

### Step 6: Set Up Database (5 minutes)

**Create FREE MongoDB Atlas:**

1. Go to [mongodb.com/atlas](https://mongodb.com/atlas)
2. **Sign up** with email
3. **Create cluster** (choose FREE tier)
4. **Create database user**:
   - Username: `guardian_admin`
   - Password: `GuardianDental2024!`
5. **Get connection string**:
   - Click "Connect" → "Connect your application"
   - Copy the string (looks like):
   ```
   mongodb+srv://guardian_admin:GuardianDental2024!@cluster0.xxxxx.mongodb.net/guardian_dental_db
   ```

### Step 7: Configure Environment (3 minutes)

**In Hostinger Node.js settings, add Environment Variables:**

```
NODE_ENV = production
PORT = 3000
MONGO_URI = mongodb+srv://guardian_admin:GuardianDental2024!@cluster0.xxxxx.mongodb.net/guardian_dental_db
JWT_SECRET = GuardianDentalSecure2024_ChangeThis!
```

### Step 8: Start Application (2 minutes)

1. **In Node.js panel, click "Start Application"**
2. **Status should show "Running"**
3. **If errors appear, check logs**

---

## 🎉 Your Live Website URLs

### **Main Access Points:**
- **Website**: https://guardiandentalbilling.com
- **Admin Panel**: https://guardiandentalbilling.com/admin.html
- **Employee Login**: https://guardiandentalbilling.com/login.html

### **Login Credentials:**
- **Admin Access**:
  - Email: `admin@test.com`
  - Password: `admin123`
- **Employee Access**:
  - Email: `employee@test.com`
  - Password: `emp123`

---

## ✅ Test Your Deployment

### **1. Website Test:**
Visit: https://guardiandentalbilling.com
- Should show your dashboard homepage
- Sidebar should work
- All pages should load

### **2. Admin Test:**
Go to: https://guardiandentalbilling.com/admin.html
- Login with admin credentials
- Test all sidebar functions:
  - Employee Management ✅
  - Leave Requests ✅
  - Feedback Reports ✅
  - Revenue Reports ✅

### **3. Employee Test:**
Go to: https://guardiandentalbilling.com/login.html
- Login with employee credentials
- Test features:
  - Submit leave requests ✅
  - View tasks ✅
  - Submit feedback ✅

---

## 🔧 Quick Troubleshooting

### **If website doesn't load:**
1. Check if Node.js app is "Running" in Hostinger
2. Verify all files are in `public_html` (not subfolder)
3. Check domain DNS is pointing to Hostinger

### **If login doesn't work:**
1. Check MongoDB Atlas connection string
2. Verify environment variables are set
3. Check application logs in Hostinger

### **If features don't work:**
1. Open browser console (F12)
2. Look for JavaScript errors
3. Check if all files uploaded correctly

---

## 📞 What's Next?

### **After successful deployment:**

1. **Change default passwords** in admin panel
2. **Add your real employees** to the system
3. **Test all workflows**:
   - Employee leave requests
   - Admin approvals
   - Revenue tracking
   - Expense management

### **For your team:**
- **Admin URL**: https://guardiandentalbilling.com/admin.html
- **Employee URL**: https://guardiandentalbilling.com/login.html
- **Company website**: https://guardiandentalbilling.com

---

## 🎯 Need Help During Deployment?

**Tell me:**
1. **Which step** you're on
2. **Any error messages** you see
3. **Screenshots** if helpful

**I'll help you troubleshoot immediately!**

---

## 🚀 Guardian Dental Billing Dashboard Features

Your employees will have access to:
- ✅ **Leave Request System**
- ✅ **Task Management**
- ✅ **Expense Reporting**
- ✅ **Feedback Submission**
- ✅ **Profile Management**

Your admins can manage:
- ✅ **Employee Records**
- ✅ **Leave Approvals**
- ✅ **Revenue Tracking**
- ✅ **Comprehensive Reports**
- ✅ **Client Management**

---

**🎉 Your Guardian Dental Billing Employee Dashboard will be live at guardiandentalbilling.com in just a few minutes!**

**Start with Step 1 and let me know if you need help with any step!** 🚀