const API = "https://your-render-backend-url.onrender.com"; // change after deploy

function adminLogin() {
    fetch(API + "/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: adminPassword.value })
    })
    .then(res => res.json())
    .then(data => {
        if (data.success) {
            adminLoginSection.style.display = "none";
            dashboard.style.display = "block";
            loadPendingGames();
            loadUsers();
        } else {
            adminLoginStatus.innerText = "Incorrect password";
        }
    });
}

function loadPendingGames() {
    fetch(API + "/admin/pending-games")
    .then(res => res.json())
    .then(games => {
        let html = "";
        games.forEach(g => {
            html += `
            <div class="gameCard">
                <h3>${g.name}</h3>
                <p>${g.description}</p>
                <button onclick="approveGame(${g.id})">Approve</button>
                <button onclick="rejectGame(${g.id})">Reject</button>
            </div>`;
        });
        pendingGames.innerHTML = html;
    });
}

function approveGame(id) {
    fetch(API + "/admin/approve/" + id, { method: "POST" })
    .then(() => loadPendingGames());
}

function rejectGame(id) {
    fetch(API + "/admin/reject/" + id, { method: "POST" })
    .then(() => loadPendingGames());
}

function loadUsers() {
    fetch(API + "/admin/users")
    .then(res => res.json())
    .then(users => {
        let html = "";
        users.forEach(u => {
            html += `
            <div class="gameCard">
                <h3>${u.username}</h3>
                <p>Email: ${u.email}</p>
                <p>Pro: ${u.isPro ? "YES" : "NO"}</p>

                <button onclick="promote(${u.id})">Make PRO</button>
                <button onclick="demote(${u.id})">Remove PRO</button>
                <button onclick="kick(${u.id})" style="background:red;">Kick User</button>
            </div>`;
        });
        userList.innerHTML = html;
    });
}

function promote(id) {
    fetch(API + "/admin/promote/" + id, { method: "POST" })
    .then(() => loadUsers());
}

function demote(id) {
    fetch(API + "/admin/demote/" + id, { method: "POST" })
    .then(() => loadUsers());
}

function kick(id) {
    fetch(API + "/admin/kick/" + id, { method: "DELETE" })
    .then(() => loadUsers());
}
