// =====================================
// HEYDUDE REAL-TIME CHAT
// js/chat.js
// =====================================

let activeChatId = null;
let activeUserId = null;

const chatList =
document.getElementById("chat-list");

const messagesContainer =
document.getElementById("messages");

const welcomeScreen =
document.getElementById("welcome-screen");

const chatContainer =
document.getElementById("chat-container");

const messageInput =
document.getElementById("message-text");

const sendBtn =
document.getElementById("send-btn");

const typingIndicator =
document.getElementById("typing-indicator");

// =====================================
// LOAD CHATS
// =====================================

function loadChats() {


if (!currentUser) return;

chatsRef.on("value", async snapshot => {

    chatList.innerHTML = "";

    const chats = snapshot.val();

    if (!chats) return;

    for (const chatId in chats) {

        const chat = chats[chatId];

        if (
            !chat.members ||
            !chat.members[currentUser.uid]
        ) {
            continue;
        }

        const friendId =
            Object.keys(chat.members)
            .find(id => id !== currentUser.uid);

        if (!friendId) continue;

        const userSnap =
            await usersRef
            .child(friendId)
            .once("value");

        const friend =
            userSnap.val();

        if (!friend) continue;

        renderChatItem(chatId, friend);

    }

});


}

// =====================================
// CHAT LIST ITEM
// =====================================

function renderChatItem(chatId, friend) {


const div =
    document.createElement("div");

div.className = "chat-item";

div.onclick = () =>
    openChat(chatId, friend);

div.innerHTML = `
    <div
        class="chat-avatar"
        style="
            background:${avatarColor(friend.username)}
        "
    >
        ${getInitial(friend.username)}
    </div>

    <div class="chat-info">

        <h4>
            ${friend.username}
        </h4>

        <p id="preview-${chatId}">
            Start chatting...
        </p>

    </div>

    <div
        class="online-dot"
        style="
            opacity:${friend.online ? 1 : 0.3}
        "
    ></div>
`;

chatList.appendChild(div);

listenLastMessage(chatId);


}

// =====================================
// LAST MESSAGE
// =====================================

function listenLastMessage(chatId) {


messagesRef
    .child(chatId)
    .limitToLast(1)
    .on("value", snapshot => {

        const data =
            snapshot.val();

        if (!data) return;

        const last =
            Object.values(data)[0];

        const preview =
            document.getElementById(
                `preview-${chatId}`
            );

        if (preview) {

            preview.textContent =
                last.text;

        }

    });


}

// =====================================
// OPEN CHAT
// =====================================

function openChat(chatId, friend) {


activeChatId = chatId;
activeUserId = friend.uid;

welcomeScreen.classList.add("hidden");
chatContainer.classList.remove("hidden");

document.getElementById(
    "chat-name"
).textContent =
    friend.username;

document.getElementById(
    "chat-avatar"
).textContent =
    getInitial(friend.username);

document.getElementById(
    "chat-avatar"
).style.background =
    avatarColor(friend.username);

updateUserStatus(friend.uid);

listenMessages(chatId);

listenTyping(chatId);


}

// =====================================
// USER STATUS
// =====================================

function updateUserStatus(uid) {


usersRef
    .child(uid)
    .on("value", snapshot => {

        const user =
            snapshot.val();

        if (!user) return;

        const status =
            document.getElementById(
                "chat-status"
            );

        if (user.online) {

            status.textContent =
                "Online";

        } else {

            status.textContent =
                formatLastSeen(
                    user.lastSeen
                );

        }

    });


}

// =====================================
// LISTEN MESSAGES
// =====================================

function listenMessages(chatId) {


messagesContainer.innerHTML = "";

messagesRef
    .child(chatId)
    .off();

messagesRef
    .child(chatId)
    .on("value", snapshot => {

        messagesContainer.innerHTML = "";

        const messages =
            snapshot.val();

        if (!messages) return;

        Object.values(messages)
            .forEach(message => {

            renderMessage(message);

        });

        messagesContainer.scrollTop =
            messagesContainer.scrollHeight;

    });


}

// =====================================
// RENDER MESSAGE
// =====================================

function renderMessage(message) {


const div =
    document.createElement("div");

const mine =
    message.sender ===
    currentUser.uid;

div.className =
    `message ${
        mine
        ? "sent"
        : "received"
    }`;

div.innerHTML = `
    <div>
        ${message.text}
    </div>

    <small style="
        display:block;
        margin-top:6px;
        opacity:.7;
    ">
        ${formatTime(
            message.timestamp
        )}
    </small>
`;

messagesContainer.appendChild(div);


}

// =====================================
// SEND MESSAGE
// =====================================

sendBtn.addEventListener(
"click",
sendMessage
);

messageInput.addEventListener(
"keydown",
e => {


    if (
        e.key === "Enter" &&
        !e.shiftKey
    ) {

        e.preventDefault();

        sendMessage();

    }

}


);

async function sendMessage() {


if (!activeChatId) return;

const text =
    messageInput.value.trim();

if (!text) return;

try {

    const messageId =
        messagesRef
        .child(activeChatId)
        .push().key;

    await messagesRef
        .child(activeChatId)
        .child(messageId)
        .set({

            id: messageId,

            sender:
                currentUser.uid,

            text,

            timestamp:
                firebase.database
                .ServerValue.TIMESTAMP

        });

    messageInput.value = "";

    stopTyping();

} catch (error) {

    console.error(error);

}


}

// =====================================
// TYPING STATUS
// =====================================

let typingTimeout = null;

messageInput.addEventListener(
"input",
() => {


    if (!activeChatId) return;

    typingRef
        .child(activeChatId)
        .child(currentUser.uid)
        .set(true);

    clearTimeout(
        typingTimeout
    );

    typingTimeout =
        setTimeout(() => {

            stopTyping();

        }, 2000);

}


);

function stopTyping() {


if (
    !activeChatId ||
    !currentUser
) return;

typingRef
    .child(activeChatId)
    .child(currentUser.uid)
    .remove();


}

// =====================================
// LISTEN TYPING
// =====================================

function listenTyping(chatId) {


typingRef
    .child(chatId)
    .on("value", snapshot => {

        const typing =
            snapshot.val();

        if (!typing) {

            typingIndicator
                .classList
                .add("hidden");

            return;

        }

        const others =
            Object.keys(typing)
            .filter(
                uid =>
                uid !==
                currentUser.uid
            );

        if (
            others.length > 0
        ) {

            typingIndicator
                .classList
                .remove("hidden");

        } else {

            typingIndicator
                .classList
                .add("hidden");

        }

    });


}

// =====================================
// MOBILE SUPPORT
// =====================================

function openMobileChat() {


if (
    window.innerWidth <= 768
) {

    document
        .querySelector(
            ".chat-panel"
        )
        .classList
        .add(
            "mobile-open"
        );

}


}

function closeMobileChat() {


document
    .querySelector(
        ".chat-panel"
    )
    .classList
    .remove(
        "mobile-open"
    );


}

// Hook mobile opening
const originalOpenChat =
openChat;

openChat = function(
chatId,
friend
) {


originalOpenChat(
    chatId,
    friend
);

openMobileChat();


};
