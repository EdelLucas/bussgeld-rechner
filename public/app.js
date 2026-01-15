const loginView = document.getElementById("loginView");
const appView   = document.getElementById("appView");
const msg       = document.getElementById("msg");

const inUser    = document.getElementById("inUser");
const inPass    = document.getElementById("inPass");
const btnLogin  = document.getElementById("btnLogin");

let currentUser = null;

btnLogin.addEventListener("click", doLogin);

async function doLogin(){
  msg.textContent = "";

  const u = inUser.value.trim();
  const p = inPass.value.trim();

  if(!u || !p){
    msg.textContent = "Bitte Benutzer und Passwort eingeben";
    return;
  }

  try{
    const res = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ u, p })
    });

    const data = await res.json();

    if(!res.ok || !data.ok){
      msg.textContent = "Login fehlgeschlagen";
      return;
    }

    currentUser = data;
    loginView.classList.add("hidden");
    appView.classList.remove("hidden");

  }catch(err){
    msg.textContent = "Backend nicht erreichbar";
  }
}
