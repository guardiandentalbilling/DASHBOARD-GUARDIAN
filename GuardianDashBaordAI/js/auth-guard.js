/**
 * Role-Based Access Guard
 * Include this script early (in <head> or before other page logic) on every protected page.
 * Expects localStorage authToken & userData (set during login).
 * Admin pages should add data-require-role="admin" on <body> or a meta tag with name="require-role" content="admin".
 * Elements marked with [data-admin-only] will be hidden for employees.
 */
(function(){
  try {
    const userDataRaw = localStorage.getItem('userData');
    const token = localStorage.getItem('authToken');
    if(!userDataRaw || !token){
      // Not logged in
      if(!window.location.pathname.endsWith('login.html')){
        window.location.href = '/login.html';
      }
      return;
    }
    const user = JSON.parse(userDataRaw);
    if(!user.role){ user.role='employee'; }

    // Determine required role for this page
    let requiredRole = null;
    const metaReq = document.querySelector('meta[name="require-role"]');
    if(metaReq){ requiredRole = metaReq.getAttribute('content'); }
    if(document.body && document.body.dataset.requireRole){ requiredRole = document.body.dataset.requireRole; }

    if(requiredRole === 'admin' && user.role !== 'admin'){
      // redirect employee away from admin-only page
      window.location.replace('/index.html');
      return;
    }

    // Hide admin-only annotated elements if user isn't admin
    if(user.role !== 'admin'){
      document.querySelectorAll('[data-admin-only]').forEach(el => { el.style.display='none'; });
    }

    // Expose helper globally
    window.CurrentUser = user;
    window.isAdmin = () => user.role === 'admin';
    window.isEmployee = () => user.role === 'employee';
  } catch(err){
    console.warn('Auth Guard error', err);
  }
})();
