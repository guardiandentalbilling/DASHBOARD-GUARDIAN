/**
 * Profile Time Tracking Integration
 * Integrates with TimeTrackingService to show real-time updates in My Profile page
 */

class ProfileTimeTracker {
    constructor() {
        this.trackingService = null;
        this.updateInterval = null;
        this.messageListener = null;
        this.isInitialized = false;
        
        this.initializeElements();
        this.setupTimeTrackingService();
        this.setupMessageListener();
        this.setupWindowEventListener();
        this.startRealtimeUpdates();
    }

    initializeElements() {
        this.statusElement = document.getElementById('attendance-status-profile');
        this.workingHoursElement = document.getElementById('working-hours-profile');
        this.overtimeElement = document.getElementById('overtime-hours-profile');
        this.checkinBtn = document.getElementById('checkin-btn-profile');
        this.checkoutBtn = document.getElementById('checkout-btn-profile');
        
        console.log('ProfileTimeTracker: Elements initialized', {
            status: !!this.statusElement,
            hours: !!this.workingHoursElement,
            overtime: !!this.overtimeElement,
            checkin: !!this.checkinBtn,
            checkout: !!this.checkoutBtn
        });
    }

    setupTimeTrackingService() {
        // Try to access TimeTrackingService
        if (window.TimeTrackingService) {
            console.log('ProfileTimeTracker: TimeTrackingService found');
            this.trackingService = window.TimeTrackingService;
            this.trackingService.setEmployeeId(this.getCurrentEmployeeId());
            this.setupTrackingServiceListeners();
            this.isInitialized = true;
            this.updateCurrentStatus();
        } else {
            console.log('ProfileTimeTracker: Loading TimeTrackingService');
            this.loadTimeTrackingService();
        }
    }

    loadTimeTrackingService() {
        const script = document.createElement('script');
        script.src = 'time-tracker/js/time-tracking-service.js';
        script.onload = () => {
            console.log('ProfileTimeTracker: TimeTrackingService loaded');
            this.trackingService = window.TimeTrackingService;
            this.trackingService.setEmployeeId(this.getCurrentEmployeeId());
            this.setupTrackingServiceListeners();
            this.isInitialized = true;
            this.updateCurrentStatus();
        };
        script.onerror = () => {
            console.error('ProfileTimeTracker: Failed to load TimeTrackingService');
        };
        document.head.appendChild(script);
    }

    getCurrentEmployeeId() {
        return localStorage.getItem('currentEmployeeId') || '64a7c8b2c3d4e5f6789012ab';
    }

    setupTrackingServiceListeners() {
        if (!this.trackingService) return;

        console.log('ProfileTimeTracker: Setting up service listeners');
        
        this.trackingService.addEventListener((eventType, data) => {
            console.log('ProfileTimeTracker: Received event', eventType, data);
            
            switch (eventType) {
                case 'tracking_started':
                case 'tracking_resumed':
                    this.updateTrackingStatus('Tracking Active', 'text-green-600');
                    this.enableCheckoutButton();
                    this.updateTimeDisplay({ elapsed: data.session?.totalElapsed || 0 });
                    break;
                case 'tracking_paused':
                    this.updateTrackingStatus('Paused', 'text-yellow-600');
                    this.updateTimeDisplay({ elapsed: data.totalElapsed || 0 });
                    break;
                case 'tracking_stopped':
                    this.updateTrackingStatus('Not Tracking', 'text-gray-600');
                    this.enableCheckinButton();
                    if (data.workDayStats) {
                        this.updateWorkDayStats(data.workDayStats);
                    }
                    break;
                case 'time_update':
                    this.updateTimeDisplay(data);
                    break;
            }
        });
    }

