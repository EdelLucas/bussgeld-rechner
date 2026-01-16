const loginView = document.getElementById("loginView");
const appView = document.getElementById("appView");
const inUser = document.getElementById("inUser");
const inPass = document.getElementById("inPass");
const btnLogin = document.getElementById("btnLogin");
const btnLogout = document.getElementById("btnLogout");
const loginMsg = document.getElementById("loginMsg");
const who = document.getElementById("who");
const tabsEl = document.getElementById("tabs");

let SESSION = { user:null, role:null };

btnLogin.onclick = doLogin;
btnLogout.onclick = () => location.reload();

function setView(v){
  document.querySelectorAll(".view").forEach(s=>s.style.display="none");
  document.getElementById("view-"+v).style.display="block";
  document.querySelectorAll(".tab").forEach(t=>t.classList.toggle("active",t.dataset.view===v));
}

function buildTabs(){
  const tabs = [
    {id:"leitstelle",label:"Leitstelle"},
    {id:"rechner",label:"Strafrechner"},
    {id:"personen",label:"Personen"},
    {id:"fahrzeuge",label:"Fahrzeuge"},
  ];
  if(SESSION.role==="admin") tabs.push({id:"admin",label:"Admin"});

  tabsEl.innerHTML="";
  tabs.forEach(t=>{
    const b=document.createElement("button");
    b.className="tab";
    b.textContent=t.label;
    b.dataset.view=t.id;
    b.onclick=()=>setView(t.id);
    tabsEl.appendChild(b);
  });
  setView("leitstelle");
}

async function doLogin(){
  loginMsg.textContent="";
  const u=inUser.value.trim();
  const p=inPass.value.trim();
  if(!u||!p){loginMsg.textContent="Fehlt.";return;}

  const res=await fetch("/api/login",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({u,p})});
  const data=await res.json();
  if(!res.ok){loginMsg.textContent="Login fehlgeschlagen";return;}

  SESSION=data;
  loginView.remove();               // 🔥 FIX
  appView.style.display="flex";

  who.textContent=`Angemeldet als ${data.user}`;
  buildTabs();

  Leitstelle.mount(document.getElementById("view-leitstelle"));
  Rechner.mount(document.getElementById("view-rechner"));
  Personen.mount(document.getElementById("view-personen"));
  Fahrzeuge.mount(document.getElementById("view-fahrzeuge"));
  if(data.role==="admin") Admin.mount(document.getElementById("view-admin"));
}
