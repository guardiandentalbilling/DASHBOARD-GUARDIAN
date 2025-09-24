// 🌐 Centralized API Configuration
// This file automatically loads API settings from localStorage (set in Settings page)

// ======================
// DYNAMIC API CONFIGURATION
// ======================

// NOTE: Production API root. TEMP: point this directly to Railway deployment until custom domain/CNAME is configured.
// Example Railway URL pattern: https://your-service-name.up.railway.app
// Append /api because all backend routes are mounted under /api in server.js
const PROD_API_ROOT = (typeof window !== 'undefined' && window.location.hostname.endsWith('netlify.app'))
    ? 'https://dashboard-guardian-production.up.railway.app/api' // Updated to actual Railway service domain
    : 'https://dashboard-guardian-production.up.railway.app/api';
const DEV_API_ROOT  = 'http://localhost:5000/api';

// Utility: detect if running locally
function isLocalHost() {
    return typeof location !== 'undefined' && (location.hostname.includes('localhost') || location.hostname.startsWith('127.'));
}

// Get API URLs from localStorage or use intelligent defaults
function getApiBaseUrl() {
    const stored = (typeof localStorage !== 'undefined') ? localStorage.getItem('GLOBAL_API_BASE_URL') : null;
    if (stored && stored.trim().length > 0) return stored.trim();
    return isLocalHost() ? DEV_API_ROOT : PROD_API_ROOT;
}

function getGeminiApiKey() {
    return (typeof localStorage !== 'undefined' && localStorage.getItem('GEMINI_API_KEY')) || 'AIzaSyBI-1nm5J02NX1HBszEgeOClktTITPxAKc';
}