    setupWindowEventListener() {
        // Listen for custom events from TimeTrackingService
        window.addEventListener('timeTrackingEvent', (event) => {
            console.log('ProfileTimeTracker: Custom event received', event.detail);
            const { eventType, data } = event.detail;
            
            switch (eventType) {
                case 'tracking_started':
                case 'tracking_resumed':
                    this.updateTrackingStatus('Tracking Active', 'text-green-600');
                    this.enableCheckoutButton();
                    break;
                case 'tracking_paused':
                    this.updateTrackingStatus('Paused', 'text-yellow-600');
                    break;
                case 'tracking_stopped':
                    this.updateTrackingStatus('Not Tracking', 'text-gray-600');
                    this.enableCheckinButton();
                    break;
                case 'time_update':
                    this.updateTimeDisplay(data);
                    break;
            }
        });
    }

    setupMessageListener() {
        // Listen for messages from time tracker iframe and other sources
        this.messageListener = (event) => {
            console.log('ProfileTimeTracker: Message received', event.data);
            
            if (event.data && (event.data.source === 'time_tracker' || event.data.source === 'time_tracking_service')) {
                switch (event.data.event) {
                    case 'tracking_started':
                    case 'tracking_resumed':
                        this.updateTrackingStatus('Tracking Active', 'text-green-600');
                        this.enableCheckoutButton();
                        break;
                    case 'tracking_paused':
                        this.updateTrackingStatus('Paused', 'text-yellow-600');
                        break;
                    case 'tracking_stopped':
                        this.updateTrackingStatus('Not Tracking', 'text-gray-600');
                        this.enableCheckinButton();
                        if (event.data.data && event.data.data.workDayStats) {
                            this.updateWorkDayStats(event.data.data.workDayStats);
                        }
                        break;
                    case 'time_update':
                        this.updateTimeDisplay(event.data.data);
                        break;
                }
            }
        };

        window.addEventListener('message', this.messageListener);
    }

    updateCurrentStatus() {
        if (!this.trackingService || !this.isInitialized) {
            console.log('ProfileTimeTracker: Service not ready for status update');
            return;
        }

        console.log('ProfileTimeTracker: Updating current status');
        
        const status = this.trackingService.getStatus();
        console.log('ProfileTimeTracker: Current status', status);
        
        const { isTracking, isActive, currentElapsed, workDay } = status;

        if (isTracking) {
            if (isActive) {
                this.updateTrackingStatus('Tracking Active', 'text-green-600');
                this.enableCheckoutButton();
            } else {
                this.updateTrackingStatus('Paused', 'text-yellow-600');
                this.enableCheckoutButton();
            }
            
            // Update time display
            this.updateTimeDisplay({ elapsed: currentElapsed });
        } else {
            this.updateTrackingStatus('Not Tracking', 'text-gray-600');
            this.enableCheckinButton();
            this.updateTimeDisplay({ elapsed: 0 });
        }

        // Load work day stats
        if (workDay) {
            this.loadWorkDayStats(workDay);
        }
    }

    updateTrackingStatus(status, className) {
        console.log('ProfileTimeTracker: Updating status', status, className);
        
        if (this.statusElement) {
            this.statusElement.textContent = status;
            this.statusElement.className = `text-2xl font-bold ${className}`;
        }
    }

    updateTimeDisplay(data) {
        const { elapsed } = data;
        const totalHours = elapsed / (1000 * 60 * 60);
        const regularHours = Math.min(totalHours, 8);
        const overtimeHours = Math.max(totalHours - 8, 0);

        console.log('ProfileTimeTracker: Updating time display', {
            elapsed,
            totalHours,
            overtimeHours
        });

        if (this.workingHoursElement) {
            this.workingHoursElement.textContent = this.formatHours(totalHours);
        }

        if (this.overtimeElement) {
            this.overtimeElement.textContent = this.formatHours(overtimeHours);
            
            // Change color if overtime
            if (overtimeHours > 0) {
                this.overtimeElement.className = 'text-2xl font-bold text-red-600';
            } else {
                this.overtimeElement.className = 'text-2xl font-bold text-orange-600';
            }
        }
    }

