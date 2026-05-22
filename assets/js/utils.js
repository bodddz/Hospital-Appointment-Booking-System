/**
 * utils.js — Shared utilities for MediBook
 */

// ─── HTML Escaping (XSS Prevention) ──────────────────────────────────────────
function escapeHTML(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// ─── Safe localStorage Wrappers ───────────────────────────────────────────────
function getFromStorage(key, fallback) {
  if (fallback === undefined) fallback = [];
  try {
    var raw = localStorage.getItem(key);
    if (raw === null) return fallback;
    return JSON.parse(raw);
  } catch (e) {
    console.warn('[Storage] Read error for "' + key + '":', e.message);
    return fallback;
  }
}

function setToStorage(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (e) {
    console.warn('[Storage] Write error for "' + key + '":', e.message);
    showToast('Unable to save data — browser storage may be full.', 'error');
    return false;
  }
}

// ─── Password Hashing ─────────────────────────────────────────────────────────
async function hashPassword(password) {
  var encoder = new TextEncoder();
  var data = encoder.encode(password);
  var hashBuffer = await crypto.subtle.digest('SHA-256', data);
  var hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(function (b) { return b.toString(16).padStart(2, '0'); }).join('');
}

// ─── Toast Notifications ──────────────────────────────────────────────────────
function showToast(message, type) {
  type = type || 'info';
  var container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    document.body.appendChild(container);
  }

  var iconClass = 'fa-info-circle';
  if (type === 'success') iconClass = 'fa-check-circle';
  if (type === 'error') iconClass = 'fa-exclamation-circle';
  if (type === 'warning') iconClass = 'fa-exclamation-triangle';

  var toast = document.createElement('div');
  toast.className = 'toast ' + type;
  toast.innerHTML = 
    '<i class="fas ' + iconClass + ' toast-icon"></i>' +
    '<div class="toast-msg">' + escapeHTML(message) + '</div>';
  
  container.appendChild(toast);
  
  requestAnimationFrame(function () {
    toast.classList.add('active');
  });
  
  setTimeout(function () {
    toast.classList.remove('active');
    toast.addEventListener('transitionend', function () {
      if (toast.parentNode) toast.parentNode.removeChild(toast);
    });
  }, 3500);
}

// ─── Custom Confirm Dialog ────────────────────────────────────────────────────
function showConfirm(title, message, type, onConfirm) {
  var overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  
  var iconClass = type === 'danger' ? 'fa-trash-alt' : 'fa-exclamation-triangle';
  var iconColorClass = type === 'danger' ? 'danger' : 'warning';
  var btnClass = type === 'danger' ? 'btn-danger' : 'btn-primary';
  
  overlay.innerHTML = 
    '<div class="modal-content">' +
      '<div class="modal-icon ' + iconColorClass + '"><i class="fas ' + iconClass + '"></i></div>' +
      '<h2 class="modal-title">' + escapeHTML(title) + '</h2>' +
      '<p class="modal-message">' + escapeHTML(message) + '</p>' +
      '<div class="modal-actions">' +
        '<button class="btn btn-secondary" id="confirm-cancel">Cancel</button>' +
        '<button class="btn ' + btnClass + '" id="confirm-ok">Confirm</button>' +
      '</div>' +
    '</div>';
    
  document.body.appendChild(overlay);
  
  requestAnimationFrame(function() { overlay.classList.add('active'); });
  
  document.getElementById('confirm-cancel').addEventListener('click', function() {
    overlay.classList.remove('active');
    setTimeout(function() { overlay.remove(); }, 200);
  });
  
  document.getElementById('confirm-ok').addEventListener('click', function() {
    overlay.classList.remove('active');
    setTimeout(function() { overlay.remove(); }, 200);
    if (typeof onConfirm === 'function') onConfirm();
  });
}

// ─── Animated Counters ────────────────────────────────────────────────────────
function animateCounter(elementId, targetValue, duration) {
  var el = document.getElementById(elementId);
  if (!el) return;
  
  var start = 0;
  var increment = targetValue / (duration / 16); // 60fps
  
  function updateCounter() {
    start += increment;
    if (start >= targetValue) {
      el.textContent = targetValue;
    } else {
      el.textContent = Math.ceil(start);
      requestAnimationFrame(updateCounter);
    }
  }
  updateCounter();
}

// ─── Dark Mode Toggle ─────────────────────────────────────────────────────────
function toggleDarkMode() {
  var isDark = document.body.getAttribute('data-theme') === 'dark';
  if (isDark) {
    document.body.removeAttribute('data-theme');
    localStorage.setItem('theme', 'light');
    document.querySelector('.theme-toggle').innerHTML = '<i class="fas fa-moon"></i>';
  } else {
    document.body.setAttribute('data-theme', 'dark');
    localStorage.setItem('theme', 'dark');
    document.querySelector('.theme-toggle').innerHTML = '<i class="fas fa-sun"></i>';
  }
}

function initTheme() {
  var theme = localStorage.getItem('theme');
  var toggleBtn = document.querySelector('.theme-toggle');
  
  // Also check system preference if no saved theme
  if (!theme && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    theme = 'dark';
  }
  
  if (theme === 'dark') {
    document.body.setAttribute('data-theme', 'dark');
    if(toggleBtn) toggleBtn.innerHTML = '<i class="fas fa-sun"></i>';
  } else {
    if(toggleBtn) toggleBtn.innerHTML = '<i class="fas fa-moon"></i>';
  }
}