// Main API Configuration Object
const API_CONFIG = {
    // Dynamic base URL - automatically updates when changed in settings
    get BASE_URL() {
        return getApiBaseUrl();
    },

    // Gemini API Key - automatically updates when changed in settings
    get GEMINI_API_KEY() {
        return getGeminiApiKey();
    },

    // External services (if any)
    EXTERNAL_SERVICES: {
        IP_SERVICE: 'https://api.ipify.org?format=json',
        // Add other external APIs here
    },

    // Feature-specific API endpoints
    ENDPOINTS: {
        // Employee Management
        EMPLOYEES: '/employees',
        EMPLOYEE_BY_ID: (id) => `/employees/${id}`,
        EMPLOYEE_SEARCH: (query) => `/employees/search?q=${query}`,
        EMPLOYEE_BY_STATUS: (status) => `/employees/status/${status}`,
        
        // Attendance System
        ATTENDANCE_CHECKIN: '/attendance/checkin',
        ATTENDANCE_CHECKOUT: '/attendance/checkout',
        ATTENDANCE_STATUS: (employeeId) => `/attendance/status/${employeeId}`,
        ATTENDANCE_HISTORY: (employeeId, limit) => `/attendance/history/${employeeId}${limit ? `?limit=${limit}` : ''}`,
        ATTENDANCE_ALL: '/attendance/all',
        ATTENDANCE_STATS: '/attendance/stats',
        ATTENDANCE_BY_DATE: (date) => `/attendance/date/${date}`,
        
        // Loan Management
        LOAN_REQUESTS: '/loan-requests',
        LOAN_REQUEST_BY_ID: (id) => `/loan-requests/${id}`,
        LOAN_REQUESTS_BY_EMPLOYEE: (employeeId) => `/loan-requests/employee/${employeeId}`,
        LOAN_REQUEST_STATUS: (id) => `/loan-requests/${id}/status`,
        LOAN_REQUEST_PAYMENT: (id) => `/loan-requests/${id}/payment`,
        LOAN_STATS: '/loan-requests/stats',
        
        // Guardian AI Features - ADD YOUR API ENDPOINTS HERE
        GUARDIAN_AI: {
            SESSIONS: '/guardian-ai/sessions',
            START_SESSION: '/guardian-ai/start',
            END_SESSION: (sessionId) => `/guardian-ai/sessions/${sessionId}/end`,
            TRAINING_DATA: '/guardian-ai/training-data',
            ANALYTICS: '/guardian-ai/analytics',
            USER_PROGRESS: (employeeId) => `/guardian-ai/progress/${employeeId}`
        },
        
        // Speech Practice - ADD YOUR API ENDPOINTS HERE
        SPEECH_PRACTICE: {
            SESSIONS: '/speech-practice/sessions',
            START_PRACTICE: '/speech-practice/start',
            SUBMIT_RECORDING: '/speech-practice/recording',
            GET_FEEDBACK: (sessionId) => `/speech-practice/feedback/${sessionId}`,
            PROGRESS: (employeeId) => `/speech-practice/progress/${employeeId}`,
            EXERCISES: '/speech-practice/exercises'
        },
        
        // Guardian TTS - ADD YOUR API ENDPOINTS HERE
        GUARDIAN_TTS: {
            SYNTHESIZE: '/tts/synthesize',
            VOICES: '/tts/voices',
            USAGE_STATS: (employeeId) => `/tts/usage/${employeeId}`,
            SAVE_AUDIO: '/tts/save-audio'
        },
        
        // Phonetic Pronunciation - ADD YOUR API ENDPOINTS HERE
        PHONETIC: {
            EXERCISES: '/phonetic/exercises',
            PRACTICE_SESSION: '/phonetic/practice',
            PRONUNCIATION_CHECK: '/phonetic/check-pronunciation',
            PROGRESS: (employeeId) => `/phonetic/progress/${employeeId}`,
            DIFFICULTY_LEVELS: '/phonetic/difficulty-levels'
        },
        
        // Eligibility Verification - ADD YOUR API ENDPOINTS HERE
        ELIGIBILITY: {
            VERIFY: '/eligibility/verify',
            PATIENT_LOOKUP: '/eligibility/patient-lookup',
            INSURANCE_CHECK: '/eligibility/insurance-check',
            HISTORY: (employeeId) => `/eligibility/history/${employeeId}`,
            BATCH_VERIFY: '/eligibility/batch-verify',
            REPORTS: '/eligibility/reports'
        },
        
        // Claims Follow-up - ADD YOUR API ENDPOINTS HERE
        CLAIMS: {
            ALL: '/claims',
            BY_ID: (claimId) => `/claims/${claimId}`,
            CREATE: '/claims',
            UPDATE_STATUS: (claimId) => `/claims/${claimId}/status`,
            FOLLOW_UP: (claimId) => `/claims/${claimId}/follow-up`,
            EMPLOYEE_CLAIMS: (employeeId) => `/claims/employee/${employeeId}`,
            ANALYTICS: '/claims/analytics',
            REPORTS: '/claims/reports'
        },
        
        // AR Comments - ADD YOUR API ENDPOINTS HERE
        AR_COMMENTS: {
            ALL: '/ar-comments',
            BY_ID: (commentId) => `/ar-comments/${commentId}`,
            CREATE: '/ar-comments',
            UPDATE: (commentId) => `/ar-comments/${commentId}`,
            DELETE: (commentId) => `/ar-comments/${commentId}`,
            BY_EMPLOYEE: (employeeId) => `/ar-comments/employee/${employeeId}`,
            BY_PRIORITY: (priority) => `/ar-comments/priority/${priority}`,
            ANALYTICS: '/ar-comments/analytics'
        },
        
        // Feedback System - ADD YOUR API ENDPOINTS HERE
        FEEDBACK: {
            SUBMIT: '/feedback',
            ALL: '/feedback',
            BY_ID: (feedbackId) => `/feedback/${feedbackId}`,
            BY_EMPLOYEE: (employeeId) => `/feedback/employee/${employeeId}`,
            UPDATE_STATUS: (feedbackId) => `/feedback/${feedbackId}/status`,
            ANALYTICS: '/feedback/analytics',
            SENTIMENT_ANALYSIS: '/feedback/sentiment'
        },
        
        // User Authentication
        AUTH: {
            LOGIN: '/auth/login',
            REGISTER: '/auth/register',
            PROFILE: '/auth/profile',
            LOGOUT: '/auth/logout'
        }
    }
};

// ======================
// HELPER FUNCTIONS
// ======================

// Get full API URL
function getApiUrl(endpoint) {
    return `${API_CONFIG.BASE_URL}${endpoint}`;
}

