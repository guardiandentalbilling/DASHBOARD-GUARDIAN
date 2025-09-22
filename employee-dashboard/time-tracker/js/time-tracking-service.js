/**
 * Guardian Time Tracking Service
 * Handles real-time time tracking with EST timezone
 * Work hours: 6 AM - 11 PM EST
 * Overtime: Any time > 8 hours per work day
 */

class TimeTrackingService {
    constructor() {
        this.currentSession = null;
        this.isTracking = false;
        this.sessionTimer = null;
        this.updateInterval = 1000; // Update every second
        this.listeners = new Set();
        this.employeeId = null;
        
        // Initialize from localStorage
        this.loadState();
        
        // Start auto-update if currently tracking
        if (this.isTracking && this.currentSession) {
            this.startTimer();
        }
    }

    /**
     * Get current EST time
     */
    getESTTime() {
        const now = new Date();
        // Convert to EST/EDT automatically
        const estTime = new Date(now.toLocaleString("en-US", {timeZone: "America/New_York"}));
        return estTime;
    }

    /**
     * Get work day for EST time (6 AM to 11 PM schedule)
     * Returns current date as work day
     */
    getWorkDay(estTime = null) {
        if (!estTime) estTime = this.getESTTime();
        
        // For 6 AM to 11 PM schedule, work day is the current date
        // No overnight shifts, so we don't need to adjust for late hours
        return estTime.toISOString().split('T')[0];
    }

    /**
     * Check if current time is within work hours (6 AM to 11 PM EST)
     */
    isWithinWorkHours(estTime = null) {
        if (!estTime) estTime = this.getESTTime();
        
        const hour = estTime.getHours();
        // Work hours: 6 AM (06:00) to 11 PM (23:00) EST
        return hour >= 6 && hour < 23;
    }

    /**
     * Set employee ID
     */
    setEmployeeId(employeeId) {
        this.employeeId = employeeId;
        this.saveState();
    }

    /**
     * Start time tracking
     */
    async startTracking(taskDescription = 'Working') {
        if (this.isTracking) {
            throw new Error('Already tracking time');
        }

        const estTime = this.getESTTime();
        const workDay = this.getWorkDay(estTime);
        const withinWorkHours = this.isWithinWorkHours(estTime);
        
        if (!workDay) {
            throw new Error('Cannot determine work day');
        }

        // Allow tracking outside work hours but show a warning
        if (!withinWorkHours) {
            console.warn('Starting time tracking outside normal work hours (6 AM - 11 PM EST)');
        }

        this.currentSession = {
            id: this.generateSessionId(),
            employeeId: this.employeeId,
            taskDescription: taskDescription,
            startTime: estTime.toISOString(),
            startTimeEST: estTime,
            workDay: workDay,
            breaks: [],
            screenshots: [],
            isActive: true,
            totalElapsed: 0,
            outsideWorkHours: !withinWorkHours
        };

        this.isTracking = true;
        this.startTimer();
        this.saveState();
        
        // Notify listeners
        this.notifyListeners('tracking_started', {
            session: this.currentSession,
            workDay: workDay,
            withinWorkHours: withinWorkHours
        });

        // Save to backend if available
        try {
            await this.saveSessionToBackend();
        } catch (error) {
            console.warn('Could not save to backend:', error);
        }

        return this.currentSession;
    }

    /**
     * Pause time tracking
     */
    pauseTracking() {
        if (!this.isTracking || !this.currentSession || !this.currentSession.isActive) {
            throw new Error('Not currently tracking or already paused');
        }

        const estTime = this.getESTTime();
        
        // Record current elapsed time
        this.updateElapsedTime();
        
        // Add break record
        this.currentSession.breaks.push({
            pauseTime: estTime.toISOString(),
            pauseTimeEST: estTime
        });

        this.currentSession.isActive = false;
        this.stopTimer();
        this.saveState();

        this.notifyListeners('tracking_paused', {
            session: this.currentSession,
            totalElapsed: this.currentSession.totalElapsed
        });

        return this.currentSession;
    }

    /**
     * Resume time tracking
     */
    resumeTracking() {
        if (!this.isTracking || !this.currentSession || this.currentSession.isActive) {
            throw new Error('Not currently paused or already tracking');
        }

        const estTime = this.getESTTime();

        // Update last break with resume time
        const lastBreak = this.currentSession.breaks[this.currentSession.breaks.length - 1];
        if (lastBreak && !lastBreak.resumeTime) {
            lastBreak.resumeTime = estTime.toISOString();
            lastBreak.resumeTimeEST = estTime;
        }

        this.currentSession.isActive = true;
        this.startTimer();
        this.saveState();

        this.notifyListeners('tracking_resumed', {
            session: this.currentSession
        });

        return this.currentSession;
    }