// ─── Mobile Sidebar Toggle ────────────────────────────────────────────────────
function toggleSidebar() {
  var sidebar = document.querySelector('.sidebar');
  if (sidebar) sidebar.classList.toggle('open');
}

// ─── Dashboard Initializer ────────────────────────────────────────────────────
// Sets up user avatar, name, role, and global listeners for dashboards
function initDashboard(user) {
  if (user) {
    var nameEl = document.querySelector('.user-name');
    var roleEl = document.querySelector('.user-role');
    var avatarEl = document.querySelector('.avatar');
    
    if (nameEl) nameEl.textContent = user.username;
    if (roleEl) roleEl.textContent = user.role;
    if (avatarEl) {
      avatarEl.textContent = user.username.charAt(0).toUpperCase();
      // Generate a color based on username so it stays consistent
      var colors = ['#2563eb', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];
      var charCodeSum = user.username.split('').reduce(function(acc, char) { return acc + char.charCodeAt(0); }, 0);
      avatarEl.style.backgroundColor = colors[charCodeSum % colors.length];
    }
  }
  
  initTheme();
  
  var themeBtn = document.querySelector('.theme-toggle');
  if (themeBtn) themeBtn.addEventListener('click', toggleDarkMode);
  
  var menuBtn = document.querySelector('.menu-toggle');
  if (menuBtn) menuBtn.addEventListener('click', toggleSidebar);
  
  // Close sidebar if clicking outside on mobile
  document.addEventListener('click', function(e) {
    var sidebar = document.querySelector('.sidebar');
    var menuBtn = document.querySelector('.menu-toggle');
    if (window.innerWidth <= 768 && sidebar && sidebar.classList.contains('open')) {
      if (!sidebar.contains(e.target) && !menuBtn.contains(e.target)) {
        sidebar.classList.remove('open');
      }
    }
  });

  // Fetch notifications
  if (user) {
    updateNotificationBell(user.id);
    
    // Start polling notifications every 10 seconds to simulate real-time
    setInterval(() => {
      updateNotificationBell(user.id);
    }, 10000);
  }
}

// ─── Loading State Helper ─────────────────────────────────────────────────────
function setBtnLoading(buttonEl, isLoading) {
  if (!buttonEl) return;
  if (isLoading) {
    buttonEl.classList.add('btn-loading');
    buttonEl.disabled = true;
  } else {
    buttonEl.classList.remove('btn-loading');
    buttonEl.disabled = false;
  }
}

function renderSkeletons(containerId, type, count) {
  var container = document.getElementById(containerId);
  if (!container) return;
  
  var html = '';
  for(var i=0; i<(count || 3); i++) {
    if (type === 'card') {
      html += '<div class="skeleton skeleton-card"></div>';
    } else if (type === 'table') {
      html += '<div class="skeleton skeleton-table-row"></div>';
    } else {
      html += '<div class="list-item"><div class="skeleton skeleton-title"></div><div class="skeleton skeleton-text"></div></div>';
    }
  }
  container.innerHTML = html;
}

// ─── Notification System ──────────────────────────────────────────────────────
async function updateNotificationBell(userId) {
  try {
    const notifs = await api.getNotifications(userId);
    const unreadCount = notifs.filter(n => !n.read).length;
    
    let bellContainer = document.getElementById('notifDropdownContainer');
    if (!bellContainer) return;

    let badge = bellContainer.querySelector('.notification-badge');
    if (!badge) {
      badge = document.createElement('span');
      badge.className = 'notification-badge';
      bellContainer.appendChild(badge);
    }
    
    badge.textContent = unreadCount;
    badge.style.display = unreadCount > 0 ? 'inline-flex' : 'none';
    
    const dropdown = document.getElementById('notifDropdown');
    if (!dropdown) return;
    
    if (notifs.length === 0) {
      dropdown.innerHTML = '<div class="notif-header">Notifications</div><div class="notif-item" style="text-align:center; color:var(--text-muted);">No new notifications</div>';
      return;
    }
    
    let html = '<div class="notif-header">Notifications <button class="btn btn-sm" style="float:right; font-size:0.7rem; padding:0.2rem 0.5rem;" onclick="markNotifsRead(\'' + userId + '\')">Mark all read</button></div>';
    notifs.forEach(n => {
      const dateStr = new Date(n.date).toLocaleString();
      html += `<div class="notif-item ${n.read ? '' : 'unread'}">
        <div>${escapeHTML(n.message)}</div>
        <div class="notif-date">${dateStr}</div>
      </div>`;
    });
    
    dropdown.innerHTML = html;
    
  } catch (err) {
    console.warn("Failed to load notifications", err);
  }
}

async function markNotifsRead(userId) {
  try {
    await api.markNotificationsRead(userId);
    updateNotificationBell(userId);
  } catch (err) {}
}

function toggleNotificationDropdown() {
  const dropdown = document.getElementById('notifDropdown');
  if (dropdown) dropdown.classList.toggle('show');
}

// Global click outside to close dropdown
document.addEventListener('click', function(e) {
  const btn = document.getElementById('notifBtn');
  const dropdown = document.getElementById('notifDropdown');
  if (btn && dropdown && !btn.contains(e.target) && !dropdown.contains(e.target)) {
    dropdown.classList.remove('show');
  }
});


