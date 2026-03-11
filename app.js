const $ = (id) => document.getElementById(id);

const LAW_DATA = [
  { id: "stgb-3-1", group: "Psychische & Physische Integrität (StGB)", section: "STGB", para: "StGB §3.1", name: "Beleidigung", fineType: "fixed", fine: 10000, fixedWanted: 0, grayWantedMax: 1 },
  { id: "stgb-3-2", group: "Psychische & Physische Integrität (StGB)", section: "STGB", para: "StGB §3.2", name: "Belästigung", fineType: "fixed", fine: 10000, fixedWanted: 0, grayWantedMax: 1 },
  { id: "stgb-3-3", group: "Psychische & Physische Integrität (StGB)", section: "STGB", para: "StGB §3.3", name: "Drohung", fineType: "fixed", fine: 5000, fixedWanted: 0, grayWantedMax: 0 },
  { id: "stgb-4-1", group: "Psychische & Physische Integrität (StGB)", section: "STGB", para: "StGB §4.1", name: "Versuchter Mord / Mord", fineType: "fixed", fine: 30000, fixedWanted: 4, grayWantedMax: 0 },
  { id: "stgb-4-2", group: "Psychische & Physische Integrität (StGB)", section: "STGB", para: "StGB §4.2", name: "Körperverletzung", fineType: "fixed", fine: 15000, fixedWanted: 2, grayWantedMax: 0 },
  { id: "stgb-4-3", group: "Psychische & Physische Integrität (StGB)", section: "STGB", para: "StGB §4.3", name: "Körperverletzung mit Todesfolge", fineType: "fixed", fine: 20000, fixedWanted: 3, grayWantedMax: 0 },
  { id: "stgb-4-4", group: "Psychische & Physische Integrität (StGB)", section: "STGB", para: "StGB §4.4", name: "Gewaltsame Drohung", fineType: "per_active_wanted", finePerWanted: 5000, fixedWanted: 1, grayWantedMax: 1, note: "5.000$ pro aktiviertem Wanted" },
  { id: "stgb-4-5", group: "Psychische & Physische Integrität (StGB)", section: "STGB", para: "StGB §4.5", name: "Fahrlässige Tötung", fineType: "fixed", fine: 20000, fixedWanted: 3, grayWantedMax: 0 },
  { id: "stgb-5", group: "Psychische & Physische Integrität (StGB)", section: "STGB", para: "StGB §5", name: "Sexuelle Belästigung", fineType: "base_plus_per_active_wanted", fine: 30000, finePerWanted: 10000, fixedWanted: 1, grayWantedMax: 2, note: "30.000$ + 10.000$ pro aktiviertem Wanted" },
  { id: "stgb-20", group: "Psychische & Physische Integrität (StGB)", section: "STGB", para: "StGB §20", name: "Sachbeschädigung", fineType: "fixed", fine: 5000, fixedWanted: 0, grayWantedMax: 2 },
  { id: "stgb-21", group: "Psychische & Physische Integrität (StGB)", section: "STGB", para: "StGB §21", name: "Unterlassene Hilfeleistung", fineType: "fixed", fine: 5000, fixedWanted: 0, grayWantedMax: 0 },
  { id: "stgb-26", group: "Psychische & Physische Integrität (StGB)", section: "STGB", para: "StGB §26", name: "Prostitution", fineType: "fixed", fine: 10000, fixedWanted: 0, grayWantedMax: 0 },
  { id: "stgb-27", group: "Psychische & Physische Integrität (StGB)", section: "STGB", para: "StGB §27", name: "Freiheitsberaubung / Geiselnahmen / Entführung", fineType: "fixed", fine: 30000, fixedWanted: 3, grayWantedMax: 0 },
  { id: "stgb-28", group: "Psychische & Physische Integrität (StGB)", section: "STGB", para: "StGB §28", name: "Errichtung von Straßenbarrikaden", fineType: "fixed", fine: 10000, fixedWanted: 0, grayWantedMax: 2 },
  { id: "stgb-31", group: "Psychische & Physische Integrität (StGB)", section: "STGB", para: "StGB §31", name: "Verhalten in der Öffentlichkeit", fineType: "fixed", fine: 5000, fixedWanted: 0, grayWantedMax: 0 },
  { id: "stgb-32", group: "Psychische & Physische Integrität (StGB)", section: "STGB", para: "StGB §32", name: "Rassismus / Nachstellung (Stalking)", fineType: "fixed", fine: 15000, fixedWanted: 3, grayWantedMax: 0 },
  { id: "stgb-38", group: "Psychische & Physische Integrität (StGB)", section: "STGB", para: "StGB §38", name: "Fischwilderei", fineType: "fixed", fine: 5000, fixedWanted: 0, grayWantedMax: 0 },
  { id: "stgb-39", group: "Psychische & Physische Integrität (StGB)", section: "STGB", para: "StGB §39", name: "Verleumdung", fineType: "fixed", fine: 30000, fixedWanted: 0, grayWantedMax: 3 },
  { id: "stgb-42", group: "Psychische & Physische Integrität (StGB)", section: "STGB", para: "StGB §42", name: "Erpressung", fineType: "fixed", fine: 45000, fixedWanted: 3, grayWantedMax: 0 },
  { id: "stgb-43", group: "Psychische & Physische Integrität (StGB)", section: "STGB", para: "StGB §43", name: "Androhung einer Straftat", fineType: "base_plus_per_active_wanted", fine: 20000, finePerWanted: 5000, fixedWanted: 0, grayWantedMax: 3, note: "20.000$ + 5.000$ pro aktiviertem Wanted" },

  { id: "stgb-6-9", group: "Wirtschaftskriminalität (StGB)", section: "STGB", para: "StGB §6 / §9", name: "Diebstahl / Betrug", fineType: "fixed", fine: 5000, fixedWanted: 0, grayWantedMax: 3 },
  { id: "stgb-7", group: "Wirtschaftskriminalität (StGB)", section: "STGB", para: "StGB §7", name: "Fahrzeug Diebstahl", fineType: "fixed", fine: 10000, fixedWanted: 2, grayWantedMax: 0 },
  { id: "stgb-10-1", group: "Wirtschaftskriminalität (StGB)", section: "STGB", para: "StGB §10.1", name: "Besitz illegaler Gegenstände", fineType: "fixed", fine: 10000, fixedWanted: 2, grayWantedMax: 0 },
  { id: "stgb-11", group: "Wirtschaftskriminalität (StGB)", section: "STGB", para: "StGB §11", name: "Raub", fineType: "fixed", fine: 25000, fixedWanted: 3, grayWantedMax: 0 },
  { id: "stgb-12-1", group: "Wirtschaftskriminalität (StGB)", section: "STGB", para: "StGB §12.1", name: "Geschäfts Raub / Ammu Rob", fineType: "fixed", fine: 35000, fixedWanted: 2, grayWantedMax: 0 },
  { id: "stgb-12-3", group: "Wirtschaftskriminalität (StGB)", section: "STGB", para: "StGB §12.3", name: "ATM Raub", fineType: "fixed", fine: 5000, fixedWanted: 1, grayWantedMax: 0 },
  { id: "stgb-13", group: "Wirtschaftskriminalität (StGB)", section: "STGB", para: "StGB §13", name: "Einbruch", fineType: "fixed", fine: 15000, fixedWanted: 2, grayWantedMax: 0 },
  { id: "stgb-14", group: "Wirtschaftskriminalität (StGB)", section: "STGB", para: "StGB §14", name: "Steuerhinterziehung", fineType: "fixed", fine: 50000, fixedWanted: 3, grayWantedMax: 0 },
  { id: "stgb-30", group: "Wirtschaftskriminalität (StGB)", section: "STGB", para: "StGB §30", name: "Hausfriedensbruch", fineType: "fixed", fine: 25000, fixedWanted: 3, grayWantedMax: 0 },
  { id: "stgb-41-1", group: "Wirtschaftskriminalität (StGB)", section: "STGB", para: "StGB §41.1", name: "Besitz staatliches Eigentum (Waffen)", fineType: "fixed", fine: 50000, fixedWanted: 3, grayWantedMax: 0, note: "Waffenscheinentzug" },
  { id: "stgb-41-2", group: "Wirtschaftskriminalität (StGB)", section: "STGB", para: "StGB §41.2", name: "Besitz staatliches Eigentum (Gegenstände)", fineType: "fixed", fine: 50000, fixedWanted: 3, grayWantedMax: 0 },

  { id: "stgb-15-1", group: "Umgang mit Beamten (StGB)", section: "STGB", para: "StGB §15.1", name: "Nichtbeachten einer amtlichen Anweisung", fineType: "fixed", fine: 10000, fixedWanted: 0, grayWantedMax: 2 },
  { id: "stgb-15-2", group: "Umgang mit Beamten (StGB)", section: "STGB", para: "StGB §15.2", name: "Entziehung polizeilicher Maßnahmen", fineType: "fixed", fine: 10000, fixedWanted: 2, grayWantedMax: 0 },
  { id: "stgb-15-3", group: "Umgang mit Beamten (StGB)", section: "STGB", para: "StGB §15.3", name: "Behinderung eines Beamten bei der Arbeit", fineType: "fixed", fine: 10000, fixedWanted: 1, grayWantedMax: 0 },
  { id: "stgb-15-6", group: "Umgang mit Beamten (StGB)", section: "STGB", para: "StGB §15.6", name: "Behinderung des EMS bei der Arbeit", fineType: "fixed", fine: 10000, fixedWanted: 0, grayWantedMax: 2 },
  { id: "stgb-15-4", group: "Umgang mit Beamten (StGB)", section: "STGB", para: "StGB §15.4", name: "Bestechung von Beamten", fineType: "fixed", fine: 10000, fixedWanted: 2, grayWantedMax: 0 },
  { id: "stgb-15-5", group: "Umgang mit Beamten (StGB)", section: "STGB", para: "StGB §15.5", name: "Widerstand gegen Vollstreckungsbeamte", fineType: "fixed", fine: 20000, fixedWanted: 2, grayWantedMax: 0 },
  { id: "stgb-15-7", group: "Umgang mit Beamten (StGB)", section: "STGB", para: "StGB §15.7", name: "Nicht ausweisen bei einer polizeilichen / Medizinischen Maßnahme", fineType: "fixed", fine: 15000, fixedWanted: 1, grayWantedMax: 0 },
  { id: "stgb-16", group: "Umgang mit Beamten (StGB)", section: "STGB", para: "StGB §16", name: "Befreiung von Gefangenen", fineType: "per_active_wanted", finePerWanted: 10000, fixedWanted: 3, grayWantedMax: 2, note: "10.000$ pro aktiviertem Wanted" },
  { id: "stgb-19", group: "Umgang mit Beamten (StGB)", section: "STGB", para: "StGB §19", name: "Falsche Namensangabe", fineType: "fixed", fine: 10000, fixedWanted: 0, grayWantedMax: 1 },
  { id: "stgb-23", group: "Umgang mit Beamten (StGB)", section: "STGB", para: "StGB §23", name: "Missbrauch von Notruf", fineType: "fixed", fine: 30000, fixedWanted: 0, grayWantedMax: 2 },
  { id: "stgb-24", group: "Umgang mit Beamten (StGB)", section: "STGB", para: "StGB §24", name: "Amtsanmaßung", fineType: "fixed", fine: 25000, fixedWanted: 2, grayWantedMax: 1 },
  { id: "stgb-29", group: "Umgang mit Beamten (StGB)", section: "STGB", para: "StGB §29", name: "Missachtung eines Platzverweises", fineType: "fixed", fine: 20000, fixedWanted: 1, grayWantedMax: 1 },

  { id: "stvo-2", group: "Straßenverkehrsordnung (StVO)", section: "STVO", para: "StVO §2", name: "Gefährdung anderer Verkehrsteilnehmer", fineType: "fixed", fine: 10000, fixedWanted: 0, grayWantedMax: 0 },
  { id: "stvo-4", group: "Straßenverkehrsordnung (StVO)", section: "STVO", para: "StVO §4", name: "Missachten von Rechtsfahrgebot", fineType: "fixed", fine: 8000, fixedWanted: 0, grayWantedMax: 0 },
  { id: "stvo-5", group: "Straßenverkehrsordnung (StVO)", section: "STVO", para: "StVO §5", name: "Überschreiten der Fahrzeugkapazitäten", fineType: "fixed", fine: 5000, fixedWanted: 0, grayWantedMax: 0 },
  { id: "stvo-6", group: "Straßenverkehrsordnung (StVO)", section: "STVO", para: "StVO §6", name: "Fahren mit demoliertem Fahrzeug", fineType: "fixed", fine: 2000, fixedWanted: 0, grayWantedMax: 0 },
  { id: "stvo-7", group: "Straßenverkehrsordnung (StVO)", section: "STVO", para: "StVO §7", name: "Fahren ohne Licht (Dunkelheit, Wetterverhältnissen)", fineType: "fixed", fine: 5000, fixedWanted: 0, grayWantedMax: 0 },
  { id: "stvo-8-10-40", group: "Straßenverkehrsordnung (StVO)", section: "STVO", para: "StVO §8", name: "Geschwindigkeitsüberschreitung 10 - 40 km/h", fineType: "fixed", fine: 5000, fixedWanted: 0, grayWantedMax: 0 },
  { id: "stvo-8-41-60", group: "Straßenverkehrsordnung (StVO)", section: "STVO", para: "StVO §8", name: "Geschwindigkeitsüberschreitung 41 - 60 km/h", fineType: "fixed", fine: 10000, fixedWanted: 0, grayWantedMax: 0 },
  { id: "stvo-8-61-100", group: "Straßenverkehrsordnung (StVO)", section: "STVO", para: "StVO §8", name: "Geschwindigkeitsüberschreitung 61 - 100 km/h", fineType: "fixed", fine: 15000, fixedWanted: 0, grayWantedMax: 0 },
  { id: "stvo-8-101plus", group: "Straßenverkehrsordnung (StVO)", section: "STVO", para: "StVO §8", name: "Geschwindigkeitsüberschreitung ab 101 km/h", fineType: "fixed", fine: 20000, fixedWanted: 0, grayWantedMax: 0 },
  { id: "stvo-9-art-3", group: "Straßenverkehrsordnung (StVO)", section: "STVO", para: "StVO §9 Art. 3", name: "Fahren ohne gültige Zulassung", fineType: "fixed", fine: 10000, fixedWanted: 0, grayWantedMax: 0 },
  { id: "stvo-10-art-1", group: "Straßenverkehrsordnung (StVO)", section: "STVO", para: "StVO §10 Art. 1", name: "Missachten von Rechts vor Links", fineType: "fixed", fine: 1000, fixedWanted: 0, grayWantedMax: 0 },
  { id: "stvo-10-art-2", group: "Straßenverkehrsordnung (StVO)", section: "STVO", para: "StVO §10 Art. 2", name: "Missachten von Verkehrsschildern", fineType: "fixed", fine: 2000, fixedWanted: 0, grayWantedMax: 0 },
  { id: "stvo-10-art-4", group: "Straßenverkehrsordnung (StVO)", section: "STVO", para: "StVO §10 Art. 4", name: "Fahren ohne genügend Tankkapazität", fineType: "fixed", fine: 10000, fixedWanted: 0, grayWantedMax: 0 },
  { id: "stvo-10-art-6", group: "Straßenverkehrsordnung (StVO)", section: "STVO", para: "StVO §10 Art. 6", name: "Nutzung eines Mobilgeräts am Steuer", fineType: "fixed", fine: 3000, fixedWanted: 0, grayWantedMax: 0 },
  { id: "stvo-10-art-7", group: "Straßenverkehrsordnung (StVO)", section: "STVO", para: "StVO §10 Art. 7", name: "Lärmbelästigung / Unnötiges Hupen", fineType: "fixed", fine: 20000, fixedWanted: 0, grayWantedMax: 0 },
  { id: "stvo-10-art-9-1", group: "Straßenverkehrsordnung (StVO)", section: "STVO", para: "StVO §10 Art. 9(1)", name: "Überholen auf der rechten Fahrbahn", fineType: "fixed", fine: 5000, fixedWanted: 0, grayWantedMax: 0 },
  { id: "stvo-10-art-12", group: "Straßenverkehrsordnung (StVO)", section: "STVO", para: "StVO §10 Art. 12", name: "Fahren abseits von gekennzeichneten Wegen", fineType: "fixed", fine: 8000, fixedWanted: 0, grayWantedMax: 0 },
  { id: "stvo-10-art-16", group: "Straßenverkehrsordnung (StVO)", section: "STVO", para: "StVO §10 Art. 16", name: "Fahren auf der entgegengesetzten Fahrtrichtung", fineType: "fixed", fine: 30000, fixedWanted: 0, grayWantedMax: 0 },
  { id: "stvo-12-1", group: "Straßenverkehrsordnung (StVO)", section: "STVO", para: "StVO §12.1", name: "Falsch Parken / Halten", fineType: "fixed", fine: 10000, fixedWanted: 0, grayWantedMax: 0 },
  { id: "stvo-12-3", group: "Straßenverkehrsordnung (StVO)", section: "STVO", para: "StVO §12.3", name: "Bergung aus nicht befahrbarem Gelände", fineType: "fixed", fine: 20000, fixedWanted: 0, grayWantedMax: 0 },
  { id: "stvo-17-art-1-2", group: "Straßenverkehrsordnung (StVO)", section: "STVO", para: "StVO §17 Art. 1+2", name: "Fahren im berauschten Zustand", fineType: "fixed", fine: 10000, fixedWanted: 0, grayWantedMax: 2 },
  { id: "stvo-19", group: "Straßenverkehrsordnung (StVO)", section: "STVO", para: "StVO §19", name: "Fahren ohne Erste-Hilfe-Kit (Kofferraum)", fineType: "fixed", fine: 5000, fixedWanted: 0, grayWantedMax: 0 },
  { id: "stvo-20", group: "Straßenverkehrsordnung (StVO)", section: "STVO", para: "StVO §20", name: "Fahren ohne Gurt (nicht angeschnallt)", fineType: "fixed", fine: 5000, fixedWanted: 0, grayWantedMax: 0 },
  { id: "stvo-24", group: "Straßenverkehrsordnung (StVO)", section: "STVO", para: "StVO §24", name: "Fahrerflucht", fineType: "fixed", fine: 10000, fixedWanted: 1, grayWantedMax: 0 },
  { id: "stvo-26", group: "Straßenverkehrsordnung (StVO)", section: "STVO", para: "StVO §26", name: "Abschleppkosten", fineType: "fixed", fine: 15000, fixedWanted: 0, grayWantedMax: 0, note: "15.000$ / 20.000$" },
  { id: "stvo-27", group: "Straßenverkehrsordnung (StVO)", section: "STVO", para: "StVO §27", name: "Fahren ohne KFZ Versicherung", fineType: "fixed", fine: 20000, fixedWanted: 0, grayWantedMax: 0 },
  { id: "stvo-28", group: "Straßenverkehrsordnung (StVO)", section: "STVO", para: "StVO §28", name: "Sharing-Cars mit Anti-Radar wurde nicht aus dem Verkehr gezogen", fineType: "fixed", fine: 30000, fixedWanted: 3, grayWantedMax: 0 },

  { id: "waffg-1", group: "Waffengesetz (WaffG)", section: "WAFFG", para: "WaffG §1", name: "Besitz legaler Waffen ohne Waffenschein", fineType: "per_active_wanted", finePerWanted: 10000, fixedWanted: 1, grayWantedMax: 1, note: "10.000$ pro aktiviertem Wanted" },
  { id: "waffg-5-1", group: "Waffengesetz (WaffG)", section: "WAFFG", para: "WaffG §5.1", name: "Besitz illegaler Waffen", fineType: "per_active_wanted", finePerWanted: 10000, fixedWanted: 2, grayWantedMax: 1, note: "10.000$ pro aktiviertem Wanted" },
  { id: "waffg-8-1", group: "Waffengesetz (WaffG)", section: "WAFFG", para: "WaffG §8.1", name: "Offenes Tragen einer Waffe", fineType: "fixed", fine: 5000, fixedWanted: 0, grayWantedMax: 1 },
  { id: "waffg-8-2", group: "Waffengesetz (WaffG)", section: "WAFFG", para: "WaffG §8.2", name: "Tragen einer Waffe in staatl. Einrichtungen", fineType: "fixed", fine: 5000, fixedWanted: 0, grayWantedMax: 1 },
  { id: "waffg-11", group: "Waffengesetz (WaffG)", section: "WAFFG", para: "WaffG §11", name: "Ungesetzlicher Waffenhandel (An- & Verkauf)", fineType: "fixed", fine: 25000, fixedWanted: 3, grayWantedMax: 0 },

  { id: "stgb-17-sperr", group: "Sperrzonen / Absperrungen / Kapitalverbrechen (StGB)", section: "STGB", para: "StGB §17", name: "Durchbrechen von Absperrungen", fineType: "fixed", fine: 15000, fixedWanted: 1, grayWantedMax: 1 },
  { id: "stgb-18", group: "Sperrzonen / Absperrungen / Kapitalverbrechen (StGB)", section: "STGB", para: "StGB §18", name: "Unerlaubtes Betreten eines militärischen Geländes", fineType: "fixed", fine: 50000, fixedWanted: 5, grayWantedMax: 0 },
  { id: "stgb-18-1", group: "Sperrzonen / Absperrungen / Kapitalverbrechen (StGB)", section: "STGB", para: "StGB §18.1", name: "Unerlaubtes Betreten von Sperrzonen", fineType: "fixed", fine: 25000, fixedWanted: 2, grayWantedMax: 1 },
  { id: "stgb-18-2", group: "Sperrzonen / Absperrungen / Kapitalverbrechen (StGB)", section: "STGB", para: "StGB §18.2", name: "Unerlaubtes Befahren von Sperrzonen", fineType: "fixed", fine: 25000, fixedWanted: 2, grayWantedMax: 1 },
  { id: "stgb-25", group: "Sperrzonen / Absperrungen / Kapitalverbrechen (StGB)", section: "STGB", para: "StGB §25", name: "Terrorismus (Deckt alle Strafen ab)", fineType: "fixed", fine: 25000, fixedWanted: 3, grayWantedMax: 0 },

  { id: "btmg-2-1-kokain-klein", group: "Betäubungsmittelgesetz (BtMG)", section: "BTMG", para: "BtMG §2.1", name: "Kokainbesitz Klein ab 11 - 30", fineType: "fixed", fine: 15000, fixedWanted: 0, grayWantedMax: 1 },
  { id: "btmg-2-1-weed-klein", group: "Betäubungsmittelgesetz (BtMG)", section: "BTMG", para: "BtMG §2.1", name: "Marihuana Besitz Klein 21 - 30", fineType: "fixed", fine: 15000, fixedWanted: 0, grayWantedMax: 1 },
  { id: "btmg-2-1-mittel", group: "Betäubungsmittelgesetz (BtMG)", section: "BTMG", para: "BtMG §2.1", name: "Drogenbesitz Mittel ab 31 - 50", fineType: "fixed", fine: 20000, fixedWanted: 1, grayWantedMax: 0 },
  { id: "btmg-2-1-gross", group: "Betäubungsmittelgesetz (BtMG)", section: "BTMG", para: "BtMG §2.1", name: "Drogenbesitz Groß 50+", fineType: "fixed", fine: 30000, fixedWanted: 2, grayWantedMax: 0 },
  { id: "btmg-2-2", group: "Betäubungsmittelgesetz (BtMG)", section: "BTMG", para: "BtMG §2.2", name: "Drogenhandel (An- & Verkauf)", fineType: "fixed", fine: 30000, fixedWanted: 3, grayWantedMax: 0 },
  { id: "btmg-2-1-herstellung", group: "Betäubungsmittelgesetz (BtMG)", section: "BTMG", para: "BtMG §2.1", name: "Drogen Herstellung", fineType: "fixed", fine: 30000, fixedWanted: 3, grayWantedMax: 0 },
  { id: "btmg-3-bis-20", group: "Betäubungsmittelgesetz (BtMG)", section: "BTMG", para: "BtMG §3", name: "Verkauf von Medizinprodukten bis 20 Medizinischen Gegenständen", fineType: "fixed", fine: 10000, fixedWanted: 1, grayWantedMax: 0 },
  { id: "btmg-3-bis-50", group: "Betäubungsmittelgesetz (BtMG)", section: "BTMG", para: "BtMG §3", name: "Verkauf von Medizinprodukten bis 50 Medizinischen Gegenständen", fineType: "fixed", fine: 20000, fixedWanted: 1, grayWantedMax: 1 },
  { id: "btmg-3-ab-51", group: "Betäubungsmittelgesetz (BtMG)", section: "BTMG", para: "BtMG §3", name: "Verkauf von Medizinprodukten ab 51 Medizinischen Gegenständen", fineType: "fixed", fine: 25000, fixedWanted: 1, grayWantedMax: 2 },

  { id: "stpo-6", group: "Strafprozessordnung (StPO)", section: "STPO", para: "§6 StPO", name: "Bußgelder nicht bezahlt (500k voll)", fineType: "fixed", fine: 500000, fixedWanted: 5, grayWantedMax: 0 }
];