    /**
     * Stop time tracking
     */
    async stopTracking() {
        if (!this.isTracking || !this.currentSession) {
            throw new Error('Not currently tracking');
        }

        const estTime = this.getESTTime();
        
        // Update final elapsed time
        this.updateElapsedTime();
        
        // If was active when stopped, record final pause
        if (this.currentSession.isActive) {
            this.currentSession.breaks.push({
                pauseTime: estTime.toISOString(),
                pauseTimeEST: estTime
            });
        }

        this.currentSession.endTime = estTime.toISOString();
        this.currentSession.endTimeEST = estTime;
        this.currentSession.isActive = false;

        const finalSession = { ...this.currentSession };
        const workDayStats = await this.getWorkDayStats(finalSession.workDay);

        // Reset tracking state
        this.isTracking = false;
        this.currentSession = null;
        this.stopTimer();
        this.saveState();

        this.notifyListeners('tracking_stopped', {
            session: finalSession,
            workDayStats: workDayStats
        });

        // Save final session to backend
        try {
            await this.saveSessionToBackend(finalSession);
        } catch (error) {
            console.warn('Could not save final session to backend:', error);
        }

        return finalSession;
    }

    /**
     * Get current tracking status
     */
    getStatus() {
        const estTime = this.getESTTime();
        const workDay = this.getWorkDay(estTime);
        const withinWorkHours = this.isWithinWorkHours(estTime);

        return {
            isTracking: this.isTracking,
            isActive: this.currentSession?.isActive || false,
            currentSession: this.currentSession,
            workDay: workDay,
            withinWorkHours: withinWorkHours,
            estTime: estTime,
            currentElapsed: this.getCurrentElapsed()
        };
    }

    /**
     * Get current elapsed time in milliseconds
     */
    getCurrentElapsed() {
        if (!this.currentSession) return 0;
        
        let elapsed = this.currentSession.totalElapsed;
        
        if (this.isTracking && this.currentSession.isActive) {
            const now = this.getESTTime();
            const lastResumeTime = this.getLastResumeTime();
            elapsed += now - lastResumeTime;
        }
        
        return elapsed;
    }

    /**
     * Get work day statistics
     */
    async getWorkDayStats(workDay) {
        const sessions = await this.getWorkDaySessions(workDay);
        
        let totalTime = 0;
        let totalBreakTime = 0;
        let screenshotCount = 0;
        
        sessions.forEach(session => {
            totalTime += session.totalElapsed || 0;
            screenshotCount += session.screenshots?.length || 0;
            
            // Calculate break time
            session.breaks?.forEach(breakItem => {
                if (breakItem.resumeTime) {
                    const breakDuration = new Date(breakItem.resumeTime) - new Date(breakItem.pauseTime);
                    totalBreakTime += breakDuration;
                }
            });
        });

        const totalHours = totalTime / (1000 * 60 * 60);
        const regularHours = Math.min(totalHours, 8);
        const overtimeHours = Math.max(totalHours - 8, 0);

        return {
            workDay,
            totalTime,
            totalHours,
            regularHours,
            overtimeHours,
            totalBreakTime,
            screenshotCount,
            sessionsCount: sessions.length,
            sessions
        };
    }

    /**
     * Add event listener for time tracking events
     */
    addEventListener(callback) {
        this.listeners.add(callback);
    }

    /**
     * Remove event listener
     */
    removeEventListener(callback) {
        this.listeners.delete(callback);
    }

    /**
     * Notify all listeners of an event
     */
    notifyListeners(eventType, data) {
        console.log(`TimeTrackingService: ${eventType}`, data); // Debug logging
        
        this.listeners.forEach(callback => {
            try {
                callback(eventType, data);
            } catch (error) {
                console.error('Error in time tracking listener:', error);
            }
        });
        
        // Also broadcast to other windows/frames
        this.broadcastToFrames(eventType, data);
    }

    /**
     * Broadcast events to all frames and parent windows
     */
    broadcastToFrames(eventType, data) {
        try {
            // Broadcast to parent window
            if (window.parent && window.parent !== window) {
                window.parent.postMessage({
                    source: 'time_tracking_service',
                    event: eventType,
                    data: data
                }, '*');
            }
            
            // Broadcast to all frames in parent window
            if (window.top && window.top !== window) {
                window.top.postMessage({
                    source: 'time_tracking_service',
                    event: eventType,
                    data: data
                }, '*');
            }
            
            // Trigger custom event for same-page listeners
            window.dispatchEvent(new CustomEvent('timeTrackingEvent', {
                detail: { eventType, data }
            }));
            
        } catch (error) {
            console.warn('Could not broadcast to frames:', error);
        }
    }

