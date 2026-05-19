// shared-nav.js - Injects sidebar + top bar into every page
// Usage: <div id="app-nav"></div> then link this script

function svgIcon(path, viewBox = '0 0 24 24') {
  return `<svg class="nav-svg" viewBox="${viewBox}" aria-hidden="true" focusable="false">
    <path d="${path}"></path>
  </svg>`;
}

const NAV_LINKS = [
  { group: 'Main', items: [
    { id: 'dashboard', href: 'dashboard.html', icon: svgIcon('M4 10.5L12 4l8 6.5V20a1 1 0 0 1-1 1h-4.5v-6h-5v6H5a1 1 0 0 1-1-1z'), label: 'Dashboard' },
    { id: 'sell-crops', href: 'sell-crops.html', icon: svgIcon('M12 3l7 4v10l-7 4-7-4V7zm0 2.2L6 8v8l6 3.8 6-3.8V8zM9 11h6v2H9z'), label: 'Sell Crops' },
    { id: 'marketplace', href: 'marketplace.html', icon: svgIcon('M4 6h3l1 8h8l1.2-5H8.2L7.7 7H20v2H9.3l-.6 3h8.6a1 1 0 0 1 1 .8l-.4 2A2 2 0 0 1 16 17H9l.3 2H18v2H8a1 1 0 0 1-1-.8L5.5 7H4z'), label: 'Marketplace', badge: { text: '12', color: 'green' } },
    { id: 'chatbot', href: 'chatbot.html', icon: svgIcon('M7.5 18L4 20V5a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H9.2zM8 7h8v2H8zm0 4h6v2H8z'), label: 'AI Chatbot' },
  ] },
  { group: 'Data', items: [
    { id: 'soil-data', href: 'soil-data.html', icon: svgIcon('M12 2c2.8 0 5 2.2 5 5 0 1.8-.9 3.3-2.3 4.2l1.6 6.8h-2.1l-.8-3.2H10l-.8 3.2H7.1l1.6-6.8A5 5 0 0 1 7 7c0-2.8 2.2-5 5-5zm0 3a2 2 0 1 0 0 4 2 2 0 0 0 0-4z'), label: 'Soil Health' },
    { id: 'crop-recommendation', href: 'crop-recommendation.html', icon: svgIcon('M12 3c3.5 1.5 5.5 4.5 5.5 8.5 0 4.6-3.1 8.3-7.2 9.3l-.5-1.9c2.6-.7 4.5-2.8 5.1-5.4C13.4 12 12 10 10.2 9c-.5 2.2-2.1 4-4.2 4.7C4.9 12.4 4 10.9 4 9.2 4 6 7 3.7 12 3z'), label: 'Crop Advisor' },
    { id: 'fertilizer-advice', href: 'fertilizer-advice.html', icon: svgIcon('M19 3l2 2-6.8 6.8a3 3 0 0 1-1.3.8l-4.1 1.3 1.3-4.1c.1-.5.4-1 .8-1.3L19 3zM5 5h5l-2 2H7v10h10v-1l2-2v5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2z'), label: 'Fertilizer' },
    { id: 'market-prices', href: 'market-prices.html', icon: svgIcon('M5 19h14v2H3V3h2zm2-3h2V8H7zm4 0h2V5h-2zm4 0h2v-6h-2z'), label: 'Market Prices' },
  ] },
  { group: 'Alerts', items: [
    { id: 'alerts', href: 'alerts.html', icon: svgIcon('M12 3l10 18H2L12 3zm0 5.5L8.8 14h6.4L12 8.5z'), label: 'Weather Alerts', badge: { text: '3', color: 'red' } },
    { id: 'notifications', href: 'notifications.html', icon: svgIcon('M12 22a2.2 2.2 0 0 0 2.2-2.2h-4.4A2.2 2.2 0 0 0 12 22zm6-6V11a6 6 0 1 0-12 0v5L4 18v1h16v-1z'), label: 'Notifications', badge: { text: '5', color: 'red' } },
  ] },
  { group: 'Account', items: [
    { id: 'profile', href: 'profile.html', icon: svgIcon('M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zm-7 9a7 7 0 0 1 14 0z'), label: 'My Profile' },
  ] },
];

