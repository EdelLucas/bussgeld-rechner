const API = "http://localhost:3000"; 
// 👉 auf Render später ändern

function login() {
  const u = document.getElementById("user").value;
  const p = document.getElementById("pass").value;

  fetch(API + "/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ u, p })
  })
  .then(r => {
    if (!r.ok) throw "Login fehlgeschlagen";
    return r.json();
  })
  .then(data => {
    document.getElementById("loginBox").style.display = "none";
    document.getElementById("app").style.display = "block";
    document.getElementById("welcome").innerText =
      "Angemeldet als " + data.user;

    if (data.role === "admin") {
      document.getElementById("adminPanel").style.display = "block";
    }
  })
  .catch(() => {
    document.getElementById("error").innerText = "Login fehlgeschlagen";
  });
}

function logout() {
  location.reload();
}
