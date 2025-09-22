/**
 * Time Tracking Analytics Component
 * Creates horizontal bar charts and statistics for different time periods
 * Week starts from Monday, includes current week, monthly, yearly, and lifetime totals
 */

class TimeTrackingAnalytics {
    constructor(containerId, trackingService) {
        this.containerId = containerId;
        this.trackingService = trackingService;
        this.currentPeriod = 'current_week';
        this.chart = null;
        
        this.initializeAnalytics();
    }

    async initializeAnalytics() {
        const container = document.getElementById(this.containerId);
        if (!container) {
            console.error('Analytics container not found:', this.containerId);
            return;
        }

        // Create analytics HTML structure
        container.innerHTML = this.createAnalyticsHTML();
        
        // Setup event listeners
        this.setupEventListeners();
        
        // Load initial data
        await this.loadAnalytics(this.currentPeriod);
    }

    createAnalyticsHTML() {
        return `
            <div class="time-tracking-analytics">
                <!-- Period Selector -->
                <div class="analytics-header mb-6">
                    <h3 class="text-xl font-bold text-gray-800 mb-4">Time Tracking Analytics</h3>
                    <div class="period-selector flex flex-wrap gap-2">
                        <button class="period-btn" data-period="today">Today</button>
                        <button class="period-btn active" data-period="current_week">Current Week</button>
                        <button class="period-btn" data-period="this_month">This Month</button>
                        <button class="period-btn" data-period="past_month">Past Month</button>
                        <button class="period-btn" data-period="this_year">This Year</button>
                        <button class="period-btn" data-period="past_year">Past Year</button>
                        <button class="period-btn" data-period="lifetime">Lifetime</button>
                    </div>
                </div>

                <!-- Summary Stats -->
                <div class="analytics-summary grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <div class="stat-card bg-blue-50 p-4 rounded-lg border border-blue-200">
                        <div class="stat-value text-2xl font-bold text-blue-600" id="total-hours-stat">0h</div>
                        <div class="stat-label text-sm text-blue-700">Total Hours</div>
                    </div>
                    <div class="stat-card bg-green-50 p-4 rounded-lg border border-green-200">
                        <div class="stat-value text-2xl font-bold text-green-600" id="work-days-stat">0</div>
                        <div class="stat-label text-sm text-green-700">Work Days</div>
                    </div>
                    <div class="stat-card bg-orange-50 p-4 rounded-lg border border-orange-200">
                        <div class="stat-value text-2xl font-bold text-orange-600" id="avg-daily-stat">0h</div>
                        <div class="stat-label text-sm text-orange-700">Avg/Day</div>
                    </div>
                    <div class="stat-card bg-red-50 p-4 rounded-lg border border-red-200">
                        <div class="stat-value text-2xl font-bold text-red-600" id="overtime-stat">0h</div>
                        <div class="stat-label text-sm text-red-700">Overtime</div>
                    </div>
                </div>

                <!-- Horizontal Bar Chart -->
                <div class="analytics-chart bg-white p-6 rounded-lg shadow-md border border-gray-200">
                    <h4 class="text-lg font-semibold text-gray-800 mb-4" id="chart-title">Daily Hours - Current Week</h4>
                    <div class="chart-container" id="chart-container">
                        <div class="loading-state text-center py-8 text-gray-500">
                            <i class="fas fa-spinner fa-spin mr-2"></i>Loading analytics...
                        </div>
                    </div>
                </div>

                <!-- Detailed Breakdown -->
                <div class="analytics-breakdown bg-white p-6 rounded-lg shadow-md border border-gray-200 mt-6">
                    <h4 class="text-lg font-semibold text-gray-800 mb-4">Period Breakdown</h4>
                    <div class="breakdown-content" id="breakdown-content">
                        <div class="loading-state text-center py-4 text-gray-500">Loading breakdown...</div>
                    </div>
                </div>
            </div>

            <style>
            .period-btn {
                padding: 8px 16px;
                border: 2px solid #e5e7eb;
                border-radius: 8px;
                background: white;
                color: #6b7280;
                font-size: 14px;
                font-weight: 500;
                cursor: pointer;
                transition: all 0.2s;
            }

            .period-btn:hover {
                border-color: #3b82f6;
                color: #3b82f6;
            }

            .period-btn.active {
                border-color: #3b82f6;
                background: #3b82f6;
                color: white;
            }

            .chart-bar {
                display: flex;
                align-items: center;
                margin-bottom: 12px;
                padding: 8px;
                background: #f9fafb;
                border-radius: 6px;
                border: 1px solid #e5e7eb;
            }

            .chart-bar-label {
                width: 100px;
                font-size: 14px;
                font-weight: 500;
                color: #374151;
                flex-shrink: 0;
            }

            .chart-bar-container {
                flex: 1;
                height: 24px;
                background: #e5e7eb;
                border-radius: 12px;
                margin: 0 12px;
                position: relative;
                overflow: hidden;
            }

            .chart-bar-fill {
                height: 100%;
                border-radius: 12px;
                transition: width 0.5s ease;
                position: relative;
            }

            .chart-bar-fill.regular {
                background: linear-gradient(90deg, #10b981, #34d399);
            }

            .chart-bar-fill.overtime {
                background: linear-gradient(90deg, #f59e0b, #fbbf24);
            }

            .chart-bar-fill.high-overtime {
                background: linear-gradient(90deg, #ef4444, #f87171);
            }

            .chart-bar-value {
                width: 60px;
                text-align: right;
                font-size: 14px;
                font-weight: 600;
                color: #374151;
                flex-shrink: 0;
            }

            .breakdown-item {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 12px;
                border-bottom: 1px solid #e5e7eb;
            }

            .breakdown-item:last-child {
                border-bottom: none;
            }

            .breakdown-label {
                font-weight: 500;
                color: #374151;
            }

            .breakdown-value {
                font-weight: 600;
                color: #1f2937;
            }

            .overtime-indicator {
                color: #ef4444;
                font-weight: 600;
            }
            </style>
        `;
    }

