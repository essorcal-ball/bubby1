async function signup() {
    const email = document.getElementById("email").value.trim();
    const pass = document.getElementById("password").value.trim();

    const result = await fetch("/api/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, pass })
    });

    const data = await result.json();
    document.getElementById("msg").innerText = data.message;

    if (data.success) {
        window.location.href = "/login.html";
    }
}