    // Private methods

    startTimer() {
        this.stopTimer();
        this.sessionTimer = setInterval(() => {
            if (this.currentSession && this.currentSession.isActive) {
                this.notifyListeners('time_update', {
                    elapsed: this.getCurrentElapsed(),
                    session: this.currentSession
                });
            }
        }, this.updateInterval);
    }

    stopTimer() {
        if (this.sessionTimer) {
            clearInterval(this.sessionTimer);
            this.sessionTimer = null;
        }
    }

    updateElapsedTime() {
        if (!this.currentSession || !this.currentSession.isActive) return;
        
        const now = this.getESTTime();
        const lastResumeTime = this.getLastResumeTime();
        const sessionTime = now - lastResumeTime;
        
        this.currentSession.totalElapsed += sessionTime;
    }

    getLastResumeTime() {
        if (!this.currentSession) return new Date();
        
        // Find the last resume time or start time
        const breaks = this.currentSession.breaks || [];
        const lastBreak = breaks[breaks.length - 1];
        
        if (lastBreak && lastBreak.resumeTime) {
            return new Date(lastBreak.resumeTime);
        } else if (breaks.length > 0) {
            // Currently in a break
            return new Date(this.currentSession.startTime);
        } else {
            // No breaks yet
            return new Date(this.currentSession.startTime);
        }
    }

    generateSessionId() {
        return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    saveState() {
        const state = {
            isTracking: this.isTracking,
            currentSession: this.currentSession,
            employeeId: this.employeeId
        };
        localStorage.setItem('guardian_time_tracking_state', JSON.stringify(state));
    }

    loadState() {
        try {
            const saved = localStorage.getItem('guardian_time_tracking_state');
            if (saved) {
                const state = JSON.parse(saved);
                this.isTracking = state.isTracking || false;
                this.currentSession = state.currentSession || null;
                this.employeeId = state.employeeId || null;
                
                // Convert date strings back to Date objects
                if (this.currentSession) {
                    this.currentSession.startTimeEST = new Date(this.currentSession.startTime);
                    if (this.currentSession.endTime) {
                        this.currentSession.endTimeEST = new Date(this.currentSession.endTime);
                    }
                }
            }
        } catch (error) {
            console.warn('Could not load saved time tracking state:', error);
        }
    }

    authHeaders() {
        const token = localStorage.getItem('authToken');
        return token ? { 'Authorization': 'Bearer ' + token } : {};
    }

    async getWorkDaySessions(workDay) {
        // Try to get from backend first
        try {
            const response = await fetch(`/api/time-tracking/sessions?start=${workDay}&end=${workDay}` , { headers: this.authHeaders() });
            if (response.ok) {
                return await response.json();
            }
        } catch (error) {
            console.warn('Could not fetch sessions from backend:', error);
        }
        
        // Fallback to localStorage
        const sessions = JSON.parse(localStorage.getItem(`guardian_sessions_${workDay}`) || '[]');
        return sessions;
    }

    async saveSessionToBackend(session = null) {
        const sessionToSave = session || this.currentSession;
        if (!sessionToSave) return;

        // Save to localStorage for persistence
        this.saveSessionToLocalStorage(sessionToSave);

        try {
            // starting session: we already posted via startTracking override; only handle stop here
            if(session && session.endTime){
                const resp = await fetch('/api/time-tracking/stop', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', ...this.authHeaders() },
                    body: JSON.stringify({ totalElapsed: session.totalElapsed })
                });
                if(!resp.ok) throw new Error('Failed backend stop');
                return await resp.json();
            }
        } catch (error) {
            console.warn('Backend not available, using localStorage only:', error);
            return sessionToSave;
        }
    }

    /**
     * Save session to localStorage for persistence
     */
    saveSessionToLocalStorage(session) {
        try {
            // Save individual session
            const sessionKey = `guardian_session_${session.id}`;
            localStorage.setItem(sessionKey, JSON.stringify(session));
            
            // Add to work day sessions list
            const workDayKey = `guardian_sessions_${session.workDay}`;
            const workDaySessions = JSON.parse(localStorage.getItem(workDayKey) || '[]');
            
            // Update or add session
            const existingIndex = workDaySessions.findIndex(s => s.id === session.id);
            if (existingIndex >= 0) {
                workDaySessions[existingIndex] = session;
            } else {
                workDaySessions.push(session);
            }
            
            localStorage.setItem(workDayKey, JSON.stringify(workDaySessions));
            
            // Update global session index
            this.updateGlobalSessionIndex(session);
            
        } catch (error) {
            console.error('Failed to save session to localStorage:', error);
        }
    }

