// -------------------- SITE TITLE ADMIN ACCESS --------------------
let letterSequence = [];
document.querySelectorAll("#siteTitle .letter").forEach(el => {
    el.onclick = () => {
        letterSequence.push(el.dataset.letter);
        if (letterSequence.join("") === "BTSG") {
            location.href = "admin-login.html";
        }
    };
});

// -------------------- ADMIN LOGIN --------------------
if (document.getElementById("adminLoginForm")) {
    document.getElementById("adminLoginForm").onsubmit = async e => {
        e.preventDefault();
        const pass = e.target.pass.value;
        const res = await fetch("/api/admin/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ pass })
        }).then(r => r.json());
        if (res.success) location.href = "admin.html";
        else {
            alert("Wrong password! You will be redirected to home. Second wrong attempt locks account.");
            location.href = "index.html";
        }
    };
}

// -------------------- LOGOUT & BACK BUTTONS --------------------
if (document.getElementById("logoutBtn")) {
    document.getElementById("logoutBtn").onclick = async () => {
        await fetch("/api/logout", { method: "POST" });
        location.href = "index.html";
    };
}

if (document.getElementById("backBtn")) {
    document.getElementById("backBtn").onclick = () => location.href = "index.html";
}

// -------------------- MEMBER INFO & PRO --------------------
async function loadMemberInfo() {
    const res = await fetch("/api/me").then(r => r.json());
    if (!res.loggedIn) {
        document.getElementById("memberInfo").innerHTML = "<p>Please log in to view account.</p>";
        return;
    }
    const info = `
        <p>Username: ${res.username}</p>
        <p>Email: ${res.email}</p>
        <p>About: ${res.about}</p>
        <p>Pro: ${res.pro ? "Yes" : "No"}</p>
    `;
    document.getElementById("memberInfo").innerHTML = info;

    if (!res.pro) document.getElementById("proBox").style.display = "block";
    else document.getElementById("proBox").style.display = "none";
}

if (document.getElementById("proBox")) {
    document.getElementById("upgradeBtn").onclick = () => {
        alert("Upgrade to Pro costs $1. Payment integration goes here.");
        // Once paid: call API to mark user as Pro
        fetch("/api/admin/togglePro", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id: getUserID() }) // function to get current user's ID
        }).then(r => r.json())
          .then(() => loadMemberInfo());
    };
}

function getUserID() {
    // Get user ID from session cookie (simple implementation)
    const match = document.cookie.match(/session=([^;]+)/);
    return match ? match[1] : null;
}

// -------------------- SIGNUP & EMAIL VERIFICATION --------------------
if (document.getElementById("signupForm")) {
    document.getElementById("signupForm").onsubmit = async e => {
        e.preventDefault();
        const data = Object.fromEntries(new FormData(e.target));
        const res = await fetch("/api/signup", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data)
        }).then(r => r.json());
        if (res.success) location.href = "verify.html?email=" + encodeURIComponent(data.email);
        else alert(res.message);
    };
}

if (document.getElementById("verifyForm")) {
    document.getElementById("verifyForm").onsubmit = async e => {
        e.preventDefault();
        const params = new URLSearchParams(location.search);
        const email = params.get("email");
        const code = e.target.code.value;
        const res = await fetch("/api/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, code })
        }).then(r => r.json());
        if (res.success) {
            alert("Email verified! You can now log in.");
            location.href = "login.html";
        } else alert(res.message);
    };
}

// -------------------- GAME LIST & PLAY BUTTONS --------------------
async function loadGames() {
    const gamesContainer = document.getElementById("gamesContainer");
    if (!gamesContainer) return;
    const db = await fetch("/api/games").then(r => r.json());
    gamesContainer.innerHTML = "";
    db.games.forEach(game => {
        const div = document.createElement("div");
        div.className = "game-card";
        div.innerHTML = `
            <img src="${game.image}" alt="${game.title}">
            <h3>${game.title}</h3>
            <p>${game.description}</p>
            <button class="playBtn" data-id="${game.id}">Play</button>
        `;
        gamesContainer.appendChild(div);
    });
    document.querySelectorAll(".playBtn").forEach(btn => {
        btn.onclick = () => location.href = `/game.html?id=${btn.dataset.id}`;
    });
}
loadGames();

// -------------------- UPLOAD GAME BUTTON --------------------
if (document.getElementById("uploadForm")) {
    document.getElementById("uploadForm").onsubmit = async e => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const res = await fetch("/api/upload", { method: "POST", body: formData }).then(r => r.json());
        if (res.success) alert("Game uploaded! Waiting admin approval.");
        else alert(res.message);
    };
}

// -------------------- ADDITIONAL FEATURES: LOCKED ACCOUNT --------------------
async function checkLocked() {
    const user = await fetch("/api/me").then(r => r.json());
    if (user.loggedIn && user.locked) {
        alert("Your account is locked! Contact admin.");
        await fetch("/api/logout", { method: "POST" });
        location.href = "index.html";
    }
}
checkLocked();
