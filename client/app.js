async function api(url, data) {
    const res = await fetch(url, {
        method: "POST",
        body: data instanceof FormData ? data : JSON.stringify(data),
        headers: data instanceof FormData ? {} : { "Content-Type": "application/json" }
    });
    return await res.json();
}

// Load games on index.html
if (document.getElementById("gamesContainer")) {
    fetch("/api/games").then(r => r.json()).then(games => {
        const cont = document.getElementById("gamesContainer");
        games.forEach(g => {
            cont.innerHTML += `
                <div class="game-card">
                    <img src="${g.image}">
                    <h3>${g.title}</h3>
                    <button onclick="location.href='game.html?id=${g.id}'">Play</button>
                </div>`;
        });
    });
}

// Upload game
if (document.getElementById("uploadForm")) {
    document.getElementById("uploadForm").onsubmit = async e => {
        e.preventDefault();
        let form = new FormData(e.target);
        let res = await api("/api/upload", form);
        alert(res.message);
    };
}

// Login
if (document.getElementById("loginForm")) {
    document.getElementById("loginForm").onsubmit = async e => {
        e.preventDefault();
        let data = Object.fromEntries(new FormData(e.target));
        let res = await api("/api/login", data);
        if (res.success) location.href = "member.html";
        else alert(res.message);
    };
}

// Signup
if (document.getElementById("signupForm")) {
    document.getElementById("signupForm").onsubmit = async e => {
        e.preventDefault();
        let data = Object.fromEntries(new FormData(e.target));
        let res = await api("/api/signup", data);
        if (res.success) location.href = "login.html";
        else alert(res.message);
    };
}

// Member info + Pro upgrade
if (document.getElementById("memberInfo")) {
    fetch("/api/me").then(r => r.json()).then(me => {
        if (!me.loggedIn) return location.href = "login.html";
        document.getElementById("memberInfo").innerHTML = `
            <h2>${me.username}</h2>
            <p>${me.email}</p>
            <p>${me.about}</p>
            <p>Status: <b>${me.pro ? "PRO" : "Free"}</b></p>
        `;
        if (me.pro) document.getElementById("proBox").style.display = "none";
    });
}

// Upgrade to pro
if (document.getElementById("upgradeBtn")) {
    document.getElementById("upgradeBtn").onclick = async () => {
        let res = await api("/api/upgradePro", {});
        alert(res.message);
        location.reload();
    };
}

// Game page
if (document.getElementById("playBtn")) {
    const params = new URLSearchParams(location.search);
    fetch("/api/game?id=" + params.get("id")).then(r => r.json()).then(g => {
        document.getElementById("gameTitle").innerText = g.title;
        document.getElementById("gameImage").src = g.image;
        document.getElementById("playBtn").onclick = () => {
            document.getElementById("gameFrame").src = g.link;
        };
    });
}
