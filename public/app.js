const inUser = document.getElementById("inUser");
const inPass = document.getElementById("inPass");
const btnLogin = document.getElementById("btnLogin");
const msg = document.getElementById("msg");

btnLogin.addEventListener("click", doLogin);
[inUser, inPass].forEach(el => el.addEventListener("keydown", (e) => {
  if (e.key === "Enter") doLogin();
}));

async function doLogin(){
  msg.textContent = "";

  const u = inUser.value.trim();
  const p = inPass.value.trim();

  if(!u || !p){
    msg.textContent = "Bitte Benutzer und Passwort eingeben.";
    return;
  }

  try{
    const res = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type":"application/json" },
      body: JSON.stringify({ u, p })
    });

    const data = await res.json().catch(()=>({}));

    if(!res.ok || !data.ok){
      msg.textContent = "Login fehlgeschlagen";
      return;
    }

    msg.style.color = "green";
    msg.textContent = `Login OK: ${data.user} (${data.role})`;
  }catch(e){
    msg.textContent = "Backend nicht erreichbar";
  }
}
