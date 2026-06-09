// =====================================
// HEYDUDE AUTHENTICATION
// js/auth.js
// =====================================

const loginForm = document.getElementById("login-form");
const registerForm = document.getElementById("register-form");

const loginTab = document.getElementById("login-tab");
const registerTab = document.getElementById("register-tab");

const authError = document.getElementById("auth-error");

const authScreen = document.getElementById("auth-screen");
const appScreen = document.getElementById("app-screen");

const logoutBtn = document.getElementById("logout-btn");

// ======================
// TAB SWITCHING
// ======================

loginTab.addEventListener("click", () => {


loginTab.classList.add("active");
registerTab.classList.remove("active");

loginForm.classList.remove("hidden");
registerForm.classList.add("hidden");


});

registerTab.addEventListener("click", () => {


registerTab.classList.add("active");
loginTab.classList.remove("active");

registerForm.classList.remove("hidden");
loginForm.classList.add("hidden");


});

// ======================
// ERROR DISPLAY
// ======================

function showAuthError(message) {


authError.textContent = message;
authError.style.display = "block";


}

function clearAuthError() {


authError.textContent = "";
authError.style.display = "none";


}

// ======================
// USERNAME VALIDATION
// ======================

async function usernameExists(username) {


const snapshot = await usersRef
    .orderByChild("username")
    .equalTo(username.toLowerCase())
    .once("value");

return snapshot.exists();


}

// ======================
// REGISTER
// ======================

registerForm.addEventListener("submit", async (e) => {


e.preventDefault();

clearAuthError();

const username =
    document.getElementById("register-username")
    .value
    .trim()
    .toLowerCase();

const email =
    document.getElementById("register-email")
    .value
    .trim();

const password =
    document.getElementById("register-password")
    .value;

try {

    if (username.length < 3) {

        showAuthError(
            "Username must be at least 3 characters."
        );

        return;
    }

    const exists = await usernameExists(username);

    if (exists) {

        showAuthError(
            "Username already exists."
        );

        return;
    }

    const credential =
        await auth.createUserWithEmailAndPassword(
            email,
            password
        );

    const uid = credential.user.uid;

    await usersRef.child(uid).set({

        uid,

        username,

        email,

        online: true,

        createdAt: firebase.database.ServerValue.TIMESTAMP,

        lastSeen: firebase.database.ServerValue.TIMESTAMP

    });

    showToast("Account created successfully");

} catch (error) {

    showAuthError(error.message);

}


});

// ======================
// LOGIN
// ======================

loginForm.addEventListener("submit", async (e) => {


e.preventDefault();

clearAuthError();

const email =
    document.getElementById("login-email")
    .value
    .trim();

const password =
    document.getElementById("login-password")
    .value;

try {

    await auth.signInWithEmailAndPassword(
        email,
        password
    );

    showToast("Login successful");

} catch (error) {

    showAuthError(error.message);

}


});

// ======================
// LOGOUT
// ======================

logoutBtn.addEventListener("click", async () => {


try {

    if (currentUser) {

        setUserOffline(currentUser.uid);

    }

    await auth.signOut();

    showToast("Logged out");

} catch (error) {

    console.error(error);

}


});

// ======================
// AUTH STATE
// ======================

auth.onAuthStateChanged(async (user) => {


if (!user) {

    currentUser = null;

    authScreen.classList.add("active");
    appScreen.classList.remove("active");

    return;

}

const snapshot =
    await usersRef.child(user.uid).once("value");

const profile = snapshot.val();

currentUser = {

    uid: user.uid,

    ...profile

};

setUserOnline(user.uid);

// Update Sidebar Profile

document.getElementById("my-name").textContent =
    profile.username;

document.getElementById("my-status").textContent =
    "Online";

document.getElementById("my-avatar").textContent =
    getInitial(profile.username);

document.getElementById("my-avatar").style.background =
    avatarColor(profile.username);

authScreen.classList.remove("active");
appScreen.classList.add("active");

// Load App Data

if (typeof loadChats === "function") {
    loadChats();
}

if (typeof listenFriendRequests === "function") {
    listenFriendRequests();
}


});

// ======================
// SPLASH SCREEN
// ======================

window.addEventListener("load", () => {


const splash =
    document.getElementById("splash-screen");

setTimeout(() => {

    splash.style.display = "none";

}, 1500);


});
