// Global Quick Actions Component
class GlobalQuickActions {
    constructor(container, options = {}) {
        this.container = container;
        this.options = {
            showTitle: true,
            columns: 'auto',
            currentPage: null,
            ...options
        };
        
        this.navigationItems = [
            { name: 'Dashboard', icon: 'fas fa-tachometer-alt', class: 'dashboard' },
            { name: 'My Profile', icon: 'fas fa-user', class: 'profile' },
            { name: 'Tasks', icon: 'fas fa-tasks', class: 'tasks' },
            { name: 'Time Tracker', icon: 'fas fa-clock', class: 'time-tracker' },
            { name: 'Guardian AI', icon: 'fas fa-robot', class: 'ai' },
            { name: 'Eligibility Verification', icon: 'fas fa-check-circle', class: 'eligibility' },
            { name: 'Claims Follow Up', icon: 'fas fa-clipboard-list', class: 'claims' },
            { name: 'Create AR Comment', icon: 'fas fa-comment-medical', class: 'ar-comment' },
            { name: 'Speech Practice', icon: 'fas fa-microphone', class: 'speech' },
            { name: 'Guardian TTS', icon: 'fas fa-volume-up', class: 'tts' },
            { name: 'Phonetic Pronunciation', icon: 'fas fa-language', class: 'phonetic' },
            { name: 'Complaint / Suggestions', icon: 'fas fa-comment-alt', class: 'complaint' },
            { name: 'Request Leave', icon: 'fas fa-calendar-alt', class: 'leave' },
            { name: 'Request Loan', icon: 'fas fa-hand-holding-usd', class: 'loan' },
            { name: 'Submit Report', icon: 'fas fa-file-alt', class: 'report' },
            { name: 'Team Directory', icon: 'fas fa-users', class: 'team' }
        ];

        this.init();
    }

    init() {
        this.render();
        this.setupEventListeners();
        this.highlightCurrentPage();
    }

    render() {
        const title = this.options.showTitle ? `
            <h3>
                <i class="fas fa-th-large"></i>
                Quick Actions
            </h3>
        ` : '';

        const gridClass = this.options.columns !== 'auto' ? 
            `style="grid-template-columns: repeat(${this.options.columns}, 1fr);"` : '';

        this.container.innerHTML = `
            <div class="quick-actions-global">
                ${title}
                <div class="quick-actions-grid" ${gridClass}>
                    ${this.navigationItems.map(item => this.createButton(item)).join('')}
                </div>
            </div>
        `;
    }

    createButton(item) {
        return `
            <button class="quick-action-btn ${item.class}" data-page="${item.name}">
                <i class="${item.icon}"></i>
                <span>${item.name}</span>
            </button>
        `;
    }

    setupEventListeners() {
        const buttons = this.container.querySelectorAll('.quick-action-btn');
        buttons.forEach(button => {
            button.addEventListener('click', (e) => {
                e.preventDefault();
                const pageName = button.dataset.page;
                this.navigateToPage(pageName, button);
            });
        });
    }

    navigateToPage(pageName, buttonElement) {
        // Add pulse animation
        buttonElement.classList.add('pulse');
        setTimeout(() => {
            buttonElement.classList.remove('pulse');
        }, 600);

        try {
            // Method 1: Try parent window navigation (for iframe context)
            if (window.parent && window.parent.loadContent && window.parent !== window) {
                window.parent.loadContent(pageName);
                this.updateActiveButton(pageName);
                this.showNavigationFeedback(pageName, 'success');
                return;
            }

            // Method 2: Try direct window navigation (for main window context)
            if (window.loadContent) {
                window.loadContent(pageName);
                this.updateActiveButton(pageName);
                this.showNavigationFeedback(pageName, 'success');
                return;
            }

            // Method 3: PostMessage for iframe communication
            if (window.parent !== window) {
                window.parent.postMessage({
                    action: 'navigate',
                    page: pageName
                }, '*');
                this.updateActiveButton(pageName);
                this.showNavigationFeedback(pageName, 'info');
                return;
            }

            // Method 4: Fallback - simulate sidebar click
            const sidebarLink = document.querySelector(`[data-page="${pageName.toLowerCase().replace(/\s+/g, '-')}"]`);
            if (sidebarLink) {
                sidebarLink.click();
                return;
            }

            // Method 5: Ultimate fallback
            this.showNavigationFeedback(`Navigation to ${pageName} - Please use sidebar menu`, 'warning');
            
        } catch (error) {
            console.error('Navigation error:', error);
            this.showNavigationFeedback('Navigation failed - Please try again', 'error');
        }
    }

    updateActiveButton(pageName) {
        // Remove active class from all buttons
        this.container.querySelectorAll('.quick-action-btn').forEach(btn => {
            btn.classList.remove('active');
        });

        // Add active class to current button
        const activeButton = this.container.querySelector(`[data-page="${pageName}"]`);
        if (activeButton) {
            activeButton.classList.add('active');
        }
    }

    highlightCurrentPage() {
        if (this.options.currentPage) {
            this.updateActiveButton(this.options.currentPage);
        }
    }

    showNavigationFeedback(message, type = 'info') {
        // Create notification
        const notification = document.createElement('div');
        notification.className = `quick-action-notification ${type}`;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 12px 20px;
            border-radius: 8px;
            color: white;
            font-weight: 600;
            z-index: 1000;
            max-width: 300px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            transform: translateX(100%);
            transition: transform 0.3s ease;
            ${type === 'success' ? 'background: linear-gradient(135deg, #48bb78, #38a169);' : ''}
            ${type === 'error' ? 'background: linear-gradient(135deg, #e53e3e, #c53030);' : ''}
            ${type === 'warning' ? 'background: linear-gradient(135deg, #ed8936, #dd6b20);' : ''}
            ${type === 'info' ? 'background: linear-gradient(135deg, #4299e1, #3182ce);' : ''}
        `;
        
        notification.innerHTML = `
            <div style="display: flex; align-items: center; gap: 8px;">
                <i class="fas fa-${type === 'success' ? 'check' : type === 'error' ? 'times' : type === 'warning' ? 'exclamation' : 'info'}-circle"></i>
                <span>${message}</span>
            </div>
        `;

        document.body.appendChild(notification);

        // Animate in
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 100);

        // Auto remove
        setTimeout(() => {
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                if (notification.parentNode) {
                    document.body.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }

    // Public method to update current page
    setCurrentPage(pageName) {
        this.options.currentPage = pageName;
        this.highlightCurrentPage();
    }

    // Public method to add custom button
    addCustomButton(item) {
        this.navigationItems.push(item);
        this.render();
        this.setupEventListeners();
    }

    // Public method to remove button
    removeButton(pageName) {
        this.navigationItems = this.navigationItems.filter(item => item.name !== pageName);
        this.render();
        this.setupEventListeners();
    }
}

// Auto-initialize Quick Actions on pages with the container
document.addEventListener('DOMContentLoaded', function() {
    // Initialize all global quick actions containers
    document.querySelectorAll('.global-quick-actions-container').forEach(container => {
        const options = {
            showTitle: container.dataset.showTitle !== 'false',
            columns: container.dataset.columns || 'auto',
            currentPage: container.dataset.currentPage || null
        };
        new GlobalQuickActions(container, options);
    });
});

// Export for manual initialization
window.GlobalQuickActions = GlobalQuickActions;