// 🔄 Auto-loading API Configuration for All Pages
// This script automatically loads and applies API settings across all pages

(function() {
    'use strict';

    // ======================
    // GLOBAL API MANAGER
    // ======================
    
    class GlobalAPIManager {
        constructor() {
            this.init();
        }

        init() {
            this.loadAPIConfig();
            this.setupEventListeners();
            this.replaceExistingApiCalls();
        }

        // Load API configuration from localStorage
        loadAPIConfig() {
            const backendApiUrl = localStorage.getItem('GLOBAL_API_BASE_URL') || 'http://localhost:5000/api';
            // Do NOT provide a default Gemini key; require admin to set it explicitly
            const geminiApiKey = localStorage.getItem('GEMINI_API_KEY') || '';
            
            // Set global variables
            window.GLOBAL_API_BASE_URL = backendApiUrl;
            window.GEMINI_API_KEY = geminiApiKey;
            
            // Update any existing API_BASE_URL variables
            if (typeof window.API_BASE_URL !== 'undefined') {
                window.API_BASE_URL = backendApiUrl;
            }
            
            console.log('🔄 API Config Loaded:', {
                backend: backendApiUrl,
                gemini: geminiApiKey ? 'Set' : 'Not set'
            });
        }

        // Setup event listeners for API config updates
        setupEventListeners() {
            // Listen for API config updates from settings page
            window.addEventListener('apiConfigUpdated', (event) => {
                this.loadAPIConfig();
                this.notifyPageOfUpdate(event.detail);
            });

            // Listen for localStorage changes (from other tabs)
            window.addEventListener('storage', (event) => {
                if (event.key === 'GLOBAL_API_BASE_URL' || event.key === 'GEMINI_API_KEY') {
                    this.loadAPIConfig();
                    this.reloadPageAPICalls();
                }
            });
        }

        // Replace existing API calls with new URLs
        replaceExistingApiCalls() {
            const currentUrl = window.GLOBAL_API_BASE_URL;
            
            // Update fetch calls that use old hardcoded URLs
            this.replaceFetchCalls(currentUrl);
        }

        // Replace hardcoded fetch URLs
        replaceFetchCalls(newBaseUrl) {
            // Override the global fetch function to automatically replace URLs
            if (!window.originalFetch) {
                window.originalFetch = window.fetch;
                
                window.fetch = function(url, options) {
                    // Replace hardcoded localhost URLs
                    if (typeof url === 'string') {
                        if (url.includes('localhost:3000/api')) {
                            url = url.replace('http://localhost:3000/api', newBaseUrl);
                        } else if (url.includes('localhost:5000/api') && !newBaseUrl.includes('localhost:5000')) {
                            url = url.replace('http://localhost:5000/api', newBaseUrl);
                        }
                    }
                    
                    return window.originalFetch(url, options);
                };
            }
        }

        // Notify page of API update
        notifyPageOfUpdate(config) {
            // Dispatch custom event that pages can listen to
            window.dispatchEvent(new CustomEvent('globalApiUpdated', {
                detail: config
            }));
        }

        // Reload API calls for current page
        reloadPageAPICalls() {
            // Check if page has specific reload functions
            if (typeof window.reloadPageData === 'function') {
                window.reloadPageData();
            }
            
            // Check for common reload functions
            if (typeof window.loadEmployees === 'function') {
                window.loadEmployees();
            }
            if (typeof window.loadAttendanceData === 'function') {
                window.loadAttendanceData();
            }
            if (typeof window.loadLoanRequests === 'function') {
                window.loadLoanRequests();
            }
        }

        // Get current API configuration
        getCurrentConfig() {
            return {
                backendApiUrl: window.GLOBAL_API_BASE_URL,
                geminiApiKey: window.GEMINI_API_KEY
            };
        }
    }

    // ======================
    // HELPER FUNCTIONS
    // ======================

    // Enhanced API request function that uses global config
    window.makeGlobalApiRequest = async function(endpoint, options = {}) {
        const baseUrl = window.GLOBAL_API_BASE_URL || 'http://localhost:5000/api';
        const url = endpoint.startsWith('http') ? endpoint : `${baseUrl}${endpoint}`;
        
        const defaultOptions = {
            headers: {
                'Content-Type': 'application/json',
                ...(localStorage.getItem('authToken') && {
                    'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                })
            }
        };
        
        try {
            const response = await fetch(url, { ...defaultOptions, ...options });
            
            if (!response.ok) {
                throw new Error(`API Error: ${response.status} - ${response.statusText}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error('Global API Request Failed:', error);
            throw error;
        }
    };

    // Secure Gemini API request: prefer backend proxy so secret key is never exposed.
    // Fallback to direct call ONLY if a key is explicitly set in localStorage (development use).
    window.makeGeminiApiRequest = async function(payload, model = 'gemini-2.5-flash-preview-05-20', options = {}) {
        const directKey = window.GEMINI_API_KEY || '';
        const useDirect = !!directKey && options.forceDirect === true; // explicit opt-in

        if (!useDirect) {
            try {
                const proxyResp = await fetch(`${window.GLOBAL_API_BASE_URL || ''}/gemini/${model}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
                if (!proxyResp.ok) {
                    // Allow fallback ONLY if we have a local key configured
                    if (proxyResp.status === 500 && directKey) {
                        console.warn('[GeminiProxy] Proxy failed, attempting direct request fallback.');
                    } else {
                        const txt = await proxyResp.text();
                        throw new Error(`Gemini proxy error ${proxyResp.status}: ${txt}`);
                    }
                } else {
                    return await proxyResp.json();
                }
            } catch (err) {
                if (!directKey) {
                    console.error('[GeminiProxy] Failed and no direct key available:', err);
                    throw err;
                }
            }
        }

        if (!directKey) {
            throw new Error('Gemini API not configured on server and no local key available.');
        }

        const directUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${directKey}`;
        const response = await fetch(directUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
        if (!response.ok) throw new Error(`Gemini direct API error ${response.status}`);
        return response.json();
    };

    // ======================
    // AUTO-INITIALIZATION
    // ======================

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            new GlobalAPIManager();
        });
    } else {
        new GlobalAPIManager();
    }

    // Export for manual access
    window.GlobalAPIManager = GlobalAPIManager;

    // Unified helper to update Gemini key programmatically (e.g., from settings page)
    window.updateGeminiKey = function(newKey){
        const trimmed = (newKey || '').trim();
        localStorage.setItem('GEMINI_API_KEY', trimmed);
        window.GEMINI_API_KEY = trimmed;
        window.dispatchEvent(new CustomEvent('apiConfigUpdated', { detail: { geminiApiKey: trimmed, backendApiUrl: window.GLOBAL_API_BASE_URL } }));
        window.dispatchEvent(new CustomEvent('globalApiUpdated', { detail: { geminiApiKey: trimmed, backendApiUrl: window.GLOBAL_API_BASE_URL } }));
        console.info('🔑 Gemini API key updated via updateGeminiKey helper. Length:', trimmed.length);
    };

})();