    /**
     * Update global session index for analytics
     */
    updateGlobalSessionIndex(session) {
        try {
            const indexKey = `guardian_session_index_${this.employeeId}`;
            const sessionIndex = JSON.parse(localStorage.getItem(indexKey) || '[]');
            
            // Add session reference
            const sessionRef = {
                id: session.id,
                workDay: session.workDay,
                startTime: session.startTime,
                endTime: session.endTime,
                totalElapsed: session.totalElapsed,
                taskDescription: session.taskDescription
            };
            
            const existingIndex = sessionIndex.findIndex(s => s.id === session.id);
            if (existingIndex >= 0) {
                sessionIndex[existingIndex] = sessionRef;
            } else {
                sessionIndex.push(sessionRef);
            }
            
            // Sort by start time
            sessionIndex.sort((a, b) => new Date(a.startTime) - new Date(b.startTime));
            
            localStorage.setItem(indexKey, JSON.stringify(sessionIndex));
            
        } catch (error) {
            console.error('Failed to update session index:', error);
        }
    }

    /**
     * Get time tracking analytics for different periods
     */
    async getAnalytics(period = 'current_week') {
        try {
            const estTime = this.getESTTime();
            const sessionIndex = JSON.parse(localStorage.getItem(`guardian_session_index_${this.employeeId}`) || '[]');
            
            let filteredSessions = [];
            let periodStart, periodEnd;
            
            switch (period) {
                case 'today':
                    ({ start: periodStart, end: periodEnd } = this.getTodayRange(estTime));
                    break;
                case 'current_week':
                    ({ start: periodStart, end: periodEnd } = this.getCurrentWeekRange(estTime));
                    break;
                case 'this_month':
                    ({ start: periodStart, end: periodEnd } = this.getCurrentMonthRange(estTime));
                    break;
                case 'past_month':
                    ({ start: periodStart, end: periodEnd } = this.getPastMonthRange(estTime));
                    break;
                case 'this_year':
                    ({ start: periodStart, end: periodEnd } = this.getCurrentYearRange(estTime));
                    break;
                case 'past_year':
                    ({ start: periodStart, end: periodEnd } = this.getPastYearRange(estTime));
                    break;
                case 'lifetime':
                    filteredSessions = sessionIndex;
                    break;
                default:
                    filteredSessions = sessionIndex;
            }
            
            if (period !== 'lifetime') {
                filteredSessions = sessionIndex.filter(session => {
                    const sessionDate = new Date(session.startTime);
                    return sessionDate >= periodStart && sessionDate <= periodEnd;
                });
            }
            
            return this.calculatePeriodStats(filteredSessions, period, periodStart, periodEnd);
            
        } catch (error) {
            console.error('Failed to get analytics:', error);
            return this.getEmptyAnalytics(period);
        }
    }

    /**
     * Get current week range (Monday to Sunday)
     */
    getCurrentWeekRange(estTime) {
        const monday = new Date(estTime);
        const dayOfWeek = monday.getDay();
        const daysToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
        monday.setDate(monday.getDate() + daysToMonday);
        monday.setHours(0, 0, 0, 0);
        
        const sunday = new Date(monday);
        sunday.setDate(sunday.getDate() + 6);
        sunday.setHours(23, 59, 59, 999);
        
        return { start: monday, end: sunday };
    }

    /**
     * Get today's range (EST timezone aware)
     */
    getTodayRange(estTime) {
        const start = new Date(estTime);
        start.setHours(0, 0, 0, 0);
        
        const end = new Date(estTime);
        end.setHours(23, 59, 59, 999);
        
        return { start, end };
    }

    /**
     * Get current month range
     */
    getCurrentMonthRange(estTime) {
        const start = new Date(estTime.getFullYear(), estTime.getMonth(), 1, 0, 0, 0, 0);
        const end = new Date(estTime.getFullYear(), estTime.getMonth() + 1, 0, 23, 59, 59, 999);
        return { start, end };
    }

    /**
     * Get past month range
     */
    getPastMonthRange(estTime) {
        const prevMonth = estTime.getMonth() - 1;
        const year = prevMonth < 0 ? estTime.getFullYear() - 1 : estTime.getFullYear();
        const month = prevMonth < 0 ? 11 : prevMonth;
        
        const start = new Date(year, month, 1, 0, 0, 0, 0);
        const end = new Date(year, month + 1, 0, 23, 59, 59, 999);
        return { start, end };
    }