// Make API request with error handling
async function makeApiRequest(endpoint, options = {}) {
    try {
        const url = getApiUrl(endpoint);
        const defaultOptions = {
            headers: {
                'Content-Type': 'application/json',
                ...(typeof localStorage !== 'undefined' && localStorage.getItem('authToken') && {
                    'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                })
            }
        };
        const response = await fetch(url, { ...defaultOptions, ...options });
        if (!response.ok) {
            throw new Error(`API Error: ${response.status} - ${response.statusText}`);
        }
        return await response.json();
    } catch (error) {
        console.error('API Request Failed:', error);
        throw error;
    }
}

// ======================
// API FUNCTIONS FOR SPECIFIC FEATURES
// ======================

const GuardianAI = {
    async startSession(employeeId, sessionData) {
        return makeApiRequest(API_CONFIG.ENDPOINTS.GUARDIAN_AI.START_SESSION, {
            method: 'POST',
            body: JSON.stringify({ employeeId, ...sessionData })
        });
    },
    async endSession(sessionId, sessionResults) {
        return makeApiRequest(API_CONFIG.ENDPOINTS.GUARDIAN_AI.END_SESSION(sessionId), {
            method: 'PUT',
            body: JSON.stringify(sessionResults)
        });
    },
    async getProgress(employeeId) {
        return makeApiRequest(API_CONFIG.ENDPOINTS.GUARDIAN_AI.USER_PROGRESS(employeeId));
    },
    async getAnalytics() {
        return makeApiRequest(API_CONFIG.ENDPOINTS.GUARDIAN_AI.ANALYTICS);
    }
};

const SpeechPractice = {
    async startPractice(employeeId, exerciseId) {
        return makeApiRequest(API_CONFIG.ENDPOINTS.SPEECH_PRACTICE.START_PRACTICE, {
            method: 'POST',
            body: JSON.stringify({ employeeId, exerciseId })
        });
    },
    async submitRecording(sessionId, audioData) {
        return makeApiRequest(API_CONFIG.ENDPOINTS.SPEECH_PRACTICE.SUBMIT_RECORDING, {
            method: 'POST',
            body: JSON.stringify({ sessionId, audioData })
        });
    },
    async getProgress(employeeId) {
        return makeApiRequest(API_CONFIG.ENDPOINTS.SPEECH_PRACTICE.PROGRESS(employeeId));
    }
};

const GuardianTTS = {
    async synthesizeText(text, voiceSettings) {
        return makeApiRequest(API_CONFIG.ENDPOINTS.GUARDIAN_TTS.SYNTHESIZE, {
            method: 'POST',
            body: JSON.stringify({ text, voiceSettings })
        });
    },
    async getVoices() {
        return makeApiRequest(API_CONFIG.ENDPOINTS.GUARDIAN_TTS.VOICES);
    },
    async getUsageStats(employeeId) {
        return makeApiRequest(API_CONFIG.ENDPOINTS.GUARDIAN_TTS.USAGE_STATS(employeeId));
    }
};

const EligibilityVerification = {
    async verifyEligibility(patientData) {
        return makeApiRequest(API_CONFIG.ENDPOINTS.ELIGIBILITY.VERIFY, {
            method: 'POST',
            body: JSON.stringify(patientData)
        });
    },
    async lookupPatient(patientId) {
        return makeApiRequest(API_CONFIG.ENDPOINTS.ELIGIBILITY.PATIENT_LOOKUP, {
            method: 'POST',
            body: JSON.stringify({ patientId })
        });
    },
    async getHistory(employeeId) {
        return makeApiRequest(API_CONFIG.ENDPOINTS.ELIGIBILITY.HISTORY(employeeId));
    }
};

const ClaimsFollowUp = {
    async getAllClaims() {
        return makeApiRequest(API_CONFIG.ENDPOINTS.CLAIMS.ALL);
    },
    async createClaim(claimData) {
        return makeApiRequest(API_CONFIG.ENDPOINTS.CLAIMS.CREATE, {
            method: 'POST',
            body: JSON.stringify(claimData)
        });
    },
    async updateClaimStatus(claimId, status, notes) {
        return makeApiRequest(API_CONFIG.ENDPOINTS.CLAIMS.UPDATE_STATUS(claimId), {
            method: 'PUT',
            body: JSON.stringify({ status, notes })
        });
    },
    async getEmployeeClaims(employeeId) {
        return makeApiRequest(API_CONFIG.ENDPOINTS.CLAIMS.EMPLOYEE_CLAIMS(employeeId));
    }
};

if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        API_CONFIG,
        getApiUrl,
        makeApiRequest,
        GuardianAI,
        SpeechPractice,
        GuardianTTS,
        EligibilityVerification,
        ClaimsFollowUp
    };
}