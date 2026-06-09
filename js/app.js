// =====================================
// HEYDUDE APP CONTROLLER
// js/app.js
// =====================================

// =====================================
// INITIALIZATION
// =====================================

document.addEventListener("DOMContentLoaded", () => {
  setupNetworkListener();
  setupVisibilityTracking();
  setupKeyboardShortcuts();
  setupNotifications();
  loadTheme();
});

// =====================================
// NETWORK STATUS
// =====================================

function setupNetworkListener() {
  window.addEventListener("online",  () => showToast("Back online ✓"));
  window.addEventListener("offline", () => showToast("No internet connection"));
}

// =====================================
// PAGE VISIBILITY (pause/resume presence)
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
  new Notification(title, { body, icon: "./img/logo.png" });
}

// =====================================
// KEYBOARD SHORTCUTS
// =====================================

function setupKeyboardShortcuts() {
  document.addEventListener("keydown", e => {
    if (e.key === "Escape" && window.innerWidth <= 768) {
      closeMobileChat();
    }
  });
}

// =====================================
// THEME
// =====================================

function saveTheme(theme) {
  localStorage.setItem("heydude-theme", theme);
  document.body.setAttribute("data-theme", theme);
}

function loadTheme() {
  const theme = localStorage.getItem("heydude-theme");
  if (theme) document.body.setAttribute("data-theme", theme);
}

// =====================================
// MOBILE BACK BUTTON — injected after chat opens
// =====================================

function ensureMobileBackButton() {
  if (document.getElementById("mobile-back")) return;

  const header = document.querySelector(".chat-header");
  if (!header) return;

  const btn       = document.createElement("button");
  btn.id          = "mobile-back";
  btn.innerHTML   = "←";
  btn.className   = "mobile-back-btn";
  btn.onclick     = closeMobileChat;

  header.prepend(btn);
}

// Inject back button once DOM is ready
document.addEventListener("DOMContentLoaded", ensureMobileBackButton);