    /**
     * Get current year range
     */
    getCurrentYearRange(estTime) {
        const start = new Date(estTime.getFullYear(), 0, 1, 0, 0, 0, 0);
        const end = new Date(estTime.getFullYear(), 11, 31, 23, 59, 59, 999);
        return { start, end };
    }

    /**
     * Get past year range
     */
    getPastYearRange(estTime) {
        const start = new Date(estTime.getFullYear() - 1, 0, 1, 0, 0, 0, 0);
        const end = new Date(estTime.getFullYear() - 1, 11, 31, 23, 59, 59, 999);
        return { start, end };
    }

    /**
     * Calculate statistics for a period
     */
    calculatePeriodStats(sessions, period, periodStart, periodEnd) {
        let totalTime = 0;
        let totalSessions = sessions.length;
        let workDays = new Set();
        let longestSession = 0;
        let shortestSession = Infinity;
        let totalOvertimeHours = 0;
        
        sessions.forEach(session => {
            const sessionTime = session.totalElapsed || 0;
            totalTime += sessionTime;
            
            if (sessionTime > longestSession) longestSession = sessionTime;
            if (sessionTime < shortestSession && sessionTime > 0) shortestSession = sessionTime;
            
            // Extract work day from session
            const sessionDate = new Date(session.startTime);
            const workDay = this.getWorkDay(sessionDate);
            if (workDay) workDays.add(workDay);
        });
        
        if (shortestSession === Infinity) shortestSession = 0;
        
        // Calculate overtime for each work day
        workDays.forEach(workDay => {
            const dayTotal = this.calculateWorkDayTotal(sessions, workDay);
            if (dayTotal > 8 * 60 * 60 * 1000) { // 8 hours in milliseconds
                totalOvertimeHours += (dayTotal - 8 * 60 * 60 * 1000);
            }
        });
        
        const totalHours = totalTime / (1000 * 60 * 60);
        const averagePerSession = totalSessions > 0 ? totalTime / totalSessions : 0;
        const averagePerDay = workDays.size > 0 ? totalTime / workDays.size : 0;
        
        return {
            period,
            periodStart,
            periodEnd,
            totalTime,
            totalHours,
            totalSessions,
            workDaysCount: workDays.size,
            longestSession,
            shortestSession,
            averagePerSession,
            averagePerDay,
            totalOvertimeHours: totalOvertimeHours / (1000 * 60 * 60),
            dailyBreakdown: this.getDailyBreakdown(sessions, periodStart, periodEnd)
        };
    }

    /**
     * Calculate total time for a specific work day
     */
    calculateWorkDayTotal(sessions, workDay) {
        return sessions
            .filter(session => {
                const sessionWorkDay = this.getWorkDay(new Date(session.startTime));
                return sessionWorkDay === workDay;
            })
            .reduce((total, session) => total + (session.totalElapsed || 0), 0);
    }

    /**
     * Get daily breakdown for charts
     */
    getDailyBreakdown(sessions, periodStart, periodEnd) {
        const breakdown = {};
        
        sessions.forEach(session => {
            const sessionDate = new Date(session.startTime);
            const workDay = this.getWorkDay(sessionDate);
            
            if (!breakdown[workDay]) {
                breakdown[workDay] = {
                    date: workDay,
                    totalTime: 0,
                    sessions: 0,
                    overtime: 0
                };
            }
            
            breakdown[workDay].totalTime += session.totalElapsed || 0;
            breakdown[workDay].sessions += 1;
        });
        
        // Calculate overtime for each day
        Object.values(breakdown).forEach(day => {
            const dayHours = day.totalTime / (1000 * 60 * 60);
            if (dayHours > 8) {
                day.overtime = dayHours - 8;
            }
        });
        
        return Object.values(breakdown).sort((a, b) => new Date(a.date) - new Date(b.date));
    }

    /**
     * Get empty analytics structure
     */
    getEmptyAnalytics(period) {
        return {
            period,
            totalTime: 0,
            totalHours: 0,
            totalSessions: 0,
            workDaysCount: 0,
            longestSession: 0,
            shortestSession: 0,
            averagePerSession: 0,
            averagePerDay: 0,
            totalOvertimeHours: 0,
            dailyBreakdown: []
        };
    }

    /**
     * Format time duration to HH:MM:SS
     */
    static formatTime(milliseconds) {
        const totalSeconds = Math.floor(milliseconds / 1000);
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;
        
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }

    /**
     * Format time duration to hours (decimal)
     */
    static formatHours(milliseconds) {
        return milliseconds / (1000 * 60 * 60);
    }
}

// Global instance
window.TimeTrackingService = new TimeTrackingService();

// Export for modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TimeTrackingService;
}