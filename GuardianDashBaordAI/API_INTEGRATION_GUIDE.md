# 🔧 API Integration Guide - Where to Update Your API Endpoints

## 📍 **STEP 1: Update the Central API Configuration**

**File: `js/api-config.js`** (I've created this for you)
- This is your **SINGLE SOURCE OF TRUTH** for all API endpoints
- Update `API_CONFIG.BASE_URL` with your actual API URL
- Add your specific endpoints for each feature

```javascript
// 🎯 UPDATE THIS LINE WITH YOUR API URL
const API_CONFIG = {
    BASE_URL: 'https://your-actual-api-domain.com/api', // ← CHANGE THIS
    // ... rest of configuration
};
```

---

## 📋 **STEP 2: Add API Configuration to Each Page**

You need to add the API configuration script to these specific pages:

### **🔴 CRITICAL: Pages That Need API Integration**

#### **1. Guardian AI** (`pages/guardian-ai.html`)
**Current Status:** ❌ Uses Google Gemini API only
**Needs:** Your backend API integration

**Add this script tag before closing `</body>`:**
```html
<script src="../js/api-config.js"></script>
<script>
// Replace the existing API call around line 224
async function sendGuardianAIMessage(message, employeeId) {
    try {
        const response = await GuardianAI.startSession(employeeId, {
            message: message,
            timestamp: new Date().toISOString()
        });
        
        return response.reply;
    } catch (error) {
        console.error('Guardian AI API Error:', error);
        throw error;
    }
}
</script>
```

#### **2. Eligibility Verification** (`pages/eligibility.html`)
**Current Status:** ❌ No API integration
**Needs:** Eligibility verification API

**Add this script before closing `</body>`:**
```html
<script src="../js/api-config.js"></script>
<script>
// Add eligibility verification function
async function verifyPatientEligibility(patientData) {
    try {
        const result = await EligibilityVerification.verifyEligibility({
            patientId: patientData.patientId,
            insuranceInfo: patientData.insurance,
            dentalCodes: patientData.procedures,
            employeeId: localStorage.getItem('employeeId')
        });
        
        return result;
    } catch (error) {
        console.error('Eligibility verification failed:', error);
        throw error;
    }
}
</script>
```

#### **3. Claims Follow-up** (`pages/claims-follow-up.html`)
**Current Status:** ❌ Uses Gemini API only
**Needs:** Claims management API

**Add this script before closing `</body>`:**
```html
<script src="../js/api-config.js"></script>
<script>
// Replace existing claims functions
async function loadClaims() {
    try {
        const claims = await ClaimsFollowUp.getAllClaims();
        displayClaims(claims);
    } catch (error) {
        console.error('Failed to load claims:', error);
    }
}

async function createNewClaim(claimData) {
    try {
        const result = await ClaimsFollowUp.createClaim({
            ...claimData,
            employeeId: localStorage.getItem('employeeId'),
            createdAt: new Date().toISOString()
        });
        
        return result;
    } catch (error) {
        console.error('Failed to create claim:', error);
        throw error;
    }
}
</script>
```

#### **4. Guardian TTS** (`pages/guardian-tts.html`)
**Current Status:** ❌ No backend API integration
**Needs:** TTS usage tracking and audio storage

**Add this script before closing `</body>`:**
```html
<script src="../js/api-config.js"></script>
<script>
// Add TTS API integration
async function synthesizeAndTrack(text, voiceSettings) {
    try {
        // Call your TTS API
        const result = await GuardianTTS.synthesizeText(text, {
            voice: voiceSettings.voice,
            speed: voiceSettings.speed,
            pitch: voiceSettings.pitch,
            employeeId: localStorage.getItem('employeeId')
        });
        
        return result.audioUrl;
    } catch (error) {
        console.error('TTS synthesis failed:', error);
        throw error;
    }
}
</script>
```

#### **5. Speech Practice** (`pages/speech-practice.html`)
**Current Status:** ❌ No API integration
**Needs:** Session tracking and progress monitoring

**Add this script before closing `</body>`:**
```html
<script src="../js/api-config.js"></script>
<script>
// Add speech practice API integration
async function startSpeechPracticeSession(exerciseId) {
    try {
        const session = await SpeechPractice.startPractice(
            localStorage.getItem('employeeId'),
            exerciseId
        );
        
        return session;
    } catch (error) {
        console.error('Failed to start speech practice:', error);
        throw error;
    }
}

async function submitRecording(sessionId, audioBlob) {
    try {
        // Convert audio blob to base64 or upload
        const audioData = await blobToBase64(audioBlob);
        
        const feedback = await SpeechPractice.submitRecording(sessionId, audioData);
        return feedback;
    } catch (error) {
        console.error('Failed to submit recording:', error);
        throw error;
    }
}
</script>
```

#### **6. Phonetic Pronunciation** (`pages/phonetic-pronunciation.html`)
**Current Status:** ❌ No API integration
**Needs:** Exercise tracking and pronunciation analysis

#### **7. AR Comments** (`pages/ar-comment.html`)
**Current Status:** ❌ No API integration
**Needs:** Comment management API

#### **8. Feedback System** (`pages/feedback.html`)
**Current Status:** ❌ No API integration
**Needs:** Feedback submission and tracking

---

## 📡 **STEP 3: Update Admin Pages API URLs**

### **Fix API Base URL in Admin Pages**

**Current Issue:** Admin pages use `http://localhost:3000/api` but server runs on port 5000

**Files to Update:**

1. **`pages/admin-dashboard.html`** - Line 163
2. **`pages/admin-attendance-reports.html`** - Line 155
3. **`pages/admin-claims-reports.html`** - Line 206
4. **`pages/admin-ar-comments.html`** - Line 261
5. **`pages/admin-training-reports.html`** - Line 284
6. **`pages/admin-feedback-reports.html`** - Line 238
7. **`pages/admin-comprehensive-reports.html`** - Line 312

**Change this line in each file:**
```javascript
// FROM:
const API_BASE_URL = 'http://localhost:3000/api';

// TO:
const API_BASE_URL = 'http://localhost:5000/api';
```

---

## 🛠 **STEP 4: Create Missing Backend API Routes**

You need to create these routes in your backend:

### **Add to `backend/routes/`**

1. **`guardianAiRoutes.js`** - Guardian AI session management
2. **`speechPracticeRoutes.js`** - Speech practice tracking
3. **`ttsRoutes.js`** - Text-to-speech usage tracking
4. **`phoneticRoutes.js`** - Phonetic exercise management
5. **`eligibilityRoutes.js`** - Eligibility verification
6. **`claimsRoutes.js`** - Claims follow-up management
7. **`arCommentsRoutes.js`** - AR comments system
8. **`feedbackRoutes.js`** - Feedback and complaints

### **Add to `server.js`**
```javascript
// Add these API routes
app.use('/api/guardian-ai', require('./backend/routes/guardianAiRoutes'));
app.use('/api/speech-practice', require('./backend/routes/speechPracticeRoutes'));
app.use('/api/tts', require('./backend/routes/ttsRoutes'));
app.use('/api/phonetic', require('./backend/routes/phoneticRoutes'));
app.use('/api/eligibility', require('./backend/routes/eligibilityRoutes'));
app.use('/api/claims', require('./backend/routes/claimsRoutes'));
app.use('/api/ar-comments', require('./backend/routes/arCommentsRoutes'));
app.use('/api/feedback', require('./backend/routes/feedbackRoutes'));
```

---

## 🎯 **QUICK ACTION PLAN**

### **IMMEDIATE (15 minutes):**
1. **Fix admin page API URLs** - Change port from 3000 to 5000
2. **Add API config script** to each feature page
3. **Test existing employee/attendance/loan APIs**

### **SHORT TERM (1-2 days):**
1. **Create missing backend routes** for Guardian AI, TTS, etc.
2. **Update frontend pages** to use new API endpoints
3. **Test all feature integrations**

### **MEDIUM TERM (1 week):**
1. **Add authentication** to protect API routes
2. **Implement data persistence** for all features
3. **Add comprehensive error handling**

---

## 🔧 **Want Me to Help?**

I can help you:
1. **Fix the admin page API URLs immediately**
2. **Create the missing backend routes**
3. **Update specific pages with API integration**
4. **Test the API connections**

**Which would you like me to start with?**

---

## 📝 **Summary**

**Your API integration points:**

1. **Central Config:** `js/api-config.js` ← Main configuration file
2. **Admin Pages:** 7 files need API URL fix (port 3000 → 5000)
3. **Feature Pages:** 8 pages need API integration scripts
4. **Backend Routes:** 8 new route files needed
5. **Server Config:** Add routes to server.js

**Current Status:** 40% API integrated (employee/attendance/loans working)
**Target:** 100% API integrated across all features

Let me know which part you'd like me to implement first!