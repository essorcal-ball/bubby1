// START OF admin.js
let gamesA = JSON.parse(localStorage.getItem("games") || "[]");
let usersA = JSON.parse(localStorage.getItem("users") || "[]");


function goHome() { window.location = "index.html"; }


function loadGames() {
const p = document.getElementById("pendingGames");
const a = document.getElementById("approvedGames");
p.innerHTML = "";
a.innerHTML = "";


gamesA.forEach((g, i) => {
const div = document.createElement("div");
div.innerHTML = `<h3>${g.name}</h3><p>${g.desc}</p>`;


if (!g.approved) {
const btn = document.createElement("button");
btn.innerText = "Approve";
btn.onclick = () => approve(i);
div.appendChild(btn);
p.appendChild(div);
} else {
a.appendChild(div);
}
});
}


function approve(i) {
gamesA[i].approved = true;
localStorage.setItem("games", JSON.stringify(gamesA));
loadGames();
}


function viewUsers() {
const section = document.getElementById("usersSection");
const ul = document.getElementById("userList");
ul.innerHTML = "";
section.classList.remove("hidden");


usersA.forEach(u => {
const d = document.createElement("div");
d.innerHTML = `<strong>${u.user}</strong><br>Joined: ${new Date(u.joined).toLocaleDateString()}<br>Games Played: ${u.gamesPlayed}`;
ul.appendChild(d);
});
}


window.onload = loadGames;
// END OF admin.js
