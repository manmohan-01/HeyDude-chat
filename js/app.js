// =====================================
// HEYDUDE APP CONTROLLER
// js/app.js
// =====================================

// =====================================
// GLOBAL APP STATE
// =====================================

let appReady = false;

// =====================================
// DOM REFERENCES
// =====================================

const splashScreen =
document.getElementById(
"splash-screen"
);

const mainAppScreen =
document.getElementById("app-screen");

const mainAuthScreen =
document.getElementById("auth-screen");

// =====================================
// INITIALIZATION
// =====================================

document.addEventListener(
"DOMContentLoaded",
() => {


    initializeApp();

}


);

// =====================================
// APP START
// =====================================

function initializeApp() {


console.log(
    "🚀 HeyDude Starting..."
);

setupSplash();

setupNetworkListener();

setupVisibilityTracking();

setupKeyboardShortcuts();

setupNotifications();

appReady = true;


}

// =====================================
// SPLASH SCREEN
// =====================================

function setupSplash() {


setTimeout(() => {

    if (splashScreen) {

        splashScreen.style.opacity = "0";

        setTimeout(() => {

            splashScreen.style.display =
                "none";

        }, 500);

    }

}, 1500);


}

// =====================================
// NETWORK STATUS
// =====================================

function setupNetworkListener() {


window.addEventListener(
    "online",
    () => {

        showToast(
            "Internet Connected"
        );

        console.log(
            "Online"
        );

    }
);

window.addEventListener(
    "offline",
    () => {

        showToast(
            "Internet Disconnected"
        );

        console.log(
            "Offline"
        );

    }
);


}

// =====================================
// PAGE VISIBILITY
// =====================================

function setupVisibilityTracking() {


document.addEventListener(
    "visibilitychange",
    () => {

        if (
            !currentUser
        ) return;

        if (
            document.hidden
        ) {

            setUserOffline(
                currentUser.uid
            );

        } else {

            setUserOnline(
                currentUser.uid
            );

        }

    }
);


}

// =====================================
// WINDOW CLOSE
// =====================================

window.addEventListener(
"beforeunload",
() => {


    if (
        currentUser
    ) {

        setUserOffline(
            currentUser.uid
        );

    }

}


);

// =====================================
// NOTIFICATIONS
// =====================================

function setupNotifications() {


if (
    "Notification" in window
) {

    if (
        Notification.permission !==
        "granted"
    ) {

        Notification.requestPermission();

    }

}


}

// =====================================
// PUSH NOTIFICATION
// =====================================

function notifyUser(
title,
body
) {


if (
    Notification.permission !==
    "granted"
) return;

new Notification(
    title,
    {
        body,
        icon:
            "./assets/logo.png"
    }
);


}

// =====================================
// NEW MESSAGE ALERT
// =====================================

function monitorIncomingMessages() {


if (
    !currentUser
) return;

chatsRef.on(
    "value",
    snapshot => {

        const chats =
            snapshot.val();

        if (
            !chats
        ) return;

        Object.keys(
            chats
        ).forEach(chatId => {

            messagesRef
                .child(chatId)
                .limitToLast(1)
                .on(
                    "child_added",
                    msgSnap => {

                        const msg =
                            msgSnap.val();

                        if (
                            !msg
                        ) return;

                        if (
                            msg.sender ===
                            currentUser.uid
                        ) return;

                        notifyUser(
                            "New Message",
                            msg.text
                        );

                    }
                );

        });

    }
);


}

// =====================================
// MOBILE BACK BUTTON
// =====================================

function createMobileBackButton() {


const header =
    document.querySelector(
        ".chat-header"
    );

if (
    !header
) return;

if (
    document.getElementById(
        "mobile-back"
    )
) return;

const button =
    document.createElement(
        "button"
    );

button.id =
    "mobile-back";

button.innerHTML =
    "←";

button.style.marginRight =
    "10px";

button.style.background =
    "transparent";

button.style.border =
    "none";

button.style.color =
    "white";

button.style.fontSize =
    "20px";

button.style.cursor =
    "pointer";

button.onclick =
    closeMobileChat;

header.prepend(
    button
);


}

// =====================================
// KEYBOARD SHORTCUTS
// =====================================

function setupKeyboardShortcuts() {


document.addEventListener(
    "keydown",
    e => {

        // ESC closes mobile chat

        if (
            e.key === "Escape"
        ) {

            closeMobileChat();

        }

    }
);


}

// =====================================
// THEME
// =====================================

function saveTheme(
theme
) {


localStorage.setItem(
    "heydude-theme",
    theme
);


}

function loadTheme() {


const theme =
    localStorage.getItem(
        "heydude-theme"
    );

if (
    !theme
) return;

document.body.setAttribute(
    "data-theme",
    theme
);


}

// =====================================
// CACHE USER
// =====================================

function cacheUser() {


if (
    !currentUser
) return;

localStorage.setItem(
    "heydude-user",
    JSON.stringify(
        currentUser
    )
);


}

function restoreCachedUser() {


try {

    const data =
        localStorage.getItem(
            "heydude-user"
        );

    if (
        !data
    ) return;

    const user =
        JSON.parse(
            data
        );

    console.log(
        "Cached User:",
        user.username
    );

} catch (
    error
) {

    console.error(
        error
    );

}


}

// =====================================
// APP HEALTH CHECK
// =====================================

function healthCheck() {


console.log(
    "================================"
);

console.log(
    "HeyDude Health Check"
);

console.log(
    "Firebase:",
    firebase
        ? "OK"
        : "Missing"
);

console.log(
    "Auth:",
    auth
        ? "OK"
        : "Missing"
);

console.log(
    "Database:",
    db
        ? "OK"
        : "Missing"
);

console.log(
    "================================"
);


}

// =====================================
// STARTUP
// =====================================

window.addEventListener(
"load",
() => {

    loadTheme();

    restoreCachedUser();

    createMobileBackButton();

    monitorIncomingMessages();

    healthCheck();

    console.log(
        "✅ HeyDude Ready"
    );

}


);
