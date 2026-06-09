// =====================================
// HEYDUDE FIREBASE CONFIGURATION
// js/firebase.js
// =====================================

const firebaseConfig = {
  apiKey: "AIzaSyAgZSVBLgWfe44Bah6Autu4NcgXg2spJHw",
  authDomain: "heydude-a01c6.firebaseapp.com",
  databaseURL: "https://heydude-a01c6-default-rtdb.asia-southeast1.firebasedatabase.app/",
  projectId: "heydude-a01c6",
  storageBucket: "heydude-a01c6.firebasestorage.app",
  messagingSenderId: "579142608044",
  appId: "1:579142608044:web:a2b4a1585aff4dfea90749"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Services
const auth = firebase.auth();
const db = firebase.database();

// References
const usersRef    = db.ref("users");
const chatsRef    = db.ref("chats");
const messagesRef = db.ref("messages");
const requestsRef = db.ref("friendRequests");
const typingRef   = db.ref("typing");

// Current User (global)
let currentUser = null;

// =====================================
// HELPERS
// =====================================

function generateChatId(uid1, uid2) {
  return [uid1, uid2].sort().join("_");
}

function showToast(message) {
  const toast = document.getElementById("toast");
  toast.textContent = message;
  toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), 3000);
}

function getInitial(name) {
  if (!name) return "?";
  return name.charAt(0).toUpperCase();
}

function avatarColor(seed) {
  const colors = [
    "#ff4d4d", "#ff6b6b", "#6c5ce7",
    "#00b894", "#0984e3", "#fd79a8",
    "#e17055", "#00cec9"
  ];
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash += seed.charCodeAt(i);
  }
  return colors[hash % colors.length];
}

function formatTime(timestamp) {
  if (!timestamp) return "";
  const date = new Date(timestamp);
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function formatLastSeen(timestamp) {
  if (!timestamp) return "Offline";
  const diff = Math.floor((Date.now() - timestamp) / 1000);
  if (diff < 60)    return "Last seen just now";
  if (diff < 3600)  return `Last seen ${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `Last seen ${Math.floor(diff / 3600)}h ago`;
  return `Last seen ${Math.floor(diff / 86400)}d ago`;
}

// FIX: detach old listener before re-attaching to avoid multiple onDisconnect calls
let connectedListenerAttached = false;

function setUserOnline(uid) {
  db.ref(`users/${uid}`).update({
    online: true,
    lastSeen: firebase.database.ServerValue.TIMESTAMP
  });

  if (!connectedListenerAttached) {
    connectedListenerAttached = true;
    db.ref(".info/connected").on("value", (snap) => {
      if (snap.val() === true) {
        db.ref(`users/${uid}`)
          .onDisconnect()
          .update({
            online: false,
            lastSeen: firebase.database.ServerValue.TIMESTAMP
          });
      }
    });
  }
}

function setUserOffline(uid) {
  db.ref(`users/${uid}`).update({
    online: false,
    lastSeen: firebase.database.ServerValue.TIMESTAMP
  });
}

// Sanitize text to prevent XSS
function escapeHTML(str) {
  const div = document.createElement("div");
  div.appendChild(document.createTextNode(str));
  return div.innerHTML;
}
