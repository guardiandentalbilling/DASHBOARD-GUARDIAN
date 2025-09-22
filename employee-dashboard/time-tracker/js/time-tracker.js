// Guardian Time Tracker - Web Version JavaScript
// Updated to use TimeTrackingService with EST timezone support

class TimeTracker {
    constructor() {
        // Use the global TimeTrackingService
        this.trackingService = window.TimeTrackingService;
        
        // UI state
        this.currentTask = '';
        this.screenshotTimer = null;
        
        // Set employee ID (should come from authentication)
        this.trackingService.setEmployeeId(this.getCurrentEmployeeId());

        this.initializeElements();
        this.setupEventListeners();
        this.setupTrackingServiceListeners();
        this.loadTodayData();
        this.loadAnalyticsData();
        this.startScreenshotMonitoring();
        this.updateUI();
    }

    getCurrentEmployeeId() {
        // Get from localStorage or authentication system
        return localStorage.getItem('currentEmployeeId') || 'emp_default';
    }

    initializeElements() {
        // Timer elements
        this.timerText = document.getElementById('timer-text');
        this.statusText = document.getElementById('status-text');
        this.timerCircle = document.querySelector('.timer-circle');
        
        // Control elements
        this.startSection = document.getElementById('start-section');
        this.trackingSection = document.getElementById('tracking-section');
        this.taskInput = document.getElementById('task-description');
        this.startButton = document.getElementById('start-button');
        this.pauseButton = document.getElementById('pause-button');
        this.resumeButton = document.getElementById('resume-button');
        this.stopButton = document.getElementById('stop-button');
        
        // Info elements
        this.currentTaskDesc = document.getElementById('current-task-desc');
        this.startTimeText = document.getElementById('start-time');
        this.screenshotStatus = document.getElementById('screenshot-status');
        this.totalTimeElement = document.getElementById('total-time-today');
        this.sessionsElement = document.getElementById('sessions-today');
        this.lastScreenshotElement = document.getElementById('last-screenshot');
        
        // Notification area
        this.notificationArea = document.getElementById('notification-area');
    }

