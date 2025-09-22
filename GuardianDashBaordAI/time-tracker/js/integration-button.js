// Time Tracker Integration Button JavaScript

class TimeTrackerButton {
    constructor(element, options = {}) {
        this.element = element;
        this.options = {
            size: 'medium',
            variant: 'primary',
            showTimer: true,
            autoUpdate: true,
            ...options
        };
        
        this.isTracking = false;
        this.isPaused = false;
        this.currentTime = '00:00:00';
        
        this.init();
        
        if (this.options.autoUpdate) {
            this.startAutoUpdate();
        }
    }

    init() {
        this.element.classList.add('time-tracker-button');
        this.element.classList.add(this.options.size);
        this.element.classList.add(this.options.variant);
        
        this.updateButton();
        this.setupEventListeners();
    }

    setupEventListeners() {
        this.element.addEventListener('click', (e) => {
            e.preventDefault();
            this.handleClick();
        });
    }

    handleClick() {
        // Navigate to time tracker page
        if (window.loadContent) {
            window.loadContent('Time Tracker');
        } else {
            // Fallback: open in new tab/window
            window.open('time-tracker/time-tracker.html', '_blank');
        }
    }

    updateButton() {
        let icon, text, classes = [];

        if (this.isTracking && !this.isPaused) {
            icon = '<i class="fas fa-pause time-tracker-icon"></i>';
            text = this.options.showTimer ? 
                `<span class="time-tracker-timer">${this.currentTime}</span>` : 
                'Tracking...';
            classes.push('tracking');
        } else if (this.isPaused) {
            icon = '<i class="fas fa-play time-tracker-icon"></i>';
            text = this.options.showTimer ? 
                `<span class="time-tracker-timer">${this.currentTime}</span>` : 
                'Paused';
            classes.push('paused');
        } else {
            icon = '<i class="fas fa-clock time-tracker-icon"></i>';
            text = 'Time Tracker';
        }

        // Remove previous state classes
        this.element.classList.remove('tracking', 'paused');
        
        // Add current state classes
        classes.forEach(cls => this.element.classList.add(cls));

        this.element.innerHTML = `${icon} ${text}`;
    }

    updateStatus(trackingData) {
        this.isTracking = trackingData.isTracking || false;
        this.isPaused = trackingData.isPaused || false;
        this.currentTime = trackingData.currentTime || '00:00:00';
        
        this.updateButton();
    }

    startAutoUpdate() {
        // Check for time tracker status every 5 seconds
        setInterval(() => {
            this.checkTimeTrackerStatus();
        }, 5000);
    }

    checkTimeTrackerStatus() {
        // Try to get status from localStorage (shared between pages)
        const status = localStorage.getItem('timeTrackerStatus');
        if (status) {
            try {
                const trackingData = JSON.parse(status);
                this.updateStatus(trackingData);
            } catch (e) {
                console.warn('Failed to parse time tracker status');
            }
        }
    }
}

// Time Tracker Widget Class
class TimeTrackerWidget {
    constructor(container, options = {}) {
        this.container = container;
        this.options = {
            showQuickActions: true,
            ...options
        };
        
        this.init();
    }

    init() {
        this.render();
        this.setupEventListeners();
        this.startAutoUpdate();
    }

    render() {
        this.container.innerHTML = `
            <div class="time-tracker-widget">
                <h3>
                    <i class="fas fa-clock"></i>
                    Time Tracker
                </h3>
                
                <div class="time-tracker-status">
                    <div class="status-indicator" id="widget-status-dot"></div>
                    <div class="status-text" id="widget-status-text">Not tracking</div>
                </div>
                
                <button class="time-tracker-button" id="widget-main-button">
                    <i class="fas fa-clock"></i>
                    Open Time Tracker
                </button>
                
                ${this.options.showQuickActions ? `
                    <div class="quick-actions">
                        <button class="quick-action-btn" id="quick-start-btn">
                            <i class="fas fa-play"></i> Quick Start
                        </button>
                        <button class="quick-action-btn" id="quick-stop-btn">
                            <i class="fas fa-stop"></i> Stop
                        </button>
                    </div>
                ` : ''}
            </div>
        `;
    }

    setupEventListeners() {
        const mainButton = this.container.querySelector('#widget-main-button');
        const quickStartBtn = this.container.querySelector('#quick-start-btn');
        const quickStopBtn = this.container.querySelector('#quick-stop-btn');

        mainButton?.addEventListener('click', () => {
            if (window.loadContent) {
                window.loadContent('Time Tracker');
            } else {
                window.open('time-tracker/time-tracker.html', '_blank');
            }
        });

        quickStartBtn?.addEventListener('click', () => {
            this.quickStart();
        });

        quickStopBtn?.addEventListener('click', () => {
            this.quickStop();
        });
    }

    quickStart() {
        // Store quick start request
        localStorage.setItem('timeTrackerQuickStart', 'true');
        
        // Navigate to time tracker
        if (window.loadContent) {
            window.loadContent('Time Tracker');
        } else {
            window.open('time-tracker/time-tracker.html', '_blank');
        }
    }

    quickStop() {
        // Store quick stop request
        localStorage.setItem('timeTrackerQuickStop', 'true');
        
        // Try to communicate with time tracker if it's in an iframe
        const iframe = document.querySelector('iframe[title="Guardian Time Tracker"]');
        if (iframe && iframe.contentWindow && iframe.contentWindow.GuardianTimeTracker) {
            iframe.contentWindow.GuardianTimeTracker.stopTracking();
        }
    }

    updateStatus(trackingData) {
        const statusDot = this.container.querySelector('#widget-status-dot');
        const statusText = this.container.querySelector('#widget-status-text');
        const mainButton = this.container.querySelector('#widget-main-button');

        if (!statusDot || !statusText || !mainButton) return;

        // Update status indicator
        statusDot.classList.remove('active', 'paused');
        
        if (trackingData.isTracking && !trackingData.isPaused) {
            statusDot.classList.add('active');
            statusText.textContent = `Tracking: ${trackingData.currentTime || '00:00:00'}`;
            mainButton.innerHTML = '<i class="fas fa-pause"></i> View Tracker';
        } else if (trackingData.isPaused) {
            statusDot.classList.add('paused');
            statusText.textContent = `Paused: ${trackingData.currentTime || '00:00:00'}`;
            mainButton.innerHTML = '<i class="fas fa-play"></i> Resume';
        } else {
            statusText.textContent = 'Not tracking';
            mainButton.innerHTML = '<i class="fas fa-clock"></i> Start Tracking';
        }
    }

    startAutoUpdate() {
        setInterval(() => {
            const status = localStorage.getItem('timeTrackerStatus');
            if (status) {
                try {
                    const trackingData = JSON.parse(status);
                    this.updateStatus(trackingData);
                } catch (e) {
                    console.warn('Failed to parse time tracker status');
                }
            }
        }, 1000); // Update every second for real-time display
    }
}

// Auto-initialize time tracker buttons and widgets
document.addEventListener('DOMContentLoaded', function() {
    // Initialize all time tracker buttons
    document.querySelectorAll('.time-tracker-button:not(.manual-init)').forEach(element => {
        new TimeTrackerButton(element);
    });

    // Initialize all time tracker widgets
    document.querySelectorAll('.time-tracker-widget-container').forEach(container => {
        new TimeTrackerWidget(container);
    });
});

// Export for manual initialization
window.TimeTrackerButton = TimeTrackerButton;
window.TimeTrackerWidget = TimeTrackerWidget;