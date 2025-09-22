// Reusable Sidebar Component Injection
// Usage: include this script and call window.renderSidebar({ active: 'Dashboard' })

(function(){
  const SIDEBAR_HTML = `
    <div id="sidebar-overlay" class="fixed inset-0 bg-gray-900 bg-opacity-50 z-40 md:hidden hidden"></div>
    <div id="sidebar" class="sidebar fixed inset-y-0 left-0 w-64 md:relative md:w-64 p-4 md:p-6 md:flex-shrink-0 flex flex-col h-full overflow-y-auto bg-white">
        <div class="flex items-center justify-between md:justify-center mb-6">
            <img src="https://guardiandentalbilling.com/wp-content/uploads/2025/02/Logo-250-x-150-px-1.png" alt="Company Logo" class="h-20 w-auto">
            <button id="close-sidebar" class="md:hidden text-gray-500 hover:text-gray-700 focus:outline-none">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
            </button>
        </div>
        <nav class="mt-8 flex-1">
            <ul class="space-y-2" id="sidebar-menu">
                <li><a href="/index.html" data-page="dashboard" data-link class="menu-item p-3 block rounded-lg font-medium transition-colors duration-200 hover:bg-blue-50">Dashboard</a></li>
                <li><a href="#" data-page="profile" data-link class="menu-item p-3 block rounded-lg font-medium transition-colors duration-200 hover:bg-blue-50">My Profile</a></li>
                <li><a href="#" data-page="tasks" data-link class="menu-item p-3 block rounded-lg font-medium transition-colors duration-200 hover:bg-blue-50">Tasks</a></li>
                <li><a href="/time-tracker/time-tracker.html" data-page="time-tracker" data-link class="menu-item p-3 block rounded-lg font-medium transition-colors duration-200 hover:bg-blue-50"><i class="fas fa-clock mr-2"></i>Time Tracker</a></li>
                <li><a href="#" data-page="guardian-ai" data-link class="menu-item p-3 block rounded-lg font-medium transition-colors duration-200 hover:bg-blue-50">Guardian AI</a></li>
                <li><a href="#" data-page="eligibility" data-link class="menu-item p-3 block rounded-lg font-medium transition-colors duration-200 hover:bg-blue-50">Eligibility Verification</a></li>
                <li><a href="#" data-page="claims-follow-up" data-link class="menu-item p-3 block rounded-lg font-medium transition-colors duration-200 hover:bg-blue-50">Claims Follow Up</a></li>
                <li><a href="#" data-page="ar-comment" data-link class="menu-item p-3 block rounded-lg font-medium transition-colors duration-200 hover:bg-blue-50">Create AR Comment</a></li>
                <li><a href="#" data-page="speech-practice" data-link class="menu-item p-3 block rounded-lg font-medium transition-colors duration-200 hover:bg-blue-50">Speech Practice</a></li>
                <li><a href="#" data-page="guardian-tts" data-link class="menu-item p-3 block rounded-lg font-medium transition-colors duration-200 hover:bg-blue-50">Guardian TTS</a></li>
                <li><a href="#" data-page="phonetic-pronunciation" data-link class="menu-item p-3 block rounded-lg font-medium transition-colors duration-200 hover:bg-blue-50">Phonetic Pronunciation</a></li>
                <li><a href="#" data-page="complaint-suggestions" data-link class="menu-item p-3 block rounded-lg font-medium transition-colors duration-200 hover:bg-blue-50">Complaint / Suggestions</a></li>
                <li><a href="#" data-page="request-leave" data-link class="menu-item p-3 block rounded-lg font-medium transition-colors duration-200 hover:bg-blue-50">Request Leave</a></li>
                <li><a href="#" data-page="request-loan" data-link class="menu-item p-3 block rounded-lg font-medium transition-colors duration-200 hover:bg-blue-50">Request Loan</a></li>
                <li><a href="#" data-page="submit-report" data-link class="menu-item p-3 block rounded-lg font-medium transition-colors duration-200 hover:bg-blue-50">Submit Report</a></li>
                <li><a href="#" data-page="team-directory" data-link class="menu-item p-3 block rounded-lg font-medium transition-colors duration-200 hover:bg-blue-50"><i class="fas fa-users mr-2"></i>Team Directory</a></li>
            </ul>
        </nav>
        <div class="mt-auto pt-4 border-t border-gray-200">
            <div class="px-3 py-2 bg-gray-50 rounded-lg">
                <div class="text-sm font-medium text-gray-800" id="user-name">Loading...</div>
                <div class="text-xs text-gray-500" id="user-role">Employee</div>
            </div>
            <button id="logout-btn" class="w-full mt-3 px-3 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium transition-colors duration-200 flex items-center justify-center">
                <i class="fas fa-sign-out-alt mr-2"></i>
                Logout
            </button>
        </div>
    </div>`;

  function ensureContainer() {
    let existing = document.getElementById('layout-root');
    if (!existing) {
      existing = document.createElement('div');
      existing.id = 'layout-root';
      document.body.prepend(existing);
    }
    return existing;
  }

  function renderSidebar(opts = {}) {
    if (document.getElementById('sidebar')) return; // already rendered
    const container = ensureContainer();
    const wrapper = document.createElement('div');
    wrapper.innerHTML = SIDEBAR_HTML;
    document.body.prepend(wrapper);

    // Highlight active
    if (opts.active) {
      const links = document.querySelectorAll('#sidebar [data-page]');
      links.forEach(l => {
        if (l.dataset.page === opts.active || l.textContent.trim().toLowerCase() === opts.active.toLowerCase()) {
          l.classList.add('active');
        } else {
          l.classList.remove('active');
        }
      });
    }

    // Auth injection reuse (if present on index page)
    if (typeof updateUserInterface === 'function') {
      try {
        const userData = localStorage.getItem('userData');
        if (userData) updateUserInterface(JSON.parse(userData));
      } catch(e){}
    }

    // Sidebar toggle for mobile
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebar-overlay');
    document.addEventListener('click', (e)=>{
      const openBtn = e.target.closest('#open-sidebar-btn');
      const closeBtn = e.target.closest('#close-sidebar');
      if (openBtn) { sidebar.classList.add('active'); overlay.classList.remove('hidden'); }
      if (closeBtn || e.target === overlay) { sidebar.classList.remove('active'); overlay.classList.add('hidden'); }
    });

    // Basic navigation fallback (full-page) for direct link pages
    document.querySelectorAll('#sidebar a[data-link]').forEach(a => {
      a.addEventListener('click', (e)=>{
        // Let Time Tracker and Dashboard navigate normally by href
        if (a.getAttribute('href') && a.getAttribute('href') !== '#') return;
        e.preventDefault();
        if (window.loadContent) {
          document.querySelectorAll('#sidebar a').forEach(l=>l.classList.remove('active'));
          a.classList.add('active');
          loadContent(a.textContent.trim());
        }
      });
    });
  }

  window.renderSidebar = renderSidebar;
})();