    async loadWorkDayStats(workDay) {
        if (!this.trackingService) return;

        try {
            const workDayStats = await this.trackingService.getWorkDayStats(workDay);
            this.updateWorkDayStats(workDayStats);
        } catch (error) {
            console.warn('Could not load work day stats:', error);
        }
    }

    updateWorkDayStats(workDayStats) {
        if (!workDayStats) return;

        console.log('ProfileTimeTracker: Updating work day stats', workDayStats);

        // Update total hours for the day
        if (this.workingHoursElement) {
            this.workingHoursElement.textContent = this.formatHours(workDayStats.totalHours);
        }

        // Update overtime
        if (this.overtimeElement) {
            this.overtimeElement.textContent = this.formatHours(workDayStats.overtimeHours);
            
            if (workDayStats.overtimeHours > 0) {
                this.overtimeElement.className = 'text-2xl font-bold text-red-600';
            } else {
                this.overtimeElement.className = 'text-2xl font-bold text-orange-600';
            }
        }

        // Show notification if significant overtime
        if (workDayStats.overtimeHours > 2) {
            this.showOvertimeNotification(workDayStats.overtimeHours);
        }
    }

    enableCheckinButton() {
        console.log('ProfileTimeTracker: Enabling check-in button');
        
        if (this.checkinBtn && this.checkoutBtn) {
            this.checkinBtn.disabled = false;
            this.checkoutBtn.disabled = true;
            this.checkinBtn.classList.remove('bg-gray-400');
            this.checkinBtn.classList.add('bg-green-500');
            this.checkoutBtn.classList.add('bg-gray-400');
            this.checkoutBtn.classList.remove('bg-red-500');
        }
    }

    enableCheckoutButton() {
        console.log('ProfileTimeTracker: Enabling check-out button');
        
        if (this.checkinBtn && this.checkoutBtn) {
            this.checkinBtn.disabled = true;
            this.checkoutBtn.disabled = false;
            this.checkinBtn.classList.add('bg-gray-400');
            this.checkinBtn.classList.remove('bg-green-500');
            this.checkoutBtn.classList.remove('bg-gray-400');
            this.checkoutBtn.classList.add('bg-red-500');
        }
    }

    startRealtimeUpdates() {
        // Update every second when tracking
        this.updateInterval = setInterval(() => {
            if (this.trackingService && this.isInitialized) {
                const status = this.trackingService.getStatus();
                if (status.isTracking && status.isActive) {
                    this.updateTimeDisplay({ elapsed: status.currentElapsed });
                }
            }
        }, 1000);
        
        console.log('ProfileTimeTracker: Real-time updates started');
    }

    formatHours(hours) {
        const h = Math.floor(hours);
        const m = Math.floor((hours - h) * 60);
        return `${h}:${m.toString().padStart(2, '0')}`;
    }

    // Profile-specific check-in functionality
    async integratedCheckIn() {
        console.log('ProfileTimeTracker: Integrated check-in started');
        
        if (!this.trackingService || !this.isInitialized) {
            this.showNotification('Service Not Ready', 'Time tracking service is not available', 'error');
            return;
        }

        try {
            // Check if within work hours
            const status = this.trackingService.getStatus();
            if (!status.withinWorkHours) {
                throw new Error('Cannot start tracking outside work hours (5 PM - 4 AM EST)');
            }

            // Start via backend first if token exists
            const token = localStorage.getItem('authToken');
            if(token){
                try {
                    const resp = await fetch('/api/time-tracking/start', { method:'POST', headers:{ 'Content-Type':'application/json','Authorization':'Bearer '+token }, body: JSON.stringify({ taskDescription:'Work Session' }) });
                    if(!resp.ok){ console.warn('Backend start failed, using local service fallback'); }
                } catch(be){ console.warn('Backend start error', be); }
            }
            await this.trackingService.startTracking('Work Session');
            
            // Show success notification
            this.showNotification('Time Tracking Started', 'Your work session has begun!', 'success');
            
        } catch (error) {
            console.error('ProfileTimeTracker: Check-in failed', error);
            this.showNotification('Check-in Failed', error.message, 'error');
        }
    }

