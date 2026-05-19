// auth.js - Helper functions for frontend authentication

// Check if user is logged in
function checkAuth() {
  const token = localStorage.getItem('authToken');
  if (!token) {
    // No auto-redirect — login is triggered only when user clicks Login
    return null;
  }
  return token;
}

// Fetch user data using APIService
async function fetchCurrentUser() {
  try {
    if (!APIService.isAuthenticated()) {
      return null;
    }
    return await APIService.getCurrentUser();
  } catch (err) {
    console.error('Failed to fetch user:', err);
    logout();
    return null;
  }
}

// Logout
function logout() {
  APIService.logout();
  window.location.href = 'index.html';
}

function ensureAuthLoadingOverlay() {
  let overlay = document.getElementById('authLoadingOverlay');
  if (overlay) return overlay;

  overlay = document.createElement('div');
  overlay.id = 'authLoadingOverlay';
  overlay.className = 'auth-loading-overlay';
  overlay.innerHTML = `
    <video class="auth-loading-video" autoplay muted loop playsinline preload="auto">
      <source src="farmlanddrone.mp4" type="video/mp4">
    </video>
    <div class="auth-loading-dim"></div>
    <div class="auth-loading-card glass">
      <div class="auth-loading-badge">Loading AgriAdvisor</div>
      <div class="auth-loading-title" id="authLoadingTitle">Redirecting to dashboard...</div>
      <div class="auth-loading-msg" id="authLoadingMsg">Syncing your account and preparing live farm data.</div>
      <div class="spinner"></div>
    </div>
  `;
  document.body.appendChild(overlay);
  return overlay;
}

function showAuthLoadingOverlay(title = 'Redirecting to dashboard...', message = 'Syncing your account and preparing live farm data.') {
  const overlay = ensureAuthLoadingOverlay();
  const titleEl = document.getElementById('authLoadingTitle');
  const msgEl = document.getElementById('authLoadingMsg');
  if (titleEl) titleEl.textContent = title;
  if (msgEl) msgEl.textContent = message;
  overlay.classList.add('show');
}

function hideAuthLoadingOverlay() {
  const overlay = document.getElementById('authLoadingOverlay');
  if (overlay) overlay.classList.remove('show');
}