    setupEventListeners() {
        // Period selector buttons
        const periodButtons = document.querySelectorAll('.period-btn');
        periodButtons.forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const period = e.target.dataset.period;
                
                // Update active state
                periodButtons.forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                
                // Load new period data
                this.currentPeriod = period;
                await this.loadAnalytics(period);
            });
        });
    }

    async loadAnalytics(period) {
        try {
            console.log('Loading analytics for period:', period);
            
            // Show loading state
            this.showLoadingState();
            
            // Get analytics data from tracking service
            const analytics = await this.trackingService.getAnalytics(period);
            console.log('Analytics data:', analytics);
            
            // Update UI with data
            this.updateSummaryStats(analytics);
            this.updateChart(analytics);
            this.updateBreakdown(analytics);
            
        } catch (error) {
            console.error('Failed to load analytics:', error);
            this.showErrorState();
        }
    }

    showLoadingState() {
        const chartContainer = document.getElementById('chart-container');
        const breakdownContent = document.getElementById('breakdown-content');
        
        if (chartContainer) {
            chartContainer.innerHTML = '<div class="loading-state text-center py-8 text-gray-500"><i class="fas fa-spinner fa-spin mr-2"></i>Loading analytics...</div>';
        }
        
        if (breakdownContent) {
            breakdownContent.innerHTML = '<div class="loading-state text-center py-4 text-gray-500">Loading breakdown...</div>';
        }
    }

    showErrorState() {
        const chartContainer = document.getElementById('chart-container');
        const breakdownContent = document.getElementById('breakdown-content');
        
        if (chartContainer) {
            chartContainer.innerHTML = '<div class="error-state text-center py-8 text-red-500"><i class="fas fa-exclamation-triangle mr-2"></i>Error loading analytics</div>';
        }
        
        if (breakdownContent) {
            breakdownContent.innerHTML = '<div class="error-state text-center py-4 text-red-500">Error loading breakdown</div>';
        }
    }

    updateSummaryStats(analytics) {
        const totalHoursElement = document.getElementById('total-hours-stat');
        const workDaysElement = document.getElementById('work-days-stat');
        const avgDailyElement = document.getElementById('avg-daily-stat');
        const overtimeElement = document.getElementById('overtime-stat');

        if (totalHoursElement) {
            totalHoursElement.textContent = this.formatHoursShort(analytics.totalHours);
        }

        if (workDaysElement) {
            workDaysElement.textContent = analytics.workDaysCount.toString();
        }

        if (avgDailyElement) {
            const avgHours = analytics.averagePerDay / (1000 * 60 * 60);
            avgDailyElement.textContent = this.formatHoursShort(avgHours);
        }

        if (overtimeElement) {
            overtimeElement.textContent = this.formatHoursShort(analytics.totalOvertimeHours);
        }
    }

    updateChart(analytics) {
        const chartContainer = document.getElementById('chart-container');
        const chartTitle = document.getElementById('chart-title');
        
        if (!chartContainer || !analytics.dailyBreakdown) return;

        // Update chart title
        const periodTitles = {
            'current_week': 'Daily Hours - Current Week',
            'this_month': 'Daily Hours - This Month',
            'this_year': 'Monthly Hours - This Year',
            'past_year': 'Monthly Hours - Past Year',
            'lifetime': 'Monthly Hours - Lifetime'
        };
        
        if (chartTitle) {
            chartTitle.textContent = periodTitles[this.currentPeriod] || 'Time Tracking Chart';
        }

        // Find max hours for scaling
        const maxHours = Math.max(...analytics.dailyBreakdown.map(day => day.totalTime / (1000 * 60 * 60)), 8);
        const scale = Math.max(maxHours, 10); // Minimum scale of 10 hours

        // Create chart bars
        let chartHTML = '';
        
        if (analytics.dailyBreakdown.length === 0) {
            chartHTML = '<div class="no-data text-center py-8 text-gray-500">No data available for this period</div>';
        } else {
            analytics.dailyBreakdown.forEach(day => {
                const totalHours = day.totalTime / (1000 * 60 * 60);
                const regularHours = Math.min(totalHours, 8);
                const overtimeHours = Math.max(totalHours - 8, 0);
                
                const regularWidth = (regularHours / scale) * 100;
                const overtimeWidth = (overtimeHours / scale) * 100;
                
                let barClass = 'regular';
                if (overtimeHours > 0) {
                    barClass = overtimeHours > 2 ? 'high-overtime' : 'overtime';
                }
                
                const label = this.formatDateLabel(day.date);
                const value = this.formatHoursShort(totalHours);
                
                chartHTML += `
                    <div class="chart-bar">
                        <div class="chart-bar-label">${label}</div>
                        <div class="chart-bar-container">
                            <div class="chart-bar-fill ${barClass}" style="width: ${Math.min(regularWidth + overtimeWidth, 100)}%"></div>
                        </div>
                        <div class="chart-bar-value">${value}</div>
                    </div>
                `;
            });
        }

        chartContainer.innerHTML = chartHTML;
    }

    updateBreakdown(analytics) {
        const breakdownContent = document.getElementById('breakdown-content');
        if (!breakdownContent) return;

        const breakdown = [
            { label: 'Total Sessions', value: analytics.totalSessions.toString() },
            { label: 'Work Days', value: analytics.workDaysCount.toString() },
            { label: 'Average per Session', value: this.formatTime(analytics.averagePerSession) },
            { label: 'Average per Day', value: this.formatTime(analytics.averagePerDay) },
            { label: 'Longest Session', value: this.formatTime(analytics.longestSession) },
            { label: 'Shortest Session', value: this.formatTime(analytics.shortestSession) }
        ];

        let breakdownHTML = '';
        breakdown.forEach(item => {
            breakdownHTML += `
                <div class="breakdown-item">
                    <div class="breakdown-label">${item.label}</div>
                    <div class="breakdown-value">${item.value}</div>
                </div>
            `;
        });

        // Add overtime warning if significant
        if (analytics.totalOvertimeHours > 0) {
            breakdownHTML += `
                <div class="breakdown-item">
                    <div class="breakdown-label">Total Overtime</div>
                    <div class="breakdown-value overtime-indicator">${this.formatHoursShort(analytics.totalOvertimeHours)}</div>
                </div>
            `;
        }

        breakdownContent.innerHTML = breakdownHTML;
    }

    formatDateLabel(dateString) {
        const date = new Date(dateString);
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        if (date.toDateString() === today.toDateString()) {
            return 'Today';
        } else if (date.toDateString() === yesterday.toDateString()) {
            return 'Yesterday';
        } else if (this.currentPeriod === 'current_week') {
            return date.toLocaleDateString('en-US', { weekday: 'short' });
        } else if (this.currentPeriod === 'this_month') {
            return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        } else {
            return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
        }
    }

    formatHoursShort(hours) {
        if (hours < 1) {
            const minutes = Math.round(hours * 60);
            return `${minutes}m`;
        } else {
            const h = Math.floor(hours);
            const m = Math.round((hours - h) * 60);
            if (m === 0) {
                return `${h}h`;
            } else {
                return `${h}h ${m}m`;
            }
        }
    }

    formatTime(milliseconds) {
        if (milliseconds === 0) return '0m';
        
        const hours = milliseconds / (1000 * 60 * 60);
        return this.formatHoursShort(hours);
    }

    // Public method to refresh analytics
    async refresh() {
        await this.loadAnalytics(this.currentPeriod);
    }

    // Public method to destroy component
    destroy() {
        const container = document.getElementById(this.containerId);
        if (container) {
            container.innerHTML = '';
        }
    }
}

// Export for use
window.TimeTrackingAnalytics = TimeTrackingAnalytics;