const GROUP_ORDER = [
  "Psychische & Physische Integrität (StGB)",
  "Wirtschaftskriminalität (StGB)",
  "Umgang mit Beamten (StGB)",
  "Straßenverkehrsordnung (StVO)",
  "Waffengesetz (WaffG)",
  "Sperrzonen / Absperrungen / Kapitalverbrechen (StGB)",
  "Betäubungsmittelgesetz (BtMG)",
  "Strafprozessordnung (StPO)"
];

const state = {
  selected: new Set(),
  extraWantedById: {},
  search: "",
  longMode: false,
  autoReset: false
};

const els = {
  body: document.body,
  sections: $("catalogSections"),
  searchInput: $("searchInput"),
  selectedCount: $("selectedCount"),
  sumFine: $("sumFine"),
  sumWanted: $("sumWanted"),
  btnReset: $("btnReset"),
  btnCopy: $("btnCopy"),
  btnCopyLine: $("btnCopyLine"),
  copyStatus: $("copyStatus"),
  aktenLine: $("aktenLine"),
  aktenText: $("aktenText"),
  liveStamp: $("liveStamp"),
  rightsReadToggle: $("rightsReadToggle"),
  remorseToggle: $("remorseToggle"),
  repeatToggle: $("repeatToggle"),
  transportToggle: $("transportToggle"),
  systemWantedInput: $("systemWantedInput"),
  plateInput: $("plateInput"),
  placeInput: $("placeInput"),
  azInput: $("azInput"),
  modeToggle: $("modeToggle"),
  shortLabel: $("shortLabel"),
  longLabel: $("longLabel"),
  autoResetToggle: $("autoResetToggle"),
  pinSidebarToggle: $("pinSidebarToggle"),
  sidebar: $("sidebar"),
  fibcoCopyBtn: $("fibcoCopyBtn"),
  fibcoPreview: $("fibcoPreview"),
  themeDropdown: $("themeDropdown"),
  themeDropdownBtn: $("themeDropdownBtn"),
  themeDropdownMenu: $("themeDropdownMenu"),
  customColor1: $("customColor1"),
  customColor2: $("customColor2"),
  applyCustomTheme: $("applyCustomTheme")
};

