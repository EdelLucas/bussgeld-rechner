const inUser = document.getElementById("user");
const inPass = document.getElementById("pass");
const btn = document.getElementById("btn");
const msg = document.getElementById("msg");

btn.addEventListener("click", doLogin);
[inUser, inPass].forEach(el => el.addEventListener("keydown", e => {
  if (e.key === "Enter") doLogin();
}));

async function doLogin(){
  msg.textContent = "";

  const u = inUser.value.trim();
  const p = inPass.value.trim();

  try{
    const res = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ u, p })
    });

    const data = await res.json().catch(()=>({}));

    if(!res.ok || !data.ok){
      msg.textContent = "Login fehlgeschlagen";
      return;
    }

    // Erfolg: hier später App anzeigen
    msg.textContent = "Login OK: " + data.user + " (" + data.role + ")";
    msg.style.color = "green";
  }catch{
    msg.textContent = "Backend nicht erreichbar";
  }
}
