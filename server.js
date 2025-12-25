// BEISPIEL FÜR DIE LOGIK IM BACKEND (server.js)
const USERS = [
    { name: "Officer_A", orga: "LSPD", rank: "Officer", isHR: false },
    { name: "Leader_B", orga: "LSPD", rank: "Chief", isHR: true },
    { name: "Agent_C", orga: "FIB", rank: "Director", isHR: true }
];

// Diese Funktion gibt nur die User zurück, die zur GLEICHEN Orga gehören
function getHRList(requestingUser) {
    if (!requestingUser.isHR) return []; // Kein Zugriff wenn kein HR
    
    // Filtert alle User, die "wartend" sind UND zur selben Orga gehören
    return ALL_PENDING_USERS.filter(u => u.requestedOrga === requestingUser.orga);
}
