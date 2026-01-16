// Admin kann das später im LocalStorage überschreiben
window.DEFAULT_LAWS = [
  { cat:"Psychische & Physische Integrität (StGB)", items:[
    {p:"StGB §3.1", n:"Beleidigung", m:10000, w:0, gs:1},
    {p:"StGB §3.2", n:"Belästigung", m:10000, w:0, gs:1},
    {p:"StGB §3.3", n:"Drohung", m:5000, w:0, gs:0},
    {p:"StGB §4.1", n:"Versuchter Mord / Mord", m:30000, w:4, gs:0},
    {p:"StGB §4.2", n:"Körperverletzung", m:15000, w:2, gs:0},
    {p:"StGB §4.3", n:"Körperverletzung mit Todesfolge", m:20000, w:3, gs:0},
    {p:"StGB §27", n:"Freiheitsberaubung / Geiselnahme / Entführung", m:30000, w:3, gs:0},
    {p:"StGB §32", n:"Rassismus / Nachstellung (Stalking)", m:15000, w:3, gs:0}
  ]},
  { cat:"Wirtschaftskriminalität (StGB)", items:[
    {p:"StGB §6/§9", n:"Diebstahl / Betrug", m:5000, w:0, gs:3},
    {p:"StGB §11", n:"Raub", m:25000, w:3, gs:0},
    {p:"StGB §14", n:"Steuerhinterziehung", m:50000, w:3, gs:0},
    {p:"StGB §41.1", n:"Besitz staatl. Eigentum (Waffen)", m:50000, w:3, gs:0}
  ]},
  { cat:"Straßenverkehrsordnung (StVO)", items:[
    {p:"StVO §17", n:"Fahren im berauschten Zustand", m:10000, w:0, gs:2},
    {p:"StVO §24", n:"Fahrerflucht", m:10000, w:1, gs:0}
  ]},
  { cat:"Waffengesetz (WaffG)", items:[
    {p:"WaffG §5.1", n:"Besitz illegaler Waffen", m:10000, w:2, gs:1}
  ]},
  { cat:"Betäubungsmittelgesetz (BtMG)", items:[
    {p:"BtMG §2.2", n:"Drogenhandel (An- & Verkauf)", m:30000, w:3, gs:0}
  ]},
];

// load/save helper
window.loadLaws = function(){
  try{
    const raw = localStorage.getItem("LAWS");
    if(raw) return JSON.parse(raw);
  }catch{}
  return DEFAULT_LAWS;
};
window.saveLaws = function(laws){
  localStorage.setItem("LAWS", JSON.stringify(laws));
};
