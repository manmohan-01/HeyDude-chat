// =====================================
// HEYDUDE APP CONTROLLER
// js/app.js
// =====================================

document.addEventListener("DOMContentLoaded", () => {
  setupNetworkListener();
  setupVisibilityTracking();
  setupKeyboardShortcuts();
  setupNotifications();
  loadTheme();
  setupThemeToggle();
});

// =====================================
// NETWORK STATUS
// =====================================

function setupNetworkListener() {
  window.addEventListener("online",  () => showToast("Back online ✓"));
  window.addEventListener("offline", () => showToast("No internet connection ⚠️"));
}

// =====================================
// PAGE VISIBILITY
// =====================================

function setupVisibilityTracking() {
  document.addEventListener("visibilitychange", () => {
    if (!currentUser) return;
    if (document.hidden) {
      setUserOffline(currentUser.uid);
    } else {
      setUserOnline(currentUser.uid);
    }
  });
}

// =====================================
// SET OFFLINE ON CLOSE
// =====================================

window.addEventListener("beforeunload", () => {
  if (currentUser) setUserOffline(currentUser.uid);
});

// =====================================
// NOTIFICATIONS
// =====================================

function setupNotifications() {
  if ("Notification" in window && Notification.permission === "default") {
    Notification.requestPermission();
  }
}

function notifyUser(title, body) {
  if (Notification.permission !== "granted") return;
  if (!document.hidden) return; // only notify when tab is hidden
  new Notification(title, { body, icon: "./img/logo.png" });
}

// =====================================
// KEYBOARD SHORTCUTS
// =====================================

function setupKeyboardShortcuts() {
  document.addEventListener("keydown", e => {
    // Escape: close mobile chat or pickers
    if (e.key === "Escape") {
      if (window.innerWidth <= 768) {
        closeMobileChat();
      }
      document.getElementById("emoji-picker").classList.add("hidden");
      document.getElementById("gif-picker").classList.add("hidden");
      document.getElementById("lightbox").classList.add("hidden");
      document.getElementById("context-menu").classList.add("hidden");
      document.getElementById("reaction-popup").classList.add("hidden");
    }

    // Ctrl/Cmd + K: focus search
    if ((e.ctrlKey || e.metaKey) && e.key === "k") {
      e.preventDefault();
      const searchEl = document.getElementById("user-search");
      if (searchEl) searchEl.focus();
    }
  });
}

// =====================================
// THEME
// =====================================

function saveTheme(theme) {
  localStorage.setItem("heydude-theme", theme);
  document.body.setAttribute("data-theme", theme);
  updateThemeBtn(theme);
}

function loadTheme() {
  const theme = localStorage.getItem("heydude-theme") || "dark";
  document.body.setAttribute("data-theme", theme);
  updateThemeBtn(theme);
}

function updateThemeBtn(theme) {
  const btn = document.getElementById("theme-toggle");
  if (btn) btn.textContent = theme === "dark" ? "☀️" : "🌙";
}

function setupThemeToggle() {
  const btn = document.getElementById("theme-toggle");
  if (!btn) return;

  btn.addEventListener("click", () => {
    const current = document.body.getAttribute("data-theme") || "dark";
    saveTheme(current === "dark" ? "light" : "dark");
  });
}
