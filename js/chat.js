// =====================================
// HEYDUDE REAL-TIME CHAT
// js/chat.js
// =====================================

let activeChatId   = null;
let activeUserId   = null;
let typingTimeout  = null;

const chatList         = document.getElementById("chat-list");
const messagesContainer = document.getElementById("messages");
const welcomeScreen    = document.getElementById("welcome-screen");
const chatContainer    = document.getElementById("chat-container");
const messageInput     = document.getElementById("message-text");
const sendBtn          = document.getElementById("send-btn");
const typingIndicator  = document.getElementById("typing-indicator");

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

      if (!chat.members || !chat.members[currentUser.uid]) continue;

      const friendId = Object.keys(chat.members).find(id => id !== currentUser.uid);
      if (!friendId) continue;

      const userSnap = await usersRef.child(friendId).once("value");
      const friend   = userSnap.val();
      if (!friend) continue;

      renderChatItem(chatId, friend);
    }
  });
}

// =====================================
// CHAT LIST ITEM
// =====================================

function renderChatItem(chatId, friend) {
  const div = document.createElement("div");
  div.className  = "chat-item";
  div.id         = `chat-item-${chatId}`;
  div.onclick    = () => openChat(chatId, friend);

  div.innerHTML = `
    <div class="chat-avatar" style="background:${avatarColor(friend.username)}">
      ${getInitial(friend.username)}
    </div>
    <div class="chat-info">
      <h4>${escapeHTML(friend.username)}</h4>
      <p id="preview-${chatId}" class="chat-preview">Start chatting...</p>
    </div>
    <div class="online-dot" id="dot-${friend.uid}" style="opacity:${friend.online ? 1 : 0.3}"></div>
  `;

  chatList.appendChild(div);
  listenLastMessage(chatId);

  // Keep online dot live
  usersRef.child(friend.uid).on("value", snap => {
    const u   = snap.val();
    const dot = document.getElementById(`dot-${friend.uid}`);
    if (dot && u) dot.style.opacity = u.online ? "1" : "0.3";
  });
}

// =====================================
// LAST MESSAGE PREVIEW
// =====================================

function listenLastMessage(chatId) {
  messagesRef.child(chatId).limitToLast(1).on("value", snapshot => {
    const data = snapshot.val();
    const preview = document.getElementById(`preview-${chatId}`);
    if (!preview) return;

    if (!data) {
      preview.textContent = "Start chatting...";
      return;
    }

    const last = Object.values(data)[0];
    const isMine = last.sender === currentUser?.uid;
    preview.textContent = (isMine ? "You: " : "") + last.text;
  });
}

// =====================================
// OPEN CHAT
// =====================================

function openChat(chatId, friend) {
  // Deactivate previous chat item
  document.querySelectorAll(".chat-item").forEach(el => el.classList.remove("active"));
  const item = document.getElementById(`chat-item-${chatId}`);
  if (item) item.classList.add("active");

  activeChatId = chatId;
  activeUserId = friend.uid;

  welcomeScreen.classList.add("hidden");
  chatContainer.classList.remove("hidden");

  document.getElementById("chat-name").textContent            = friend.username;
  document.getElementById("chat-avatar").textContent          = getInitial(friend.username);
  document.getElementById("chat-avatar").style.background     = avatarColor(friend.username);

  updateUserStatus(friend.uid);
  listenMessages(chatId);
  listenTyping(chatId);

  // Mobile: slide in chat panel
  if (window.innerWidth <= 768) {
    document.querySelector(".chat-panel").classList.add("mobile-open");
  }

  messageInput.focus();
}

// =====================================
// USER STATUS
// =====================================

function updateUserStatus(uid) {
  usersRef.child(uid).on("value", snapshot => {
    const user   = snapshot.val();
    const status = document.getElementById("chat-status");
    if (!user || !status) return;

    if (user.online) {
      status.textContent  = "Online";
      status.style.color  = "var(--green)";
    } else {
      status.textContent  = formatLastSeen(user.lastSeen);
      status.style.color  = "var(--text-light)";
    }
  });
}

// =====================================
// LISTEN MESSAGES
// =====================================

function listenMessages(chatId) {
  messagesContainer.innerHTML = "";

  // Detach any previous listener
  messagesRef.child(chatId).off();

  messagesRef.child(chatId).on("value", snapshot => {
    messagesContainer.innerHTML = "";
    const messages = snapshot.val();
    if (!messages) return;

    Object.values(messages).forEach(message => renderMessage(message));

    // Scroll to bottom
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  });
}

// =====================================
// RENDER MESSAGE (XSS-safe)
// =====================================

function renderMessage(message) {
  const div  = document.createElement("div");
  const mine = message.sender === currentUser.uid;

  div.className = `message ${mine ? "sent" : "received"}`;

  // FIX: use textContent for message text to prevent XSS
  const textDiv = document.createElement("div");
  textDiv.textContent = message.text;

  const time = document.createElement("small");
  time.className   = "msg-time";
  time.textContent = formatTime(message.timestamp);

  div.appendChild(textDiv);
  div.appendChild(time);
  messagesContainer.appendChild(div);
}

// =====================================
// SEND MESSAGE
// =====================================

sendBtn.addEventListener("click", sendMessage);

messageInput.addEventListener("keydown", e => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
});

async function sendMessage() {
  if (!activeChatId || !currentUser) return;

  const text = messageInput.value.trim();
  if (!text) return;

  // Optimistically clear input
  messageInput.value = "";
  stopTyping();

  try {
    const messageId = messagesRef.child(activeChatId).push().key;

    await messagesRef.child(activeChatId).child(messageId).set({
      id:        messageId,
      sender:    currentUser.uid,
      text,
      timestamp: firebase.database.ServerValue.TIMESTAMP
    });

  } catch (error) {
    console.error("Send error:", error);
    showToast("Failed to send message");
    messageInput.value = text; // Restore on failure
  }
}

// =====================================
// TYPING INDICATOR
// =====================================

messageInput.addEventListener("input", () => {
  if (!activeChatId || !currentUser) return;

  typingRef.child(activeChatId).child(currentUser.uid).set(true);

  clearTimeout(typingTimeout);
  typingTimeout = setTimeout(stopTyping, 2000);
});

function stopTyping() {
  if (!activeChatId || !currentUser) return;
  typingRef.child(activeChatId).child(currentUser.uid).remove();
}

function listenTyping(chatId) {
  typingRef.child(chatId).on("value", snapshot => {
    const typing = snapshot.val();
    if (!typing) {
      typingIndicator.classList.add("hidden");
      return;
    }
    const others = Object.keys(typing).filter(uid => uid !== currentUser.uid);
    typingIndicator.classList.toggle("hidden", others.length === 0);
  });
}

// =====================================
// MOBILE BACK BUTTON
// =====================================

function closeMobileChat() {
  document.querySelector(".chat-panel").classList.remove("mobile-open");
  activeChatId = null;
  activeUserId = null;
  document.querySelectorAll(".chat-item").forEach(el => el.classList.remove("active"));
}
