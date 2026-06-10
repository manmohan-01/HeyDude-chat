// =====================================
// HEYDUDE MEDIA HANDLING
// js/media.js
// =====================================

const attachBtn  = document.getElementById("attach-btn");
const fileInput  = document.getElementById("file-input");
const imageInput = document.getElementById("image-input");
const gifBtn     = document.getElementById("gif-btn");
const gifPicker  = document.getElementById("gif-picker");
const gifSearch  = document.getElementById("gif-search");
const gifGrid    = document.getElementById("gif-grid");
const gifClose   = document.getElementById("gif-close");

// =====================================
// ATTACH BUTTON  (file picker)
// =====================================

attachBtn.addEventListener("click", () => {
  closeAllPickers();
  fileInput.click();
});

fileInput.addEventListener("change", async () => {
  const file = fileInput.files[0];
  fileInput.value = "";
  if (!file) return;

  if (file.size > 20 * 1024 * 1024) {
    showToast("File too large (max 20 MB)");
    return;
  }

  if (file.type.startsWith("image/")) {
    await uploadMedia(file, "image");
  } else if (file.type.startsWith("video/")) {
    await uploadMedia(file, "video");
  } else {
    await uploadMedia(file, "file");
  }
});

// =====================================
// EMOJI BUTTON click is handled in emoji.js
// =====================================

// =====================================
// GIF PICKER  (Giphy public beta key — works without signup)
// =====================================

// Giphy public beta key — free, no account needed, works in browser with no CORS issues
const GIPHY_KEY = "dc6zaTOxFJmzC";

gifBtn.addEventListener("click", (e) => {
  e.stopPropagation();
  document.getElementById("emoji-picker").classList.add("hidden");

  gifPicker.classList.toggle("hidden");
  if (!gifPicker.classList.contains("hidden")) {
    // Only fetch trending if grid is empty or showing placeholder
    if (!gifGrid.querySelector(".gif-item")) loadTrendingGifs();
    gifSearch.focus();
  }
});

gifClose.addEventListener("click", () => gifPicker.classList.add("hidden"));

let gifDebounce = null;
gifSearch.addEventListener("input", () => {
  clearTimeout(gifDebounce);
  const q = gifSearch.value.trim();
  gifDebounce = setTimeout(() => {
    if (q.length >= 2) searchGifs(q);
    else if (q.length === 0) loadTrendingGifs();
  }, 420);
});

// Clear search when picker opens fresh
gifSearch.addEventListener("focus", () => {
  if (!gifSearch.value) loadTrendingGifs();
});

async function loadTrendingGifs() {
  gifGrid.innerHTML = `<div class="gif-loading">✨ Loading trending GIFs…</div>`;
  try {
    const url = `https://api.giphy.com/v1/gifs/trending?api_key=${GIPHY_KEY}&limit=24&rating=pg`;
    const res  = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const { data } = await res.json();
    renderGifs(data || []);
  } catch (err) {
    console.error("GIF trending error:", err);
    gifGrid.innerHTML = `<div class="gif-placeholder">⚠ Couldn't load GIFs.<br><small>Check your internet connection.</small></div>`;
  }
}

async function searchGifs(query) {
  gifGrid.innerHTML = `<div class="gif-loading">Searching "${escapeHTML(query)}"…</div>`;
  try {
    const url = `https://api.giphy.com/v1/gifs/search?api_key=${GIPHY_KEY}&q=${encodeURIComponent(query)}&limit=24&rating=pg`;
    const res  = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const { data } = await res.json();
    renderGifs(data || []);
  } catch (err) {
    console.error("GIF search error:", err);
    gifGrid.innerHTML = `<div class="gif-placeholder">Search failed. Try again.</div>`;
  }
}

