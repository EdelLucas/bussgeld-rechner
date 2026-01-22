window.DEFAULT_LAWS = [
  { cat: "Psychische & Physische Integrität (StGB)", items: [
    {p:"StGB §3.1", n:"Beleidigung", m:10000, w:0, gs:1},
    {p:"StGB §3.2", n:"Belästigung", m:10000, w:0, gs:1},
    {p:"StGB §3.3", n:"Drohung", m:5000, w:0, gs:0},
    {p:"StGB §4.1", n:"Versuchter Mord / Mord", m:30000, w:4, gs:0},
    {p:"StGB §4.2", n:"Körperverletzung", m:15000, w:2, gs:0},
    {p:"StGB §4.3", n:"Körperverletzung mit Todesfolge", m:20000, w:3, gs:0},
    {p:"StGB §27", n:"Freiheitsberaubung / Geiselnahmen / Entführung", m:30000, w:3, gs:0},
    {p:"StGB §32", n:"Rassismus / Nachstellung (Stalking)", m:15000, w:3, gs:0}
  ]},
  { cat: "Wirtschaftskriminalität (StGB)", items: [
    {p:"StGB §6 / §9", n:"Diebstahl / Betrug", m:5000, w:0, gs:3},
    {p:"StGB §7", n:"Fahrzeug Diebstahl", m:10000, w:2, gs:0},
    {p:"StGB §10.1", n:"Besitz illegaler Gegenstände", m:10000, w:2, gs:0},
    {p:"StGB §11", n:"Raub", m:25000, w:3, gs:0},
    {p:"StGB §14", n:"Steuerhinterziehung", m:50000, w:3, gs:0},
    {p:"StGB §41.1", n:"Besitz staatliches Eigentum (Waffen)", m:50000, w:3, gs:0}
  ]},
  { cat: "Straßenverkehrsordnung (StVO)", items: [
    {p:"StVO §8", n:"Geschwindigkeitsüberschreitung 41 - 60 km/h", m:10000, w:0, gs:0},
    {p:"StVO §17 Art. 1+2", n:"Fahren im berauschten Zustand", m:10000, w:0, gs:2},
    {p:"StVO §24", n:"Fahrerflucht", m:10000, w:1, gs:0}
  ]},
  { cat: "Waffengesetz (WaffG)", items: [
    {p:"WaffG §1", n:"Besitz legaler Waffen ohne Waffenschein", m:10000, w:0, gs:2},
    {p:"WaffG §5.1", n:"Besitz illegaler Waffen", m:10000, w:0, gs:3},
    {p:"WaffG §11", n:"Ungesetzlicher Waffenhandel (An- & Verkauf)", m:25000, w:3, gs:0}
  ]},
  { cat: "Betäubungsmittelgesetz (BtMG)", items: [
    {p:"BtMG §2.1", n:"Drogenbesitz Mittel (ab 31 - 50)", m:20000, w:1, gs:0},
    {p:"BtMG §2.2", n:"Drogenhandel (An- & Verkauf)", m:30000, w:3, gs:0}
  ]},
  { cat: "Strafprozessordnung (StPO)", items: [
    {p:"§6 StPO", n:"Bußgelder nicht bezahlt (500k voll)", m:0, w:5, gs:0}
  ]}
];

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
