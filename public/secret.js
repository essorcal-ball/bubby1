const unlockSequence = ["B", "t", "S", "G"];
let progress = 0;

document.querySelectorAll(".click-letter").forEach(letter => {
    letter.addEventListener("click", () => {
        const clicked = letter.getAttribute("data-letter");

        if (clicked === unlockSequence[progress]) {
            progress++;

            if (progress === unlockSequence.length) {
                document.getElementById("admin-secret").style.display = "block";
                progress = 0;
            }
        } else {
            progress = 0;
        }
    });
});

function submitAdminPassword() {
    const pass = document.getElementById("admin-pass").value;

    if (pass === "stego") {
        window.location.href = "/admin.html";
    } else {
        alert("Incorrect password");
    }
}
