// START OF script.js
if (!currentUser) return alert("Login first");


games.push({
name: document.getElementById("gameName").value,
desc: document.getElementById("gameDesc").value,
url: document.getElementById("gameURL").value,
user: currentUser,
approved: false
});


localStorage.setItem("games", JSON.stringify(games));
alert("Game submitted for review!");
}


goToAdminLogin = () => {
const code = prompt("Enter admin passcode:");
if (code === "stego") window.location = "admin.html";
else alert("Incorrect passcode.");
};


window.onload = () => {
let list = document.getElementById("gamesList");
list.innerHTML = "";
games.filter(g => g.approved).forEach(g => {
const div = document.createElement("div");
div.innerHTML = `<h3>${g.name}</h3><p>${g.desc}</p><a href="${g.url}" target="_blank">Play</a>`;
list.appendChild(div);
});
};
// END OF script.js
