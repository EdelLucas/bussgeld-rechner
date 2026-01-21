// Admin kann im LocalStorage überschreiben
window.DEFAULT_LAWS = [
  { cat:"Psychische & Physische Integrität (StGB)", items:[
    {p:"StGB §3.1", n:"Beleidigung", w:0, gs:1, m:10000},
    {p:"StGB §3.2", n:"Belästigung", w:0, gs:1, m:10000},
    {p:"StGB §3.3", n:"Drohung", w:0, gs:0, m:5000},

    {p:"StGB §4.1", n:"Versuchter Mord / Mord", w:4, gs:0, m:30000},
    {p:"StGB §4.2", n:"Körperverletzung", w:2, gs:0, m:15000},
    {p:"StGB §4.3", n:"Körperverletzung mit Todesfolge", w:3, gs:0, m:20000},

    // pro ⭐ => Betrag = perStar*(w + gsActive)
    {p:"StGB §4.4", n:"Gewaltsame Drohung", w:1, gs:1, m:0, perStar:5000},

    {p:"StGB §4.5", n:"Fahrlässige Tötung", w:3, gs:0, m:20000},

    // base + pro ⭐
    {p:"StGB §5", n:"Sexuelle Belästigung", w:1, gs:2, m:30000, perStarAdd:10000},

    {p:"StGB §20", n:"Sachbeschädigung", w:0, gs:2, m:5000},
    {p:"StGB §21", n:"Unterlassene Hilfeleistung", w:0, gs:0, m:5000},
    {p:"StGB §26", n:"Prostitution", w:0, gs:0, m:10000},
    {p:"StGB §27", n:"Freiheitsberaubung / Geiselnahme / Entführung", w:3, gs:0, m:30000},
    {p:"StGB §28", n:"Errichtung von Straßenbarrikaden", w:0, gs:2, m:10000},
    {p:"StGB §31", n:"Verhalten in der Öffentlichkeit", w:0, gs:0, m:5000},
    {p:"StGB §32", n:"Rassismus / Nachstellung (Stalking)", w:3, gs:0, m:15000},
    {p:"StGB §38", n:"Fischwilderei", w:0, gs:0, m:5000},
    {p:"StGB §39", n:"Verleumdung", w:0, gs:3, m:30000},
    {p:"StGB §42", n:"Erpressung", w:3, gs:0, m:45000},
    {p:"StGB §43", n:"Androhung einer Straftat", w:0, gs:3, m:20000, perStarAdd:5000}
  ]},

  { cat:"Wirtschaftskriminalität (StGB)", items:[
    {p:"StGB §6 / §9", n:"Diebstahl / Betrug", w:0, gs:3, m:5000},
    {p:"StGB §7", n:"Fahrzeug Diebstahl", w:2, gs:0, m:10000},
    {p:"StGB §10.1", n:"Besitz illegaler Gegenstände", w:2, gs:0, m:10000},
    {p:"StGB §11", n:"Raub", w:3, gs:0, m:25000},
    {p:"StGB §12.1", n:"Geschäfts Raub / Ammu Rob", w:2, gs:0, m:35000},
    {p:"StGB §12.3", n:"ATM Raub", w:1, gs:0, m:5000},
    {p:"StGB §13", n:"Einbruch", w:2, gs:0, m:15000},
    {p:"StGB §14", n:"Steuerhinterziehung", w:3, gs:0, m:50000},
    {p:"StGB §30", n:"Hausfriedensbruch", w:3, gs:0, m:25000},
    {p:"StGB §41.1", n:"Besitz staatliches Eigentum (Waffen)", w:3, gs:0, m:50000, note:"Waffenscheinentzug"},
    {p:"StGB §41.2", n:"Besitz staatliches Eigentum (Gegenstände)", w:3, gs:0, m:50000}
  ]},

  { cat:"Umgang mit Beamten (StGB)", items:[
    {p:"StGB §15.1", n:"Nichtbeachten einer amtlichen Anweisung", w:0, gs:2, m:10000},
    {p:"StGB §15.2", n:"Entziehung polizeilicher Maßnahmen", w:2, gs:0, m:10000},
    {p:"StGB §15.3", n:"Behinderung eines Beamten bei der Arbeit", w:1, gs:0, m:10000},
    {p:"StGB §15.6", n:"Behinderung des EMS bei der Arbeit", w:0, gs:2, m:10000},
    {p:"StGB §15.4", n:"Bestechung von Beamten", w:2, gs:0, m:10000},
    {p:"StGB §15.5", n:"Widerstand gegen Vollstreckungsbeamte", w:2, gs:0, m:20000},
    {p:"StGB §15.7", n:"Nicht ausweisen bei polizeilicher/medizinischer Maßnahme", w:1, gs:0, m:15000},

    // pro ⭐
    {p:"StGB §16", n:"Befreiung von Gefangenen", w:3, gs:2, m:0, perStar:10000},

    {p:"StGB §19", n:"Falsche Namensangabe", w:0, gs:1, m:10000},
    {p:"StGB §23", n:"Missbrauch von Notruf", w:0, gs:2, m:30000},
    {p:"StGB §24", n:"Amtsanmaßung", w:2, gs:1, m:25000},
    {p:"StGB §29", n:"Missachtung eines Platzverweises", w:1, gs:1, m:20000}
  ]},

  { cat:"Straßenverkehrsordnung (StVO)", items:[
    {p:"StVO §2", n:"Gefährdung anderer Verkehrsteilnehmer", w:0, gs:0, m:10000},
    {p:"StVO §4", n:"Missachten von Rechtsfahrgebot", w:0, gs:0, m:8000},
    {p:"StVO §5", n:"Überschreiten der Fahrzeugkapazitäten", w:0, gs:0, m:5000},
    {p:"StVO §6", n:"Fahren mit demoliertem Fahrzeug", w:0, gs:0, m:2000},
    {p:"StVO §7", n:"Fahren ohne Licht", w:0, gs:0, m:5000},
    {p:"StVO §8", n:"Geschwindigkeitsüberschreitung 10–40 km/h", w:0, gs:0, m:5000},
    {p:"StVO §8", n:"Geschwindigkeitsüberschreitung 41–60 km/h", w:0, gs:0, m:10000},
    {p:"StVO §8", n:"Geschwindigkeitsüberschreitung 61–100 km/h", w:0, gs:0, m:15000},
    {p:"StVO §8", n:"Geschwindigkeitsüberschreitung ab 101 km/h", w:0, gs:0, m:20000},
    {p:"StVO §9 Art. 3", n:"Fahren ohne gültige Zulassung", w:0, gs:0, m:10000},
    {p:"StVO §10 Art. 1", n:"Missachten von Rechts vor Links", w:0, gs:0, m:1000},
    {p:"StVO §10 Art. 2", n:"Missachten von Verkehrsschildern", w:0, gs:0, m:2000},
    {p:"StVO §10 Art. 4", n:"Fahren ohne genügend Tankkapazität", w:0, gs:0, m:10000},
    {p:"StVO §10 Art. 6", n:"Nutzung eines Mobilgeräts am Steuer", w:0, gs:0, m:3000},
    {p:"StVO §10 Art. 7", n:"Lärmbelästigung / Unnötiges Hupen", w:0, gs:0, m:20000},
    {p:"StVO §10 Art. 9(1)", n:"Überholen auf der rechten Fahrbahn", w:0, gs:0, m:5000},
    {p:"StVO §10 Art. 12", n:"Fahren abseits gekennzeichneter Wege", w:0, gs:0, m:8000},
    {p:"StVO §10 Art. 16", n:"Fahren entgegen der Fahrtrichtung", w:0, gs:0, m:30000},
    {p:"StVO §12.1", n:"Falsch Parken / Halten", w:0, gs:0, m:10000},
    {p:"StVO §12.3", n:"Bergung aus nicht befahrbarem Gelände", w:0, gs:0, m:20000},
    {p:"StVO §17 Art. 1+2", n:"Fahren im berauschten Zustand", w:0, gs:2, m:10000},
    {p:"StVO §19", n:"Ohne Erste-Hilfe-Kit (Kofferraum)", w:0, gs:0, m:5000},
    {p:"StVO §20", n:"Ohne Gurt", w:0, gs:0, m:5000},
    {p:"StVO §24", n:"Fahrerflucht", w:1, gs:0, m:10000},
    {p:"StVO §26", n:"Abschleppkosten", w:0, gs:0, m:20000, note:"15/20.000$"},
    {p:"StVO §28", n:"Sharing-Cars mit Anti-Radar nicht aus Verkehr gezogen", w:3, gs:0, m:30000}
  ]},

  { cat:"Waffengesetz (WaffG)", items:[
    {p:"WaffG §1", n:"Besitz legaler Waffen ohne Waffenschein", w:1, gs:1, m:0, perStar:10000},
    {p:"WaffG §5.1", n:"Besitz illegaler Waffen", w:2, gs:1, m:0, perStar:10000},
    {p:"WaffG §8.1", n:"Offenes Tragen einer Waffe", w:0, gs:1, m:5000},
    {p:"WaffG §8.2", n:"Tragen einer Waffe in staatl. Einrichtungen", w:0, gs:1, m:5000},
    {p:"WaffG §11", n:"Ungesetzlicher Waffenhandel (An- & Verkauf)", w:3, gs:0, m:25000}
  ]},

  { cat:"Sperrzonen / Absperrungen / Kapitalverbrechen (StGB)", items:[
    {p:"StGB §17", n:"Durchbrechen von Absperrungen", w:1, gs:1, m:15000},
    {p:"StGB §18", n:"Unerlaubtes Betreten militärisches Gelände", w:5, gs:0, m:50000},
    {p:"StGB §18.1", n:"Unerlaubtes Betreten von Sperrzonen", w:2, gs:1, m:25000},
    {p:"StGB §18.1", n:"Unerlaubtes Befahren von Sperrzonen", w:2, gs:1, m:25000},
    {p:"StGB §25", n:"Terrorismus (deckt alle Strafen ab)", w:3, gs:0, m:25000}
  ]},

  { cat:"Betäubungsmittelgesetz (BtMG)", items:[
    {p:"BtMG §2.1", n:"Kokainbesitz Klein (11–30)", w:0, gs:1, m:15000},
    {p:"BtMG §2.1", n:"Marihuana Besitz Klein (21–30)", w:0, gs:1, m:15000},
    {p:"BtMG §2.1", n:"Drogenbesitz Mittel (31–50)", w:1, gs:0, m:20000},
    {p:"BtMG §2.1", n:"Drogenbesitz Groß (50+)", w:2, gs:0, m:30000},
    {p:"BtMG §2.2", n:"Drogenhandel (An- & Verkauf)", w:3, gs:0, m:30000},
    {p:"BtMG §2.1", n:"Drogen Herstellung", w:3, gs:0, m:30000},
    {p:"BtMG §3", n:"Verkauf Med. Produkte bis 20 Gegenstände", w:1, gs:0, m:10000},
    {p:"BtMG §3", n:"Verkauf Med. Produkte bis 50 Gegenstände", w:1, gs:1, m:20000},
    {p:"BtMG §3", n:"Verkauf Med. Produkte ab 51 Gegenstände", w:1, gs:2, m:25000}
  ]},

  { cat:"Strafprozessordnung (StPO)", items:[
    {p:"§6 StPO", n:"Bußgelder nicht bezahlt (500k voll)", w:5, gs:0, m:0, note:"(500k voll)"}
  ]}
];

window.loadLaws = function(){
  try{
    const raw = localStorage.getItem("LAWS");
    if(raw) return JSON.parse(raw);
  }catch{}
  return window.DEFAULT_LAWS;
};
window.saveLaws = function(laws){
  localStorage.setItem("LAWS", JSON.stringify(laws));
};