    setupEventListeners() {
        this.startButton.addEventListener('click', () => this.startTracking());
        this.pauseButton.addEventListener('click', () => this.pauseTracking());
        this.resumeButton.addEventListener('click', () => this.resumeTracking());
        this.stopButton.addEventListener('click', () => this.stopTracking());
        
        // Enter key to start tracking
        this.taskInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !this.trackingService.isTracking) {
                this.startTracking();
            }
        });
    }

    setupTrackingServiceListeners() {
        this.trackingService.addEventListener((eventType, data) => {
            switch (eventType) {
                case 'tracking_started':
                    this.onTrackingStarted(data);
                    break;
                case 'tracking_paused':
                    this.onTrackingPaused(data);
                    break;
                case 'tracking_resumed':
                    this.onTrackingResumed(data);
                    break;
                case 'tracking_stopped':
                    this.onTrackingStopped(data);
                    break;
                case 'time_update':
                    this.onTimeUpdate(data);
                    break;
            }
        });
    }

    async startTracking() {
        try {
            const task = this.taskInput.value.trim() || 'Working on tasks';
            await this.trackingService.startTracking(task);
        } catch (error) {
            this.showNotification('Cannot Start Tracking', error.message, 'error');
        }
    }

    pauseTracking() {
        try {
            this.trackingService.pauseTracking();
        } catch (error) {
            this.showNotification('Cannot Pause', error.message, 'error');
        }
    }

    resumeTracking() {
        try {
            this.trackingService.resumeTracking();
        } catch (error) {
            this.showNotification('Cannot Resume', error.message, 'error');
        }
    }

    async stopTracking() {
        try {
            await this.trackingService.stopTracking();
        } catch (error) {
            this.showNotification('Cannot Stop', error.message, 'error');
        }
    }

    onTrackingStarted(data) {
        const { session } = data;
        this.currentTask = session.taskDescription;
        
        // Update UI
        this.startSection.classList.add('hidden');
        this.trackingSection.classList.remove('hidden');
        this.currentTaskDesc.textContent = session.taskDescription;
        this.startTimeText.textContent = `Started: ${window.formatESTTime(new Date(session.startTime))}`;
        this.timerCircle.classList.add('active');
        this.statusText.innerHTML = '<i class="fas fa-play"></i> TRACKING';
        
        // Update screenshot monitoring
        this.updateScreenshotStatus(true);
        
        // Check if tracking outside work hours and show appropriate notification
        if (session.outsideWorkHours) {
            this.showNotification('Outside Work Hours', 
                `Time tracking started outside regular work hours (6 AM - 11 PM EST): ${session.taskDescription}`, 
                'warning');
        } else {
            this.showNotification('Time Tracking Started', `Started tracking: ${session.taskDescription}`, 'success');
        }
        
        // Notify parent window if in iframe
        this.notifyParentWindow('tracking_started', session);
        
        this.loadTodayData();
        this.loadAnalyticsData();
    }

    onTrackingPaused(data) {
        // Update UI
        this.pauseButton.classList.add('hidden');
        this.resumeButton.classList.remove('hidden');
        this.timerCircle.classList.remove('active');
        this.timerCircle.classList.add('paused');
        this.statusText.innerHTML = '<i class="fas fa-pause"></i> PAUSED';
        
        // Update screenshot monitoring
        this.updateScreenshotStatus(false);
        
        this.showNotification('Time Tracking Paused', 'Your time tracking has been paused', 'warning');
        
        // Notify parent window
        this.notifyParentWindow('tracking_paused', data);
    }

    onTrackingResumed(data) {
        // Update UI
        this.resumeButton.classList.add('hidden');
        this.pauseButton.classList.remove('hidden');
        this.timerCircle.classList.remove('paused');
        this.timerCircle.classList.add('active');
        this.statusText.innerHTML = '<i class="fas fa-play"></i> TRACKING';
        
        // Update screenshot monitoring
        this.updateScreenshotStatus(true);
        
        this.showNotification('Time Tracking Resumed', 'Your time tracking has been resumed', 'success');
        
        // Notify parent window
        this.notifyParentWindow('tracking_resumed', data);
    }

    onTrackingStopped(data) {
        const { session, workDayStats } = data;
        
        // Reset UI
        this.trackingSection.classList.add('hidden');
        this.startSection.classList.remove('hidden');
        this.taskInput.value = '';
        this.timerCircle.classList.remove('active', 'paused');
        this.statusText.innerHTML = '<i class="fas fa-stop"></i> STOPPED';
        this.timerText.textContent = '00:00:00';
        
        // Update screenshot monitoring
        this.updateScreenshotStatus(false);
        
        // Show notification with overtime info
        const sessionTimeFormatted = TimeTrackingService.formatTime(session.totalElapsed);
        let message = `Session completed: ${sessionTimeFormatted}`;
        
        if (workDayStats.overtimeHours > 0) {
            message += `\nOvertime today: ${workDayStats.overtimeHours.toFixed(2)} hours`;
        }
        
        this.showNotification('Time Tracking Stopped', message, 'success');
        
        // Notify parent window
        this.notifyParentWindow('tracking_stopped', { session, workDayStats });
        
        this.loadTodayData();
        this.loadAnalyticsData();
    }

    onTimeUpdate(data) {
        const { elapsed } = data;
        this.timerText.textContent = TimeTrackingService.formatTime(elapsed);
        
        // Notify parent window with real-time updates
        this.notifyParentWindow('time_update', data);
    }

    notifyParentWindow(eventType, data) {
        console.log('TimeTracker: Notifying parent window', eventType, data);
        
        try {
            if (window.parent && window.parent !== window) {
                window.parent.postMessage({
                    source: 'time_tracker',
                    event: eventType,
                    data: data
                }, '*');
                console.log('TimeTracker: Message sent to parent');
            }
            
            // Also try to access parent directly
            if (window.parent && window.parent.profileTimeTracker) {
                console.log('TimeTracker: Direct access to parent profileTimeTracker found');
            }
            
        } catch (error) {
            console.warn('TimeTracker: Failed to notify parent:', error);
        }
    }

    updateUI() {
        const status = this.trackingService.getStatus();
        const { isTracking, isActive, currentSession, withinWorkHours, estTime } = status;
        
        // Show work hours status
        if (!withinWorkHours) {
            this.showWorkHoursWarning(estTime);
        }
        
        // Update UI based on current status
        if (isTracking && currentSession) {
            this.currentTask = currentSession.taskDescription;
            
            if (isActive) {
                // Currently tracking
                this.startSection.classList.add('hidden');
                this.trackingSection.classList.remove('hidden');
                this.currentTaskDesc.textContent = currentSession.taskDescription;
                this.startTimeText.textContent = `Started: ${new Date(currentSession.startTime).toLocaleTimeString()} EST`;
                this.timerCircle.classList.add('active');
                this.statusText.innerHTML = '<i class="fas fa-play"></i> TRACKING';
                this.pauseButton.classList.remove('hidden');
                this.resumeButton.classList.add('hidden');
                this.updateScreenshotStatus(true);
            } else {
                // Currently paused
                this.timerCircle.classList.remove('active');
                this.timerCircle.classList.add('paused');
                this.statusText.innerHTML = '<i class="fas fa-pause"></i> PAUSED';
                this.pauseButton.classList.add('hidden');
                this.resumeButton.classList.remove('hidden');
                this.updateScreenshotStatus(false);
            }
            
            // Update timer display
            this.timerText.textContent = TimeTrackingService.formatTime(status.currentElapsed);
        } else {
            // Not tracking
            this.trackingSection.classList.add('hidden');
            this.startSection.classList.remove('hidden');
            this.timerCircle.classList.remove('active', 'paused');
            this.statusText.innerHTML = '<i class="fas fa-stop"></i> STOPPED';
            this.timerText.textContent = '00:00:00';
            this.updateScreenshotStatus(false);
        }
    }

    showWorkHoursWarning(estTime) {
        const hour = estTime.getHours();
        let message = `Current EST time: ${estTime.toLocaleTimeString()}\n`;
        
        if (hour >= 4 && hour < 17) {
            message += 'Work hours: 5:00 PM - 4:00 AM EST';
            this.showNotification('Outside Work Hours', message, 'warning');
        }
    }

    async loadTodayData() {
        try {
            const status = this.trackingService.getStatus();
            if (status.workDay) {
                const workDayStats = await this.trackingService.getWorkDayStats(status.workDay);
                this.updateSummary(workDayStats);
            }
        } catch (error) {
            console.warn('Could not load today data:', error);
        }
    }

    async loadAnalyticsData() {
        try {
            // Load weekly summary data
            await this.loadWeeklySummary();
            
            // Load total hours summary
            await this.loadTotalHoursSummary();
            
            // Load performance metrics
            this.loadPerformanceMetrics();
            
            // Load schedule info
            this.loadScheduleInfo();
            
            // Load project analytics
            this.loadProjectAnalytics();
        } catch (error) {
            console.warn('Could not load analytics data:', error);
        }
    }

    async loadWeeklySummary() {
        try {
            const weeklyAnalytics = this.trackingService.getAnalytics('current_week');
            
            // Update allowed hours, logged hours, overtime
            const allowedHoursEl = document.getElementById('allowed-hours');
            const loggedHoursWeekEl = document.getElementById('logged-hours-week');
            const overtimeWeekEl = document.getElementById('overtime-week');
            
            if (allowedHoursEl) allowedHoursEl.textContent = '40h';
            if (loggedHoursWeekEl) loggedHoursWeekEl.textContent = this.formatHours(weeklyAnalytics.totalTime);
            if (overtimeWeekEl) overtimeWeekEl.textContent = this.formatHours(Math.max(0, weeklyAnalytics.totalTime - (40 * 60 * 60 * 1000)));
            
            // Update daily breakdown
            const days = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
            const dailyData = await this.getDailyBreakdown();
            
            days.forEach((day, index) => {
                const hours = dailyData[index] || 0;
                const progressEl = document.getElementById(`progress-${day}`);
                const hoursEl = document.getElementById(`hours-${day}`);
                
                if (progressEl && hoursEl) {
                    const percentage = Math.min(100, (hours / (8 * 60 * 60 * 1000)) * 100);
                    progressEl.style.width = `${percentage}%`;
                    hoursEl.textContent = this.formatHours(hours);
                }
            });
        } catch (error) {
            console.warn('Could not load weekly summary:', error);
        }
    }

    async loadTotalHoursSummary() {
        try {
            const periods = [
                { id: 'total-this-week', period: 'current_week' },
                { id: 'total-last-week', period: 'previous_week' },
                { id: 'total-this-month', period: 'this_month' },
                { id: 'total-last-month', period: 'previous_month' },
                { id: 'total-this-year', period: 'this_year' },
                { id: 'total-lifetime', period: 'lifetime' }
            ];
            
            periods.forEach(({ id, period }) => {
                const analytics = this.trackingService.getAnalytics(period);
                const element = document.getElementById(id);
                if (element) {
                    element.textContent = this.formatHours(analytics.totalTime);
                }
            });
        } catch (error) {
            console.warn('Could not load total hours summary:', error);
        }
    }

    loadPerformanceMetrics() {
        try {
            const todayAnalytics = this.trackingService.getAnalytics('today');
            const weeklyAnalytics = this.trackingService.getAnalytics('current_week');
            
            // Average session time
            const avgSessionEl = document.getElementById('avg-session-time');
            if (avgSessionEl && weeklyAnalytics.sessionsCount > 0) {
                const avgSession = weeklyAnalytics.totalTime / weeklyAnalytics.sessionsCount;
                avgSessionEl.textContent = this.formatHours(avgSession);
            }
            
            // Productivity score (mock calculation)
            const productivityEl = document.getElementById('productivity-score');
            if (productivityEl) {
                const productivity = Math.min(100, Math.max(0, (weeklyAnalytics.totalTime / (40 * 60 * 60 * 1000)) * 100));
                productivityEl.textContent = `${Math.round(productivity)}%`;
            }
            
            // Weekly goal
            const weeklyGoalEl = document.getElementById('weekly-goal');
            if (weeklyGoalEl) {
                weeklyGoalEl.textContent = '40h';
            }
        } catch (error) {
            console.warn('Could not load performance metrics:', error);
        }
    }

    loadScheduleInfo() {
        try {
            const status = this.trackingService.getStatus();
            
            // Work hours
            const workHoursEl = document.getElementById('work-hours-today');
            if (workHoursEl) {
                workHoursEl.textContent = '5 PM - 4 AM EST';
            }
            
            // Breaks taken (mock data)
            const breaksEl = document.getElementById('breaks-today');
            if (breaksEl) {
                breaksEl.textContent = '0';
            }
            
            // Shift status
            const shiftStatusEl = document.getElementById('shift-status');
            if (shiftStatusEl) {
                const isWorkHours = this.trackingService.isWorkHours();
                shiftStatusEl.textContent = isWorkHours ? 'Work Hours' : 'Outside Hours';
            }
        } catch (error) {
            console.warn('Could not load schedule info:', error);
        }
    }

    loadProjectAnalytics() {
        try {
            // Mock project analytics data
            const activeProjectsEl = document.getElementById('active-projects');
            const productiveTimeEl = document.getElementById('productive-time');
            const taskCompletionEl = document.getElementById('task-completion');
            
            if (activeProjectsEl) activeProjectsEl.textContent = '3';
            if (productiveTimeEl) productiveTimeEl.textContent = '2-4 PM';
            if (taskCompletionEl) taskCompletionEl.textContent = '92%';
        } catch (error) {
            console.warn('Could not load project analytics:', error);
        }
    }

    async getDailyBreakdown() {
        try {
            // Get the start of the current week (Monday)
            const now = new Date();
            const startOfWeek = new Date(now);
            startOfWeek.setDate(now.getDate() - now.getDay() + 1); // Monday
            startOfWeek.setHours(0, 0, 0, 0);
            
            const dailyHours = [];
            
            for (let i = 0; i < 7; i++) {
                const date = new Date(startOfWeek);
                date.setDate(startOfWeek.getDate() + i);
                
                // Get work day for this date
                const workDay = this.trackingService.getWorkDayFromDate(date);
                const stats = await this.trackingService.getWorkDayStats(workDay);
                
                dailyHours.push(stats ? stats.totalTime : 0);
            }
            
            return dailyHours;
        } catch (error) {
            console.warn('Could not get daily breakdown:', error);
            return new Array(7).fill(0);
        }
    }

    formatHours(milliseconds) {
        if (!milliseconds || milliseconds === 0) return '0h';
        
        const hours = Math.floor(milliseconds / (1000 * 60 * 60));
        const minutes = Math.floor((milliseconds % (1000 * 60 * 60)) / (1000 * 60));
        
        if (hours === 0 && minutes === 0) return '0h';
        if (hours === 0) return `${minutes}m`;
        if (minutes === 0) return `${hours}h`;
        
        return `${hours}h ${minutes}m`;
    }

    updateSummary(workDayStats = null) {
        if (workDayStats) {
            this.totalTimeElement.textContent = TimeTrackingService.formatTime(workDayStats.totalTime);
            this.sessionsElement.textContent = workDayStats.sessionsCount.toString();
        }
        
        // Update screenshot info from localStorage
        const lastScreenshot = localStorage.getItem('lastScreenshot');
        if (lastScreenshot) {
            const screenshotTime = new Date(lastScreenshot);
            this.lastScreenshotElement.textContent = screenshotTime.toLocaleTimeString();
        }
    }

    updateScreenshotStatus(isActive) {
        const statusDot = this.screenshotStatus.querySelector('.status-dot');
        const statusText = this.screenshotStatus.querySelector('span:last-child');
        
        if (isActive) {
            statusDot.classList.remove('inactive');
            statusDot.classList.add('active');
            statusText.textContent = 'Monitoring: Active';
        } else {
            statusDot.classList.remove('active');
            statusDot.classList.add('inactive');
            statusText.textContent = 'Monitoring: Inactive';
        }
    }

    startScreenshotMonitoring() {
        // Simulate screenshot taking every 5-10 minutes while tracking
        setInterval(() => {
            const status = this.trackingService.getStatus();
            if (status.isTracking && status.isActive) {
                this.takeScreenshot();
            }
        }, 5 * 60 * 1000 + Math.random() * 5 * 60 * 1000); // 5-10 minutes
    }

    takeScreenshot() {
        // Simulate screenshot capture
        const timestamp = new Date().toISOString();
        localStorage.setItem('lastScreenshot', timestamp);
        
        // Update UI
        this.updateSummary();
        
        // Show notification with shutter sound simulation
        this.showNotification(
            'Screenshot Captured',
            'Activity screenshot has been taken',
            'info'
        );
        
        // Simulate shutter sound
        this.playShutterSound();
        
        // Add screenshot to current session
        if (this.trackingService.currentSession) {
            this.trackingService.currentSession.screenshots.push({
                timestamp: timestamp,
                estTime: this.trackingService.getESTTime()
            });
        }
    }

    playShutterSound() {
        // Create a simple beep sound using Web Audio API
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
            gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
            
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.1);
        } catch (e) {
            console.log('Audio not supported');
        }
    }

    showNotification(title, message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        
        notification.innerHTML = `
            <div class="notification-title">${title}</div>
            <div class="notification-message">${message}</div>
        `;
        
        this.notificationArea.appendChild(notification);
        
        // Auto remove after 5 seconds
        setTimeout(() => {
            notification.style.opacity = '0';
            setTimeout(() => {
                if (notification.parentNode) {
                    this.notificationArea.removeChild(notification);
                }
            }, 300);
        }, 5000);
    }

    // Public method to get current tracking data
    getCurrentTrackingData() {
        const status = this.trackingService.getStatus();
        return {
            isTracking: status.isTracking,
            isActive: status.isActive,
            currentSession: status.currentSession,
            elapsedTime: status.currentElapsed,
            currentTask: this.currentTask,
            workDay: status.workDay,
            estTime: status.estTime
        };
    }
}

// Initialize the time tracker when the page loads
document.addEventListener('DOMContentLoaded', () => {
    // Wait for TimeTrackingService to be available
    if (window.TimeTrackingService) {
        window.timeTracker = new TimeTracker();
        
        // Make it available for external integration
        window.GuardianTimeTracker = {
            getInstance: () => window.timeTracker,
            getCurrentData: () => window.timeTracker.getCurrentTrackingData(),
            getTrackingService: () => window.TimeTrackingService,
            startTracking: (task) => {
                if (task) {
                    document.getElementById('task-description').value = task;
                }
                window.timeTracker.startTracking();
            },
            stopTracking: () => window.timeTracker.stopTracking(),
            pauseTracking: () => window.timeTracker.pauseTracking(),
            resumeTracking: () => window.timeTracker.resumeTracking()
        };
        
        console.log('Guardian Time Tracker initialized successfully with TimeTrackingService!');
    } else {
        console.error('TimeTrackingService not available. Please include time-tracking-service.js first.');
    }
});