const fibcoFieldIds = [
  "fibcoName",
  "fibcoCoId",
  "fibcoDate",
  "fibcoCodename",
  "fibcoPhone",
  "fibcoAgency",
  "fibcoFamily",
  "fibcoPassport",
  "fibcoBadge",
  "fibcoPersonnel",
  "fibcoPdaMain",
  "fibcoPdaVehicles",
  "fibcoIncident",
  "fibcoInterrogation",
  "fibcoWitness",
  "fibcoEvidence",
  "fibcoAccusation",
  "fibcoConclusion"
];

function formatMoney(value) {
  const amount = Math.round(Number(value) || 0);
  return `$${amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".")}`;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function getDate(now = new Date()) {
  return now.toLocaleDateString("de-DE");
}

function getTime(now = new Date(), withSeconds = true) {
  return now.toLocaleTimeString("de-DE", {
    hour: "2-digit",
    minute: "2-digit",
    second: withSeconds ? "2-digit" : undefined
  });
}

function getFilteredLaws() {
  const q = state.search.trim().toLowerCase();
  if (!q) return LAW_DATA;

  return LAW_DATA.filter((law) => {
    return (
      law.group.toLowerCase().includes(q) ||
      law.section.toLowerCase().includes(q) ||
      law.para.toLowerCase().includes(q) ||
      law.name.toLowerCase().includes(q) ||
      (law.note || "").toLowerCase().includes(q)
    );
  });
}

function getSelectedItems() {
  return LAW_DATA.filter((law) => state.selected.has(law.id));
}

function getSelectedGrayWanted(item) {
  const raw = Number(state.extraWantedById[item.id] || 0);
  return Math.max(0, Math.min(raw, Number(item.grayWantedMax || 0)));
}

function getActiveWanted(item) {
  return Number(item.fixedWanted || 0) + getSelectedGrayWanted(item);
}

function getDisplayFine(item) {
  const activeWanted = getActiveWanted(item);

  if (item.fineType === "per_active_wanted") {
    return Number(item.finePerWanted || 0) * activeWanted;
  }

  if (item.fineType === "base_plus_per_active_wanted") {
    return Number(item.fine || 0) + (Number(item.finePerWanted || 0) * activeWanted);
  }

  return Number(item.fine || 0);
}

function getEffectiveFine(item) {
  let fine = getDisplayFine(item);

  if (els.repeatToggle?.checked && item.section === "STVO") {
    fine *= 2;
  }

  return fine;
}

function renderWantedIcons(fixedWanted, selectedGray, grayMax) {
  let html = "";

  for (let i = 0; i < fixedWanted; i += 1) {
    html += `<span class="star-on">★</span>`;
  }

  for (let i = 0; i < selectedGray; i += 1) {
    html += `<span class="star-on">★</span>`;
  }

  for (let i = selectedGray; i < grayMax; i += 1) {
    html += `<span class="star-off">★</span>`;
  }

  if (!html) html = `<span class="star-off">—</span>`;
  return html;
}

function renderSummaryWantedIcons(count) {
  if (count <= 0) return "—";

  const capped = Math.min(count, 5);
  let icons = "";

  for (let i = 0; i < capped; i += 1) {
    icons += `<span class="star-on">★</span>`;
  }

  for (let i = capped; i < 5; i += 1) {
    icons += `<span class="star-off">★</span>`;
  }

  return `<span class="wanted-inline">${icons}<strong>${count}</strong></span>`;
}

function getFineDisplayText(item) {
  const fineText = formatMoney(getEffectiveFine(item));

  if (els.repeatToggle?.checked && item.section === "STVO") {
    return `${fineText} (x2)`;
  }

  return fineText;
}

function groupLaws(items) {
  const map = new Map();

  GROUP_ORDER.forEach((group) => {
    map.set(group, []);
  });

  items.forEach((item) => {
    if (!map.has(item.group)) map.set(item.group, []);
    map.get(item.group).push(item);
  });

  return Array.from(map.entries()).filter(([, laws]) => laws.length > 0);
}

function renderCatalog() {
  const filtered = getFilteredLaws();

  if (!filtered.length) {
    els.sections.innerHTML = `<div class="empty-card">Keine Treffer gefunden.</div>`;
    return;
  }

  const grouped = groupLaws(filtered);

  els.sections.innerHTML = grouped.map(([groupName, items]) => {
    const cards = items.map((item) => {
      const isSelected = state.selected.has(item.id);
      const selectedGray = getSelectedGrayWanted(item);
      const grayMax = Number(item.grayWantedMax || 0);

      return `
        <article class="card ${isSelected ? "is-selected" : ""}" data-id="${escapeHtml(item.id)}">
          <div class="card-top">
            <div class="card-para">${escapeHtml(item.para)}</div>
            <div class="card-link">↗</div>
          </div>

          <div class="card-name">${escapeHtml(item.name)}</div>
          <div class="card-fine">${escapeHtml(getFineDisplayText(item))}</div>
          <div class="card-note">${escapeHtml(item.note || "")}</div>

          <div class="card-bottom">
            <div class="card-stars">${renderWantedIcons(item.fixedWanted, selectedGray, grayMax)}</div>

            ${
              grayMax > 0
                ? `
                  <div class="gray-wanted-tools" data-stop-click="true">
                    <button class="gray-btn" type="button" data-minus="${escapeHtml(item.id)}">−</button>
                    <div class="gray-count">${selectedGray}/${grayMax}</div>
                    <button class="gray-btn" type="button" data-plus="${escapeHtml(item.id)}">+</button>
                  </div>
                `
                : ""
            }
          </div>
        </article>
      `;
    }).join("");

    return `
      <section class="catalog-section">
        <div class="section-title">${escapeHtml(groupName)}</div>
        <div class="cards">${cards}</div>
      </section>
    `;
  }).join("");
}

function getHighestFine(items) {
  if (!items.length) return 0;
  return Math.max(...items.map((item) => getEffectiveFine(item)));
}

function getHighestWanted(items) {
  if (!items.length) return 0;

  let highest = Math.max(...items.map((item) => getActiveWanted(item)));
  const systemWanted = Math.max(0, Number(els.systemWantedInput?.value || 0));

  highest += systemWanted;

  if (els.remorseToggle?.checked && highest > 0) {
    highest = Math.max(1, highest - 2);
  }

  return highest;
}

function buildCompactLine(items) {
  const date = getDate();
  const time = getTime(new Date(), false);
  const paras = items.map((item) => item.para).join(" + ");
  return `${date} | ${time} - ${paras || "—"}`;
}

function buildLongText(items, highestFine, highestWanted) {
  const lines = [];
  const az = els.azInput.value.trim();
  const plate = els.plateInput.value.trim();
  const place = els.placeInput.value.trim();

  lines.push(`Datum: ${getDate()}`);
  lines.push(`Uhrzeit: ${getTime()}`);

  if (az) lines.push(`Aktenzeichen: ${az}`);
  if (plate) lines.push(`Kennzeichen: ${plate}`);
  if (place) lines.push(`Ort: ${place}`);

  lines.push("");
  lines.push("Straftaten:");

  if (!items.length) {
    lines.push("- —");
  } else {
    items.forEach((item) => {
      const activeWanted = getActiveWanted(item);
      const graySelected = getSelectedGrayWanted(item);
      let row = `- ${item.para} ${item.name} | ${formatMoney(getEffectiveFine(item))} | Wanteds: ${activeWanted}`;

      if (graySelected > 0) {
        row += ` | Graue Wanteds aktiviert: ${graySelected}/${item.grayWantedMax}`;
      }

      if (item.note) {
        row += ` | Hinweis: ${item.note}`;
      }

      lines.push(row);
    });
  }

  lines.push("");
  lines.push(`Höchste Geldstrafe: ${formatMoney(highestFine)}`);
  lines.push(`Höchste Wanteds: ${highestWanted || "—"}`);
  lines.push(`Rechte vorgelesen: ${els.rightsReadToggle.checked ? "Ja" : "Nein"}`);
  lines.push(`TV-Abtransport: ${els.transportToggle.checked ? "Ja" : "Nein"}`);
  lines.push(`Aktenzeile: ${buildCompactLine(items)}`);

  return lines.join("\n");
}

function updateLiveStamp() {
  els.liveStamp.textContent = `${getDate()} | ${getTime()}`;
}

function updateModeLabels() {
  if (state.longMode) {
    els.shortLabel.classList.remove("is-active");
    els.longLabel.classList.add("is-active");
  } else {
    els.shortLabel.classList.add("is-active");
    els.longLabel.classList.remove("is-active");
  }
}

function updateSummary() {
  const items = getSelectedItems();
  const highestFine = getHighestFine(items);
  const highestWanted = getHighestWanted(items);

  els.selectedCount.textContent = String(items.length);
  els.sumFine.textContent = formatMoney(highestFine);
  els.sumWanted.innerHTML = renderSummaryWantedIcons(highestWanted);
  els.aktenLine.textContent = buildCompactLine(items);
  els.aktenText.value = state.longMode
    ? buildLongText(items, highestFine, highestWanted)
    : buildCompactLine(items);

  updateModeLabels();
}

function updateUI() {
  renderCatalog();
  updateSummary();
}

function resetAll() {
  state.selected.clear();
  state.extraWantedById = {};
  state.search = "";

  els.searchInput.value = "";
  els.systemWantedInput.value = "0";
  els.plateInput.value = "";
  els.placeInput.value = "";
  els.azInput.value = "";
  els.remorseToggle.checked = false;
  els.repeatToggle.checked = false;
  els.transportToggle.checked = false;
  els.rightsReadToggle.checked = false;
  els.copyStatus.textContent = "Nicht kopiert";

  updateUI();
}

async function copyToClipboard(text, okText, failText) {
  try {
    await navigator.clipboard.writeText(text);
    els.copyStatus.textContent = okText;

    if (state.autoReset) {
      setTimeout(() => {
        resetAll();
      }, 250);
    }
  } catch {
    els.copyStatus.textContent = failText;
  }
}

async function copyLine() {
  if (!els.rightsReadToggle.checked) {
    els.copyStatus.textContent = "Rechte nicht vorgelesen";
    return;
  }

  await copyToClipboard(
    els.aktenLine.textContent,
    "Zeile kopiert",
    "Zeile konnte nicht kopiert werden"
  );
}

async function copyAkte() {
  if (!els.rightsReadToggle.checked) {
    els.copyStatus.textContent = "Rechte nicht vorgelesen";
    return;
  }

  await copyToClipboard(
    els.aktenText.value,
    "Akte kopiert",
    "Akte konnte nicht kopiert werden"
  );
}

function closeAllModals() {
  document.body.classList.remove("modal-open");
  document.querySelectorAll(".modal-backdrop").forEach((modal) => {
    modal.classList.add("hidden");
  });
}

function openModal(id) {
  const modal = $(id);
  if (!modal) return;
  document.body.classList.add("modal-open");
  modal.classList.remove("hidden");
}

function setupModals() {
  document.querySelectorAll("[data-modal]").forEach((btn) => {
    btn.addEventListener("click", () => openModal(btn.dataset.modal));
  });

  document.querySelectorAll("[data-close-modal]").forEach((btn) => {
    btn.addEventListener("click", closeAllModals);
  });

  document.querySelectorAll(".modal-backdrop").forEach((modal) => {
    modal.addEventListener("click", (event) => {
      if (event.target === modal) closeAllModals();
    });
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeAllModals();
  });
}

function setupCatalogEvents() {
  els.sections.addEventListener("click", (event) => {
    const plus = event.target.closest("[data-plus]");
    const minus = event.target.closest("[data-minus]");
    const card = event.target.closest(".card");

    if (plus) {
      const item = LAW_DATA.find((law) => law.id === plus.dataset.plus);
      if (!item) return;

      const current = getSelectedGrayWanted(item);
      state.extraWantedById[item.id] = Math.min(current + 1, Number(item.grayWantedMax || 0));
      updateUI();
      return;
    }

    if (minus) {
      const item = LAW_DATA.find((law) => law.id === minus.dataset.minus);
      if (!item) return;

      const current = getSelectedGrayWanted(item);
      state.extraWantedById[item.id] = Math.max(current - 1, 0);
      updateUI();
      return;
    }

    if (!card) return;
    const id = card.dataset.id;
    if (!id) return;

    if (state.selected.has(id)) state.selected.delete(id);
    else state.selected.add(id);

    updateUI();
  });
}

function getFibcoValue(id, fallback = "") {
  const el = $(id);
  return el ? el.value.trim() : fallback;
}

function buildFibcoTemplate() {
  const name = getFibcoValue("fibcoName", "Name");
  const coId = getFibcoValue("fibcoCoId", "CO-ID-1");
  const date = getFibcoValue("fibcoDate", "Datum der Straftat");
  const codename = getFibcoValue("fibcoCodename", "[Codename]");
  const phone = getFibcoValue("fibcoPhone");
  const agency = getFibcoValue("fibcoAgency");
  const family = getFibcoValue("fibcoFamily");
  const passport = getFibcoValue("fibcoPassport");
  const badge = getFibcoValue("fibcoBadge");
  const personnel = getFibcoValue("fibcoPersonnel");
  const pdaMain = getFibcoValue("fibcoPdaMain");
  const pdaVehicles = getFibcoValue("fibcoPdaVehicles");
  const incident = getFibcoValue("fibcoIncident", "Am TT.MM.YYYY um HH:MM Uhr […]");
  const interrogation = getFibcoValue("fibcoInterrogation", "- ABC");
  const witness = getFibcoValue("fibcoWitness", "- ABC");
  const evidence = getFibcoValue("fibcoEvidence", "- ABC");
  const accusation = getFibcoValue("fibcoAccusation", "- ABC");
  const conclusion = getFibcoValue("fibcoConclusion", "[Schlussbetrachtung]");

  return [
    `${name} | ${coId} | ${date}`,
    "",
    `Codename: ${codename}`,
    "",
    `Telefonnummer: ${phone}`,
    `Behörde: ${agency}`,
    `Familie: ${family}`,
    "",
    `Reisepass: ${passport}`,
    `Dienstausweis: ${badge}`,
    `Personalakte: ${personnel}`,
    `PDA Hauptseite: ${pdaMain}`,
    `PDA Fahrzeugliste: ${pdaVehicles}`,
    "",
    `[Vorfall]`,
    `${incident}`,
    "",
    `[Befragung Tatverdächtiger]`,
    `${interrogation}`,
    "",
    `[Zeugen-/Aussagen]`,
    `${witness}`,
    "",
    `[Beweissammlung]`,
    `${evidence}`,
    "",
    `[Tatvorwurf]`,
    `${accusation}`,
    "",
    `[Schlussbetrachtung]`,
    `${conclusion}`
  ].join("\n");
}

function updateFibcoPreview() {
  if (!els.fibcoPreview) return;
  els.fibcoPreview.value = buildFibcoTemplate();
}

async function copyFibco() {
  try {
    await navigator.clipboard.writeText(els.fibcoPreview.value || "");
  } catch {}
}

function setupFibco() {
  fibcoFieldIds.forEach((id) => {
    const el = $(id);
    if (!el) return;
    el.addEventListener("input", updateFibcoPreview);
    el.addEventListener("change", updateFibcoPreview);
  });

  if (els.fibcoCopyBtn) {
    els.fibcoCopyBtn.addEventListener("click", copyFibco);
  }

  updateFibcoPreview();
}

function setActivePresetButton(themeName) {
  document.querySelectorAll("[data-theme-preset]").forEach((btn) => {
    btn.classList.toggle("is-active", btn.dataset.themePreset === themeName);
  });
}

function applyPresetTheme(themeName) {
  els.body.removeAttribute("style");
  els.body.setAttribute("data-theme", themeName);
  setActivePresetButton(themeName);
}

function applyCustomTheme(color1, color2) {
  els.body.setAttribute("data-theme", "custom");
  els.body.style.setProperty("--accent", color1);
  els.body.style.setProperty("--accent-2", color2);
  els.body.style.setProperty("--accent-soft", `${hexToRgba(color1, 0.12)}`);
  els.body.style.setProperty("--accent-border", `${hexToRgba(color2, 0.3)}`);
  setActivePresetButton("");
}

function hexToRgba(hex, alpha) {
  const clean = hex.replace("#", "");
  const full = clean.length === 3
    ? clean.split("").map((char) => char + char).join("")
    : clean;

  const bigint = parseInt(full, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;

  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function toggleThemeMenu(force) {
  const shouldOpen = typeof force === "boolean"
    ? force
    : els.themeDropdownMenu.classList.contains("hidden");

  els.themeDropdownMenu.classList.toggle("hidden", !shouldOpen);
}

function setupThemeDropdown() {
  els.themeDropdownBtn.addEventListener("click", (event) => {
    event.stopPropagation();
    toggleThemeMenu();
  });

  els.themeDropdownMenu.addEventListener("click", (event) => {
    event.stopPropagation();
  });

  document.querySelectorAll("[data-theme-preset]").forEach((btn) => {
    btn.addEventListener("click", () => {
      applyPresetTheme(btn.dataset.themePreset);
    });
  });

  els.applyCustomTheme.addEventListener("click", () => {
    applyCustomTheme(els.customColor1.value, els.customColor2.value);
  });

  document.addEventListener("click", () => {
    toggleThemeMenu(false);
  });
}

function setupInputs() {
  els.searchInput.addEventListener("input", (event) => {
    state.search = event.target.value || "";
    renderCatalog();
  });

  [
    els.remorseToggle,
    els.repeatToggle,
    els.transportToggle,
    els.rightsReadToggle,
    els.systemWantedInput,
    els.plateInput,
    els.placeInput,
    els.azInput
  ].forEach((el) => {
    el.addEventListener("input", updateSummary);
    el.addEventListener("change", updateSummary);
  });

  els.modeToggle.addEventListener("change", () => {
    state.longMode = !!els.modeToggle.checked;
    updateSummary();
  });

  els.autoResetToggle.addEventListener("change", () => {
    state.autoReset = !!els.autoResetToggle.checked;
  });

  els.pinSidebarToggle.addEventListener("change", () => {
    els.sidebar.classList.toggle("is-pinned", !!els.pinSidebarToggle.checked);
  });

  els.btnReset.addEventListener("click", resetAll);
  els.btnCopyLine.addEventListener("click", copyLine);
  els.btnCopy.addEventListener("click", copyAkte);
  els.aktenLine.addEventListener("click", copyLine);
}

function boot() {
  state.longMode = !!els.modeToggle.checked;
  state.autoReset = !!els.autoResetToggle.checked;

  setupModals();
  setupCatalogEvents();
  setupInputs();
  setupFibco();
  setupThemeDropdown();

  applyPresetTheme("mono");
  updateLiveStamp();
  updateUI();

  setInterval(() => {
    updateLiveStamp();
    updateSummary();
  }, 1000);
}

boot();
