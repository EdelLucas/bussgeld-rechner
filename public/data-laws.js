// Default laws (falls org noch nichts gesetzt hat)
// Admin/Leader kann per Admin/HR später "pro Orga" überschreiben.
window.DEFAULT_LAWS = [
  { cat:"Psychische & Physische Integrität (StGB)", items:[
    {p:"StGB §3.1", n:"Beleidigung", m:10000, w:0, gs:1},
    {p:"StGB §3.2", n:"Belästigung", m:10000, w:0, gs:1},
    {p:"StGB §3.3", n:"Drohung", m:5000, w:0, gs:0},
    {p:"StGB §4.1", n:"Versuchter Mord / Mord", m:30000, w:4, gs:0},
    {p:"StGB §4.2", n:"Körperverletzung", m:15000, w:2, gs:0},
    {p:"StGB §4.3", n:"Körperverletzung mit Todesfolge", m:20000, w:3, gs:0},
    {p:"StGB §4.4", n:"Gewaltsame Drohung", m:5000, w:0, gs:1},  // 5.000 pro ⭐ (hier über GS)
    {p:"StGB §4.5", n:"Fahrlässige Tötung", m:20000, w:3, gs:0},
    {p:"StGB §20", n:"Sachbeschädigung", m:5000, w:0, gs:2},
    {p:"StGB §21", n:"Unterlassene Hilfeleistung", m:5000, w:0, gs:0},
    {p:"StGB §26", n:"Prostitution", m:10000, w:0, gs:0},
    {p:"StGB §27", n:"Freiheitsberaubung / Geiselnahme / Entführung", m:30000, w:3, gs:0},
    {p:"StGB §28", n:"Errichtung von Straßenbarrikaden", m:10000, w:0, gs:2},
    {p:"StGB §31", n:"Verhalten in der Öffentlichkeit", m:5000, w:0, gs:0},
    {p:"StGB §32", n:"Rassismus / Nachstellung (Stalking)", m:15000, w:3, gs:0},
    {p:"StGB §38", n:"Fischwilderei", m:5000, w:0, gs:0},
    {p:"StGB §39", n:"Verleumdung", m:30000, w:0, gs:3},
    {p:"StGB §42", n:"Erpressung", m:45000, w:3, gs:0},
    {p:"StGB §43", n:"Androhung einer Straftat", m:20000, w:0, gs:3} // + 5.000 pro ⭐ -> GS
  ]},
  { cat:"Wirtschaftskriminalität (StGB)", items:[
    {p:"StGB §6/§9", n:"Diebstahl / Betrug", m:5000, w:0, gs:3},
    {p:"StGB §7", n:"Fahrzeug Diebstahl", m:10000, w:2, gs:0},
    {p:"StGB §10.1", n:"Besitz illegaler Gegenstände", m:10000, w:2, gs:0},
    {p:"StGB §11", n:"Raub", m:25000, w:3, gs:0},
    {p:"StGB §12.1", n:"Geschäfts Raub / Ammu Rob", m:35000, w:2, gs:0},
    {p:"StGB §12.3", n:"ATM Raub", m:5000, w:1, gs:0},
    {p:"StGB §13", n:"Einbruch", m:15000, w:2, gs:0},
    {p:"StGB §14", n:"Steuerhinterziehung", m:50000, w:3, gs:0},
    {p:"StGB §30", n:"Hausfriedensbruch", m:25000, w:3, gs:0},
    {p:"StGB §41.1", n:"Besitz staatliches Eigentum (Waffen)", m:50000, w:3, gs:0},
    {p:"StGB §41.2", n:"Besitz staatliches Eigentum (Gegenstände)", m:50000, w:3, gs:0}
  ]},
  { cat:"Umgang mit Beamten (StGB)", items:[
    {p:"StGB §15.1", n:"Nichtbeachten einer amtlichen Anweisung", m:10000, w:0, gs:2},
    {p:"StGB §15.2", n:"Entziehung polizeilicher Maßnahmen", m:10000, w:2, gs:0},
    {p:"StGB §15.3", n:"Behinderung eines Beamten bei der Arbeit", m:10000, w:1, gs:0},
    {p:"StGB §15.6", n:"Behinderung des EMS bei der Arbeit", m:10000, w:0, gs:2},
    {p:"StGB §15.4", n:"Bestechung von Beamten", m:10000, w:2, gs:0},
    {p:"StGB §15.5", n:"Widerstand gegen Vollstreckungsbeamte", m:20000, w:2, gs:0},
    {p:"StGB §15.7", n:"Nicht ausweisen bei polizeilicher/medizinischer Maßnahme", m:15000, w:1, gs:0},
    {p:"StGB §16", n:"Befreiung von Gefangenen", m:10000, w:3, gs:2},
    {p:"StGB §19", n:"Falsche Namensangabe", m:10000, w:0, gs:1},
    {p:"StGB §23", n:"Missbrauch von Notruf", m:30000, w:0, gs:2},
    {p:"StGB §24", n:"Amtsanmaßung", m:25000, w:2, gs:1},
    {p:"StGB §29", n:"Missachtung eines Platzverweises", m:20000, w:1, gs:1}
  ]},
  { cat:"Straßenverkehrsordnung (StVO)", items:[
    {p:"StVO §2", n:"Gefährdung anderer Verkehrsteilnehmer", m:10000, w:0, gs:0},
    {p:"StVO §4", n:"Missachten von Rechtsfahrgebot", m:8000, w:0, gs:0},
    {p:"StVO §5", n:"Überschreiten der Fahrzeugkapazitäten", m:5000, w:0, gs:0},
    {p:"StVO §6", n:"Fahren mit demoliertem Fahrzeug", m:2000, w:0, gs:0},
    {p:"StVO §7", n:"Fahren ohne Licht", m:5000, w:0, gs:0},
    {p:"StVO §8", n:"Geschwindigkeitsüberschreitung 10–40 km/h", m:5000, w:0, gs:0},
    {p:"StVO §8", n:"Geschwindigkeitsüberschreitung 41–60 km/h", m:10000, w:0, gs:0},
    {p:"StVO §8", n:"Geschwindigkeitsüberschreitung 61–100 km/h", m:15000, w:0, gs:0},
    {p:"StVO §8", n:"Geschwindigkeitsüberschreitung ab 101 km/h", m:20000, w:0, gs:0},
    {p:"StVO §9 Art. 3", n:"Fahren ohne gültige Zulassung", m:10000, w:0, gs:0},
    {p:"StVO §10 Art. 1", n:"Missachten von Rechts vor Links", m:1000, w:0, gs:0},
    {p:"StVO §10 Art. 2", n:"Missachten von Verkehrsschildern", m:2000, w:0, gs:0},
    {p:"StVO §10 Art. 4", n:"Fahren ohne genügend Tankkapazität", m:10000, w:0, gs:0},
    {p:"StVO §10 Art. 6", n:"Nutzung eines Mobilgeräts am Steuer", m:3000, w:0, gs:0},
    {p:"StVO §10 Art. 7", n:"Lärmbelästigung / Unnötiges Hupen", m:20000, w:0, gs:0},
    {p:"StVO §10 Art. 9(1)", n:"Überholen auf der rechten Fahrbahn", m:5000, w:0, gs:0},
    {p:"StVO §10 Art. 12", n:"Fahren abseits gekennzeichneter Wege", m:8000, w:0, gs:0},
    {p:"StVO §10 Art. 16", n:"Fahren entgegengesetzte Fahrtrichtung", m:30000, w:0, gs:0},
    {p:"StVO §12.1", n:"Falsch Parken / Halten", m:10000, w:0, gs:0},
    {p:"StVO §12.3", n:"Bergung aus nicht befahrbarem Gelände", m:20000, w:0, gs:0},
    {p:"StVO §17 Art. 1+2", n:"Fahren im berauschten Zustand", m:10000, w:0, gs:2},
    {p:"StVO §19", n:"Fahren ohne Erste-Hilfe-Kit", m:5000, w:0, gs:0},
    {p:"StVO §20", n:"Fahren ohne Gurt", m:5000, w:0, gs:0},
    {p:"StVO §24", n:"Fahrerflucht", m:10000, w:1, gs:0},
    {p:"StVO §26", n:"Abschleppkosten", m:15000, w:0, gs:0},
    {p:"StVO §28", n:"Sharing-Cars Anti-Radar nicht aus Verkehr gezogen", m:30000, w:3, gs:0}
  ]},
  { cat:"Waffengesetz (WaffG)", items:[
    {p:"WaffG §1", n:"Besitz legaler Waffen ohne Waffenschein", m:10000, w:1, gs:1},
    {p:"WaffG §5.1", n:"Besitz illegaler Waffen", m:10000, w:2, gs:1},
    {p:"WaffG §8.1", n:"Offenes Tragen einer Waffe", m:5000, w:0, gs:1},
    {p:"WaffG §8.2", n:"Tragen einer Waffe in staatl. Einrichtungen", m:5000, w:0, gs:1},
    {p:"WaffG §11", n:"Ungesetzlicher Waffenhandel (An- & Verkauf)", m:25000, w:3, gs:0}
  ]},
  { cat:"Sperrzonen / Absperrungen / Kapitalverbrechen (StGB)", items:[
    {p:"StGB §17", n:"Durchbrechen von Absperrungen", m:15000, w:1, gs:1},
    {p:"StGB §18", n:"Unerlaubtes Betreten militärisches Gelände", m:50000, w:5, gs:0},
    {p:"StGB §18.1", n:"Unerlaubtes Betreten von Sperrzonen", m:25000, w:2, gs:1},
    {p:"StGB §18.1", n:"Unerlaubtes Befahren von Sperrzonen", m:25000, w:2, gs:1},
    {p:"StGB §25", n:"Terrorismus (deckt alle Strafen ab)", m:25000, w:3, gs:0}
  ]},
  { cat:"Betäubungsmittelgesetz (BtMG)", items:[
    {p:"BtMG §2.1", n:"Kokainbesitz Klein (11–30)", m:15000, w:0, gs:1},
    {p:"BtMG §2.1", n:"Marihuana Besitz Klein (21–30)", m:15000, w:0, gs:1},
    {p:"BtMG §2.1", n:"Drogenbesitz Mittel (31–50)", m:20000, w:1, gs:0},
    {p:"BtMG §2.1", n:"Drogenbesitz Groß (50+)", m:30000, w:2, gs:0},
    {p:"BtMG §2.2", n:"Drogenhandel (An- & Verkauf)", m:30000, w:3, gs:0},
    {p:"BtMG §2.1", n:"Drogen Herstellung", m:30000, w:3, gs:0},
    {p:"BtMG §3", n:"Verkauf Medizinprodukte bis 20", m:10000, w:1, gs:0},
    {p:"BtMG §3", n:"Verkauf Medizinprodukte bis 50", m:20000, w:1, gs:1},
    {p:"BtMG §3", n:"Verkauf Medizinprodukte ab 51", m:25000, w:1, gs:2}
  ]},
  { cat:"Strafprozessordnung (StPO)", items:[
    {p:"§6 StPO", n:"Bußgelder nicht bezahlt (500k voll)", m:0, w:5, gs:0}
  ]}
];