function getStoredUser() {
  try {
    const raw = localStorage.getItem('user');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function getUserDisplayName(user) {
  if (!user) return 'Guest Farmer';
  if (user.name) return user.name;
  const first = user.firstName || '';
  const last = user.lastName || '';
  const full = `${first} ${last}`.trim();
  return full || 'Guest Farmer';
}

function getUserDisplayRole(user) {
  if (!user) return 'Farmer';
  const location = user.location || 'India';
  return `Verified Farmer · ${location}`;
}

function getUserInitials(name) {
  const parts = String(name || 'GF').trim().split(/\s+/).filter(Boolean);
  const initials = parts.slice(0, 2).map(part => part[0]).join('').toUpperCase();
  return initials || 'GF';
}

function updateNavBadge(pageId, value) {
  const badge = document.querySelector(`[data-nav-badge-for="${pageId}"]`);
  if (!badge) return;
  const num = Number(value || 0);
  badge.textContent = num > 99 ? '99+' : String(num);
  badge.style.display = num > 0 ? 'inline-flex' : 'none';
}

async function refreshNavBadges() {
  if (typeof APIService === 'undefined' || !APIService.isAuthenticated()) return;
  try {
    const response = await APIService.getNotifications();
    const stats = response && response.stats ? response.stats : null;
    if (!stats) return;
    updateNavBadge('notifications', stats.unread);
    updateNavBadge('alerts', stats.weather);
  } catch {
    // Keep the sidebar usable even if the badge fetch fails.
  }
}

function attachInteractiveEffects() {
  if (window.__agriInteractiveEffects) return;
  window.__agriInteractiveEffects = true;

  document.addEventListener('pointerdown', event => {
    const target = event.target.closest('button, .btn, .icon-btn, .nav-item, .nf-chip, .tab-btn, .toggle');
    if (!target || target.disabled || target.classList.contains('disabled')) return;

    const rect = target.getBoundingClientRect();
    if (!rect.width || !rect.height) return;

    const ripple = document.createElement('span');
    ripple.className = 'fx-ripple';
    const size = Math.max(rect.width, rect.height) * 1.35;
    ripple.style.width = `${size}px`;
    ripple.style.height = `${size}px`;
    ripple.style.left = `${event.clientX - rect.left - size / 2}px`;
    ripple.style.top = `${event.clientY - rect.top - size / 2}px`;
    target.appendChild(ripple);

    window.setTimeout(() => ripple.remove(), 700);
  }, { passive: true });
}

function buildSidebar(activePage) {
  const currentPage = activePage || window.location.pathname.split('/').pop().replace('.html', '') || 'dashboard';
  const storedUser = getStoredUser();
  const displayName = getUserDisplayName(storedUser);
  const displayRole = getUserDisplayRole(storedUser);
  const initials = getUserInitials(displayName);

  const navGroupsHTML = NAV_LINKS.map(group => {
    const items = group.items.map(item => {
      const isActive = item.id === currentPage;
      const badge = item.badge ? `<span class="nav-badge ${item.badge.color}" data-nav-badge-for="${item.id}">${item.badge.text}</span>` : '';
      return `<a href="${item.href}" class="nav-item ${isActive ? 'active' : ''}" data-page="${item.id}">
        <span class="nav-icon">${item.icon}</span>
        <span>${item.label}</span>
        ${badge}
      </a>`;
    }).join('');
    return `<div class="nav-group">
      <div class="nav-label">${group.group}</div>
      ${items}
    </div>`;
  }).join('');

  return `
    <div class="sidebar-logo">
      <div class="logo-wrap">
        <div class="logo-icon">AG</div>
        <div class="logo-text">
          <div class="logo-name">AgriAdvisor</div>
          <div class="logo-tagline">Digital Farming Platform</div>
        </div>
      </div>
    </div>
    <div class="sidebar-farmer">
      <div class="farmer-avi">${initials}</div>
      <div class="farmer-meta">
        <div class="farmer-name">${displayName}</div>
        <div class="farmer-role">${displayRole}</div>
      </div>
      <div class="farmer-badge">
        <span class="badge badge-green" style="font-size:10px;">PRO</span>
      </div>
    </div>
    ${navGroupsHTML}
    <div class="sidebar-bottom">
      <a href="index.html" class="nav-item" style="color:var(--c-red);">
        <span class="nav-icon">${svgIcon('M10 17l1.4-1.4L8.8 13H20v-2H8.8l2.6-2.6L10 7l-5 5 5 5zM4 19h2V5H4z')}</span>
        <span>Logout</span>
      </a>
    </div>`;
}

function buildTopBar(title, subtitle) {
  return `
    <div class="top-bar-title">
      ${title}
      ${subtitle ? `<small>${subtitle}</small>` : ''}
    </div>
    <div class="top-bar-actions">
      <div class="icon-btn" onclick="window.location.href='notifications.html'" title="Notifications">
        ${svgIcon('M12 22a2.2 2.2 0 0 0 2.2-2.2h-4.4A2.2 2.2 0 0 0 12 22zm6-6V11a6 6 0 1 0-12 0v5L4 18v1h16v-1z')}<span class="dot"></span>
      </div>
      <div class="icon-btn" onclick="window.location.href='alerts.html'" title="Weather Alerts">${svgIcon('M12 3l10 18H2L12 3zm0 5.5L8.8 14h6.4L12 8.5z')}</div>
      <a href="profile.html" class="avatar av-sm av-green js-user-avatar" style="cursor:pointer;">👤</a>
    </div>`;
}

function updateUserWidgets(user) {
  if (!user) return;
  const displayName = getUserDisplayName(user);
  const displayRole = getUserDisplayRole(user);
  const initials = getUserInitials(displayName);

  const nameEl = document.querySelector('.sidebar-farmer .farmer-name');
  const roleEl = document.querySelector('.sidebar-farmer .farmer-role');
  const aviEl = document.querySelector('.sidebar-farmer .farmer-avi');
  const topAvatar = document.querySelector('.js-user-avatar');

  if (nameEl) nameEl.textContent = displayName;
  if (roleEl) roleEl.textContent = displayRole;
  if (aviEl) aviEl.textContent = initials;
  if (topAvatar) topAvatar.textContent = initials;
}

function initNav(pageId, title, subtitle) {
  attachInteractiveEffects();

  const pc = document.querySelector('.particles');
  if (pc) {
    for (let i = 0; i < 16; i++) {
      const p = document.createElement('div');
      p.className = 'particle';
      const s = Math.random() * 5 + 2;
      p.style.cssText = `width:${s}px;height:${s}px;left:${Math.random() * 100}%;animation-duration:${Math.random() * 22 + 12}s;animation-delay:${Math.random() * 15}s;`;
      pc.appendChild(p);
    }
  }

  const sidebar = document.querySelector('.sidebar');
  const topBar = document.querySelector('.top-bar');
  if (sidebar) sidebar.innerHTML = buildSidebar(pageId);
  if (topBar) topBar.innerHTML = buildTopBar(title, subtitle);

  updateUserWidgets(getStoredUser());
  if (typeof APIService !== 'undefined' && APIService.isAuthenticated()) {
    APIService.getCurrentUser()
      .then(user => updateUserWidgets(user))
      .catch(() => {});
    refreshNavBadges();
  }

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') sidebar && sidebar.classList.remove('open');
  });
}

function showToast(title, msg = '', type = 'success') {
  const icons = { success: '✅', warning: '⚠️', error: '❌', info: 'ℹ️' };
  let root = document.querySelector('.toast-root');
  if (!root) {
    root = document.createElement('div');
    root.className = 'toast-root';
    document.body.appendChild(root);
  }
  const t = document.createElement('div');
  t.className = `toast ${type}`;
  t.innerHTML = `<span class="toast-icon">${icons[type] || 'ℹ️'}</span><div class="toast-body"><div class="toast-title">${title}</div>${msg ? `<div class="toast-msg">${msg}</div>` : ''}</div>`;
  t.onclick = () => t.remove();
  root.appendChild(t);
  setTimeout(() => { t.style.animation = 'toastIn 0.3s ease reverse'; setTimeout(() => t.remove(), 300); }, 4000);
}

function fmtINR(n) { return '₹' + Number(n || 0).toLocaleString('en-IN'); }
