const loginView = document.getElementById("loginView");
const appView = document.getElementById("appView");
const msg = document.getElementById("msg");

const inUser = document.getElementById("inUser");
const inPass = document.getElementById("inPass");
const btnLogin = document.getElementById("btnLogin");

let currentUser = null;

/* LOGIN */
btnLogin.onclick = async () => {
  msg.textContent = "";

  const u = inUser.value.trim();
  const p = inPass.value.trim();

  try{
    const res = await fetch("/api/login",{
      method:"POST",
      headers:{ "Content-Type":"application/json" },
      body:JSON.stringify({u,p})
    });
    const data = await res.json();

    if(!res.ok || !data.ok){
      msg.textContent = "Login fehlgeschlagen";
      return;
    }

    currentUser = data;
    showApp();

  }catch{
    msg.textContent = "Backend nicht erreichbar";
  }
};

/* APP START */
function showApp(){
  loginView.classList.add("hidden");
  appView.classList.remove("hidden");

  if(currentUser.role !== "admin"){
    document.querySelectorAll(".admin-only").forEach(e=>e.remove());
  }

  activateNav();
  loadView("leitstelle");
}

/* NAVIGATION */
function activateNav(){
  document.querySelectorAll("nav button[data-view]").forEach(btn=>{
    btn.onclick = () => loadView(btn.dataset.view);
  });

  document.getElementById("logout").onclick = () => location.reload();
}

function loadView(view){
  document.querySelectorAll("nav button").forEach(b=>b.classList.remove("active"));
  document.querySelector(`button[data-view="${view}"]`)?.classList.add("active");

  const content = document.getElementById("content");

  content.innerHTML = `
    <div class="view-card">
      <h2>${view.toUpperCase()}</h2>
      <p>Modul wird hier geladen…</p>
    </div>
  `;
}
