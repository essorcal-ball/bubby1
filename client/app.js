const API = "https://your-render-backend-url.onrender.com"; // Change after deploy

function showScreen(id){
    document.querySelectorAll(".screen").forEach(s=>s.classList.remove("active"));
    document.getElementById(id).classList.add("active");
}

// LOAD APPROVED GAMES
async function loadGames(){
    let res = await fetch(API+"/games");
    let games = await res.json();

    let html="";
    games.forEach(g=>{
        html+=`
        <div class="gameCard">
            <img src="${API}/${g.thumbnail}">
            <h3>${g.name}</h3>
            <p>${g.description}</p>
            <a href="${API}/${g.file}" target="_blank">
                <button>Play</button>
            </a>
        </div>`;
    });
    document.getElementById("gameList").innerHTML = html;
}
loadGames();

async function register(){
    let data = {
        username: username.value,
        email: email.value,
        password: password.value
    };
    let res = await fetch(API+"/register",{
        method:"POST",
        headers:{ "Content-Type":"application/json" },
        body:JSON.stringify(data)
    });
    loginStatus.innerText = await res.text();
}

async function login(){
    let data = {
        username: username.value,
        password: password.value
    };
    let res = await fetch(API+"/login",{
        method:"POST",
        headers:{ "Content-Type":"application/json" },
        body:JSON.stringify(data)
    });
    loginStatus.innerText = await res.text();
}

async function submitGame(){
    let fd = new FormData();
    fd.append("name", gameName.value);
    fd.append("description", gameDesc.value);
    fd.append("thumbnail", gameThumbnail.files[0]);
    fd.append("file", gameFile.files[0]);

    let res = await fetch(API+"/submit-game",{
        method:"POST",
        body:fd
    });

    uploadStatus.innerText = await res.text();
}

async function upgradePro() {
    let res = await fetch(API+"/create-checkout-session",{
        method:"POST"
    });

    let session = await res.json();
    window.location = session.url;
}
