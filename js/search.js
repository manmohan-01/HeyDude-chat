// =====================================
// HEYDUDE USER SEARCH & FRIEND REQUESTS
// js/search.js
// =====================================

const searchInput =
document.getElementById("user-search");

const searchResults =
document.getElementById("search-results");

const requestList =
document.getElementById("request-list");

// =====================================
// SEARCH USERS
// =====================================

searchInput.addEventListener("input", async () => {


const query =
    searchInput.value
    .trim()
    .toLowerCase();

searchResults.innerHTML = "";

if (!query || query.length < 2) {
    return;
}

try {

    const snapshot =
        await usersRef.once("value");

    const users = snapshot.val();

    if (!users) return;

    Object.values(users).forEach(user => {

        if (!currentUser) return;

        // Skip yourself
        if (user.uid === currentUser.uid)
            return;

        if (
            user.username
            .toLowerCase()
            .includes(query)
        ) {

            renderSearchUser(user);

        }

    });

} catch (error) {

    console.error(error);

}


});

// =====================================
// RENDER SEARCH RESULT
// =====================================

function renderSearchUser(user) {


const div =
    document.createElement("div");

div.className = "search-user";

div.innerHTML = `
    <div style="
        display:flex;
        align-items:center;
        justify-content:space-between;
    ">

        <div style="
            display:flex;
            align-items:center;
            gap:10px;
        ">

            <div style="
                width:42px;
                height:42px;
                border-radius:50%;
                display:flex;
                align-items:center;
                justify-content:center;
                color:white;
                font-weight:700;
                background:${avatarColor(user.username)};
            ">
                ${getInitial(user.username)}
            </div>

            <div>
                <strong>
                    ${user.username}
                </strong>
                <br>
                <small>
                    ${user.online ? "Online" : "Offline"}
                </small>
            </div>

        </div>

        <button
            class="primary-btn"
            style="
                width:auto;
                padding:8px 12px;
            "
            onclick="sendFriendRequest('${user.uid}')"
        >
            Add
        </button>

    </div>
`;

searchResults.appendChild(div);


}

// =====================================
// SEND FRIEND REQUEST
// =====================================

async function sendFriendRequest(targetUid) {


try {

    const requestId =
        requestsRef.push().key;

    await requestsRef
        .child(requestId)
        .set({

            id: requestId,

            from: currentUser.uid,

            to: targetUid,

            status: "pending",

            createdAt:
                firebase.database
                .ServerValue.TIMESTAMP

        });

    showToast(
        "Friend request sent"
    );

} catch (error) {

    console.error(error);

    showToast(
        "Failed to send request"
    );

}


}

// =====================================
// LISTEN FRIEND REQUESTS
// =====================================

function listenFriendRequests() {


if (!currentUser) return;

requestsRef.on("value", snapshot => {

    requestList.innerHTML = "";

    const requests =
        snapshot.val();

    if (!requests) return;

    Object.values(requests)
        .forEach(request => {

        if (
            request.to === currentUser.uid &&
            request.status === "pending"
        ) {

            renderRequest(request);

        }

    });

});


}

// =====================================
// RENDER REQUEST
// =====================================

async function renderRequest(request) {


const senderSnap =
    await usersRef
    .child(request.from)
    .once("value");

const sender =
    senderSnap.val();

if (!sender) return;

const div =
    document.createElement("div");

div.className = "search-user";

div.innerHTML = `

    <div style="
        display:flex;
        justify-content:space-between;
        align-items:center;
    ">

        <div>

            <strong>
                ${sender.username}
            </strong>

            <br>

            <small>
                wants to chat
            </small>

        </div>

        <div style="
            display:flex;
            gap:6px;
        ">

            <button
                onclick="acceptRequest('${request.id}')"
                class="primary-btn"
                style="
                    width:auto;
                    padding:6px 10px;
                "
            >
                Accept
            </button>

            <button
                onclick="rejectRequest('${request.id}')"
                style="
                    border:none;
                    border-radius:8px;
                    padding:6px 10px;
                    cursor:pointer;
                "
            >
                Reject
            </button>

        </div>

    </div>

`;

requestList.appendChild(div);


}

// =====================================
// ACCEPT REQUEST
// =====================================

async function acceptRequest(requestId) {


try {

    const requestSnap =
        await requestsRef
        .child(requestId)
        .once("value");

    const request =
        requestSnap.val();

    if (!request) return;

    await requestsRef
        .child(requestId)
        .update({

            status: "accepted"

        });

    const chatId =
        generateChatId(
            request.from,
            request.to
        );

    await chatsRef
        .child(chatId)
        .set({

            chatId,

            members: {

                [request.from]: true,
                [request.to]: true

            },

            createdAt:
                firebase.database
                .ServerValue.TIMESTAMP

        });

    showToast(
        "Friend request accepted"
    );

    if (typeof loadChats === "function") {
        loadChats();
    }

} catch (error) {

    console.error(error);

}


}

// =====================================
// REJECT REQUEST
// =====================================

async function rejectRequest(requestId) {


try {

    await requestsRef
        .child(requestId)
        .remove();

    showToast(
        "Request rejected"
    );

} catch (error) {

    console.error(error);

}


}

// =====================================
// CHECK FRIENDSHIP
// =====================================

async function areFriends(uid1, uid2) {


const chatId =
    generateChatId(uid1, uid2);

const snapshot =
    await chatsRef
    .child(chatId)
    .once("value");

return snapshot.exists();


}
