// =====================================
// HEYDUDE AUTHENTICATION
// js/auth.js
// =====================================

const loginForm    = document.getElementById("login-form");
const registerForm = document.getElementById("register-form");
const loginTab     = document.getElementById("login-tab");
const registerTab  = document.getElementById("register-tab");
const authError    = document.getElementById("auth-error");
const authScreen   = document.getElementById("auth-screen");
const appScreen    = document.getElementById("app-screen");
const logoutBtn    = document.getElementById("logout-btn");

// ======================
// TAB SWITCHING
// ======================

loginTab.addEventListener("click", () => {
  loginTab.classList.add("active");
  registerTab.classList.remove("active");
  loginForm.classList.remove("hidden");
  registerForm.classList.add("hidden");
  clearAuthError();
});

registerTab.addEventListener("click", () => {
  registerTab.classList.add("active");
  loginTab.classList.remove("active");
  registerForm.classList.remove("hidden");
  loginForm.classList.add("hidden");
  clearAuthError();
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

  const username = document.getElementById("register-username").value.trim().toLowerCase();
  const email    = document.getElementById("register-email").value.trim();
  const password = document.getElementById("register-password").value;

  // Validate username format
  if (username.length < 3) {
    showAuthError("Username must be at least 3 characters.");
    return;
  }

  if (!/^[a-z0-9_]+$/.test(username)) {
    showAuthError("Username can only contain letters, numbers, and underscores.");
    return;
  }

  try {
    const exists = await usernameExists(username);
    if (exists) {
      showAuthError("Username already taken. Try another.");
      return;
    }

    const credential = await auth.createUserWithEmailAndPassword(email, password);
    const uid = credential.user.uid;

    await usersRef.child(uid).set({
      uid,
      username,
      email,
      online: true,
      createdAt: firebase.database.ServerValue.TIMESTAMP,
      lastSeen:  firebase.database.ServerValue.TIMESTAMP
    });

    showToast("Account created! Welcome 🎉");

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

  const email    = document.getElementById("login-email").value.trim();
  const password = document.getElementById("login-password").value;

  try {
    await auth.signInWithEmailAndPassword(email, password);
    showToast("Welcome back!");
  } catch (error) {
    // Friendlier error messages
    if (error.code === "auth/user-not-found" || error.code === "auth/wrong-password") {
      showAuthError("Incorrect email or password.");
    } else if (error.code === "auth/too-many-requests") {
      showAuthError("Too many attempts. Please try again later.");
    } else {
      showAuthError(error.message);
    }
  }
});

// ======================
// LOGOUT
// ======================

logoutBtn.addEventListener("click", async () => {
  try {
    if (currentUser) {
      await setUserOffline(currentUser.uid);
    }
    await auth.signOut();
    showToast("Logged out");
  } catch (error) {
    console.error("Logout error:", error);
  }
});

// ======================
// AUTH STATE LISTENER
// ======================

auth.onAuthStateChanged(async (user) => {
  // Hide splash whenever auth state resolves
  const splash = document.getElementById("splash-screen");
  if (splash) {
    splash.style.opacity = "0";
    setTimeout(() => { splash.style.display = "none"; }, 400);
  }

  if (!user) {
    currentUser = null;
    authScreen.classList.add("active");
    appScreen.classList.remove("active");
    return;
  }

  try {
    const snapshot = await usersRef.child(user.uid).once("value");
    const profile  = snapshot.val();

    if (!profile) {
      // Profile missing — sign out cleanly
      await auth.signOut();
      return;
    }

    currentUser = { uid: user.uid, ...profile };

    setUserOnline(user.uid);

    // Update sidebar profile
    document.getElementById("my-name").textContent   = profile.username;
    document.getElementById("my-status").textContent  = "Online";
    document.getElementById("my-avatar").textContent  = getInitial(profile.username);
    document.getElementById("my-avatar").style.background = avatarColor(profile.username);

    authScreen.classList.remove("active");
    appScreen.classList.add("active");

    if (typeof loadChats === "function")          loadChats();
    if (typeof listenFriendRequests === "function") listenFriendRequests();

  } catch (error) {
    console.error("Auth state error:", error);
  }
});
