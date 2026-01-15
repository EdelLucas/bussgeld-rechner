window.Leitstelle = {
  mount(root){
    root.innerHTML = `
      <div class="panel">
        <div class="title">🚨 Leitstelle</div>
        <div class="row">
          <div class="col">
            <div class="small">Status-Legende</div>
            <div style="margin-top:10px; display:flex; gap:8px; flex-wrap:wrap">
              <span class="badge b-green">Grün: Im Dienst</span>
              <span class="badge b-red">Rot: Außer Dienst</span>
              <span class="badge b-orange">Orange: AFK</span>
            </div>
            <hr/>
            <div class="small">Einheiten (Demo – später live sync)</div>
            <div id="unitList" style="margin-top:10px"></div>
          </div>
          <div class="col">
            <div class="small">Funkcodes (Kurz)</div>
            <table class="table" style="margin-top:10px">
              <tr><th>Code</th><th>Bedeutung</th></tr>
              <tr><td>10-01</td><td>Dienstantritt</td></tr>
              <tr><td>10-02</td><td>Dienstende</td></tr>
              <tr><td>10-20</td><td>Standortabfrage</td></tr>
              <tr><td>10-50</td><td>Verstärkung benötigt</td></tr>
            </table>
          </div>
        </div>
      </div>
    `;

    const units = [
      {name:"ALPHA 01", status:"Streife"},
      {name:"ALPHA 02", status:"Standby"},
      {name:"BRAVO 01", status:"Streife"},
      {name:"CHARLIE 01", status:"AFK"},
      {name:"DELTA 01", status:"Außer Dienst"},
    ];

    const list = root.querySelector("#unitList");
    const badge = (s)=>{
      if(s==="Streife"||s==="Standby") return `<span class="badge b-green">${s}</span>`;
      if(s==="AFK") return `<span class="badge b-orange">${s}</span>`;
      return `<span class="badge b-red">${s}</span>`;
    };

    list.innerHTML = units.map(u=>`
      <div style="display:flex; align-items:center; justify-content:space-between; padding:10px; border:1px solid #1f2430; border-radius:12px; margin-bottom:8px; background:#0a0c10">
        <div style="font-weight:900">${u.name}</div>
        <div>${badge(u.status)}</div>
      </div>
    `).join("");
  }
};