function renderGifs(results) {
  gifGrid.innerHTML = "";

  if (!results.length) {
    gifGrid.innerHTML = `<div class="gif-placeholder">No GIFs found 😕</div>`;
    return;
  }

  results.forEach(gif => {
    // Giphy structure: gif.images.fixed_height_small for preview, fixed_height for send
    const preview = gif.images?.fixed_height_small?.url || gif.images?.fixed_height?.url;
    const full    = gif.images?.fixed_height?.url       || gif.images?.original?.url;
    if (!preview || !full) return;

    const div = document.createElement("div");
    div.className = "gif-item";

    const img     = document.createElement("img");
    img.src       = preview;
    img.loading   = "lazy";
    img.alt       = gif.title || "GIF";
    img.title     = gif.title || "";

    img.onclick = async () => {
      gifPicker.classList.add("hidden");
      gifSearch.value = "";
      await sendGifMessage(full);
    };

    div.appendChild(img);
    gifGrid.appendChild(div);
  });
}

async function sendGifMessage(url) {
  if (!activeChatId || !currentUser) return;

  const id = messagesRef.child(activeChatId).push().key;
  await messagesRef.child(activeChatId).child(id).set({
    id,
    sender:    currentUser.uid,
    type:      "gif",
    url,
    timestamp: firebase.database.ServerValue.TIMESTAMP
  });
}

// =====================================
// UPLOAD MEDIA TO FIREBASE STORAGE
// =====================================

async function uploadMedia(file, type) {
  if (!activeChatId || !currentUser) return;

  const msgId  = messagesRef.child(activeChatId).push().key;
  const path   = `chats/${activeChatId}/${msgId}_${file.name}`;
  const ref    = storage.ref(path);

  // Insert progress bubble
  insertProgressBubble(msgId, file.name);

  try {
    const uploadTask = ref.put(file);

    uploadTask.on("state_changed",
      snap => {
        const pct = Math.round((snap.bytesTransferred / snap.totalBytes) * 100);
        updateProgressBubble(msgId, pct);
      },
      err => {
        console.error("Upload error:", err);
        removeProgressBubble(msgId);
        showToast("Upload failed: " + err.message);
      },
      async () => {
        const url = await uploadTask.snapshot.ref.getDownloadURL();
        removeProgressBubble(msgId);

        const payload = {
          id:        msgId,
          sender:    currentUser.uid,
          type,
          url,
          timestamp: firebase.database.ServerValue.TIMESTAMP
        };

        if (type === "file") {
          payload.fileName = file.name;
          payload.fileSize = file.size;
          payload.mimeType = file.type;
        }

        await messagesRef.child(activeChatId).child(msgId).set(payload);
      }
    );

  } catch (err) {
    console.error("Upload setup error:", err);
    removeProgressBubble(msgId);
    showToast("Upload failed");
  }
}

function insertProgressBubble(id, name) {
  const wrap = document.createElement("div");
  wrap.className = "message-wrap sent";
  wrap.id        = `prog-wrap-${id}`;

  const bubble = document.createElement("div");
  bubble.className = "message";

  bubble.innerHTML = `
    <div class="upload-progress-wrap">
      <div class="upload-label">📎 ${escapeHTML(name)}</div>
      <div class="upload-progress-bar">
        <div class="upload-progress-fill" id="prog-fill-${id}"></div>
      </div>
      <div class="upload-label" id="prog-pct-${id}">0%</div>
    </div>
  `;

  wrap.appendChild(bubble);
  messagesContainer.appendChild(wrap);
  messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

function updateProgressBubble(id, pct) {
  const fill = document.getElementById(`prog-fill-${id}`);
  const label = document.getElementById(`prog-pct-${id}`);
  if (fill)  fill.style.width  = pct + "%";
  if (label) label.textContent = pct + "%";
}

function removeProgressBubble(id) {
  const wrap = document.getElementById(`prog-wrap-${id}`);
  if (wrap) wrap.remove();
}

// =====================================
// CLOSE ALL PICKERS ON OUTSIDE CLICK
// =====================================

function closeAllPickers() {
  document.getElementById("emoji-picker").classList.add("hidden");
  gifPicker.classList.add("hidden");
}

document.addEventListener("click", (e) => {
  const emojiPicker = document.getElementById("emoji-picker");
  const emojiBtn    = document.getElementById("emoji-btn");

  if (!emojiPicker.contains(e.target) && e.target !== emojiBtn) {
    emojiPicker.classList.add("hidden");
  }

  if (!gifPicker.contains(e.target) && e.target !== gifBtn) {
    gifPicker.classList.add("hidden");
  }
});
