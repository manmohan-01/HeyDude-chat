// =====================================
// HEYDUDE FIREBASE CONFIGURATION
// js/firebase.js
// =====================================

// Replace with YOUR Firebase Project Config

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
const usersRef = db.ref("users");
const chatsRef = db.ref("chats");
const messagesRef = db.ref("messages");
const requestsRef = db.ref("friendRequests");
const typingRef = db.ref("typing");

// Current User
let currentUser = null;

// Generate Chat ID
function generateChatId(uid1, uid2) {
return [uid1, uid2].sort().join("_");
}

// Toast Helper
function showToast(message) {
const toast = document.getElementById("toast");


toast.textContent = message;
toast.classList.add("show");

setTimeout(() => {
    toast.classList.remove("show");
}, 3000);


}

// Avatar Helper
function getInitial(name) {
if (!name) return "?";
return name.charAt(0).toUpperCase();
}

// Random Color Generator
function avatarColor(seed) {
const colors = [
"#ff4d4d",
"#ff6b6b",
"#6c5ce7",
"#00b894",
"#0984e3",
"#fd79a8",
"#e17055",
"#00cec9"
];


let hash = 0;

for (let i = 0; i < seed.length; i++) {
    hash += seed.charCodeAt(i);
}

return colors[hash % colors.length];


}

// Format Timestamp
function formatTime(timestamp) {


if (!timestamp) return "";

const date = new Date(timestamp);

return date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit"
});


}

// Format Last Seen
function formatLastSeen(timestamp) {


if (!timestamp) return "Offline";

const now = Date.now();
const diff = Math.floor((now - timestamp) / 1000);

if (diff < 60) {
    return "Last seen just now";
}

if (diff < 3600) {
    return `Last seen ${Math.floor(diff / 60)} min ago`;
}

if (diff < 86400) {
    return `Last seen ${Math.floor(diff / 3600)} hr ago`;
}

return `Last seen ${Math.floor(diff / 86400)} day ago`;


}

// Online Presence
function setUserOnline(uid) {


db.ref(`users/${uid}`).update({
    online: true,
    lastSeen: firebase.database.ServerValue.TIMESTAMP
});

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

// Logout Presence
function setUserOffline(uid) {


db.ref(`users/${uid}`).update({
    online: false,
    lastSeen: firebase.database.ServerValue.TIMESTAMP
});


}