    async integratedCheckOut() {
        console.log('ProfileTimeTracker: Integrated check-out started');
        
        if (!this.trackingService || !this.isInitialized) {
            this.showNotification('Service Not Ready', 'Time tracking service is not available', 'error');
            return;
        }

        try {
            // Stop tracking (local) then sync backend stop with elapsed
            const result = await this.trackingService.stopTracking();
            const token = localStorage.getItem('authToken');
            if(token){
                try {
                    await fetch('/api/time-tracking/stop', { method:'POST', headers:{ 'Content-Type':'application/json','Authorization':'Bearer '+token }, body: JSON.stringify({ totalElapsed: result.session.totalElapsed }) });
                } catch(be){ console.warn('Backend stop failed', be); }
            }
            
            // Show completion notification with overtime info
            let message = `Total time: ${this.formatHours(result.session.totalElapsed / (1000 * 60 * 60))}`;
            if (result.workDayStats.overtimeHours > 0) {
                message += `\nOvertime: ${this.formatHours(result.workDayStats.overtimeHours)}`;
            }
            
            this.showNotification('Time Tracking Stopped', message, 'success');
            
        } catch (error) {
            console.error('ProfileTimeTracker: Check-out failed', error);
            this.showNotification('Check-out Failed', error.message, 'error');
        }
    }

    showOvertimeNotification(overtimeHours) {
        // Create notification
        const notification = document.createElement('div');
        notification.className = 'fixed top-4 right-4 bg-orange-500 text-white p-4 rounded-lg shadow-lg z-50 max-w-sm';
        notification.innerHTML = `
            <div class="flex items-center">
                <i class="fas fa-clock mr-2"></i>
                <div>
                    <div class="font-bold">Overtime Alert</div>
                    <div class="text-sm">You have worked ${overtimeHours.toFixed(1)} hours overtime today.</div>
                </div>
            </div>
        `;

        document.body.appendChild(notification);

        // Auto remove after 10 seconds
        setTimeout(() => {
            notification.style.opacity = '0';
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                if (notification.parentNode) {
                    document.body.removeChild(notification);
                }
            }, 300);
        }, 10000);
    }

    showNotification(title, message, type = 'info') {
        console.log('ProfileTimeTracker: Showing notification', title, message, type);
        
        const notification = document.createElement('div');
        notification.className = `fixed top-4 right-4 p-4 rounded-lg shadow-lg z-50 transition-all duration-300 max-w-sm ${
            type === 'success' ? 'bg-green-500 text-white' : 
            type === 'error' ? 'bg-red-500 text-white' : 
            'bg-blue-500 text-white'
        }`;
        
        notification.innerHTML = `
            <div class="font-bold">${title}</div>
            <div class="text-sm">${message}</div>
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.opacity = '0';
            setTimeout(() => {
                if (notification.parentNode) {
                    document.body.removeChild(notification);
                }
            }, 300);
        }, 5000);
    }

    destroy() {
        console.log('ProfileTimeTracker: Destroying instance');
        
        // Clean up
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
        }
        
        if (this.messageListener) {
            window.removeEventListener('message', this.messageListener);
        }
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    // Wait a bit for other scripts to load
    setTimeout(() => {
        window.profileTimeTracker = new ProfileTimeTracker();
        
        // Override check-in/check-out buttons if they exist
        const checkinBtn = document.getElementById('checkin-btn-profile');
        const checkoutBtn = document.getElementById('checkout-btn-profile');
        
        if (checkinBtn) {
            // Store original handler
            const originalClickHandler = checkinBtn.onclick;
            checkinBtn.onclick = () => window.profileTimeTracker.integratedCheckIn();
        }
        
        if (checkoutBtn) {
            // Store original handler  
            const originalClickHandler = checkoutBtn.onclick;
            checkoutBtn.onclick = () => window.profileTimeTracker.integratedCheckOut();
        }
        
    }, 1000);
});