// script.js - client logic that matches server API endpoints
// Keep this file in public/script.js

const API = "/api";

// helper
async function postJSON(url, data){ 
  const res = await fetch(url, { method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify(data) });
  return res.json();
}
async function getJSON(url){ const r = await fetch(url); return r.json(); }

// ---------- site title secret admin (B T S G) ----------
document.addEventListener("DOMContentLoaded", () => {
  const title = document.querySelector(".brand");
  if (title) {
    // insert clickable letters at start: B T S G (we rely on index.html to include .brand)
    // The index.html we provide already includes the letters as spans so skip here
  }
  // load homepage games
  if (document.getElementById("gamesGrid")) loadGames();
  if (document.getElementById("memberInfo")) loadMember();
});

// ---------- AUTH ----------
async function doSignup(form){
  const data = Object.fromEntries(new FormData(form));
  const res = await postJSON(API + "/signup", data);
  if (res.success) {
    alert("Verification code sent to your email.");
    window.location = "verify.html?email=" + encodeURIComponent(data.email);
  } else alert(res.message || "Signup failed");
}

async function doVerify(form){
  const data = Object.fromEntries(new FormData(form));
  const res = await postJSON(API + "/verify", data);
  if (res.success){ alert("Verified! Log in."); window.location = "login.html"; }
  else alert(res.message || "Invalid code");
}

async function doLogin(form){
  const data = Object.fromEntries(new FormData(form));
  const res = await postJSON(API + "/login", data);
  if (res.success){ alert("Logged in"); window.location = "account.html"; }
  else alert(res.message || "Login failed");
}

async function doLogout(){
  await postJSON(API + "/logout", {});
  window.location = "index.html";
}

// ---------- MEMBER ----------
async function loadMember(){
  const me = await getJSON(API + "/me");
  if (!me.loggedIn){ document.getElementById("memberInfo").innerHTML = '<p class="small">Not logged in</p>'; return; }
  let html = `<h2>${me.username || me.name}</h2><p class="small">${me.email}</p><p class="small">PRO: ${me.pro ? "Yes" : "No"}</p>`;
  document.getElementById("memberInfo").innerHTML = html;
  document.getElementById("logoutBtn")?.addEventListener("click", doLogout);
}

// ---------- GAMES ----------
async function loadGames(){
  const data = await getJSON(API + "/games");
  const grid = document.getElementById("gamesGrid");
  if (!grid) return;
  grid.innerHTML = "";
  (data.games || []).forEach(g=>{
    const card = document.createElement("div"); card.className = "card";
    card.innerHTML = `<img class="game-thumb" src="${g.image_path || g.link || '/uploads/placeholder.png'}"><h3>${g.title}</h3><p class="small">${g.description || ''}</p><button class="play-btn" onclick="playGame('${g.id}')">Play</button>`;
    grid.appendChild(card);
  });
}
function playGame(id){ window.location = "game.html?id=" + id; }

// ---------- UPLOAD ----------
async function submitUpload(form){
  const fd = new FormData(form);
  const res = await fetch(API + "/upload", { method:"POST", body: fd });
  const j = await res.json();
  if (j.success) { alert(j.message || "Submitted"); window.location = "index.html"; }
  else alert(j.message || "Upload error");
}

// ---------- ADMIN: will be called from admin-dashboard.html (separate file uses same API) ----------
