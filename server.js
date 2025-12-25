const express = require("express");
const http = require("http");
const WebSocket = require("ws");
const bodyParser = require("body-parser");
const cors = require("cors");

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

app.use(cors());
app.use(bodyParser.json());

/* ===== USERS ===== */
const USERS = [
  {user:"ADMIN", pass:"9999", role:"admin"},
  {user:"LSPD", pass:"1234", role:"officer"},
  {user:"CADET", pass:"1111", role:"cadet"}
];

/* ===== STATE ===== */
let STATE = {
  persons: [],
  vehicles: [],
  weapons: [],
  calls: [],
  laws: [
    {p:"BtMG §2.1", d:"Drogenbesitz Klein", w:1, f:15000},
    {p:"BtMG §2.2", d:"Drogenhandel", w:3, f:30000}
  ]
};

/* ===== LOGIN ===== */
app.post("/login",(req,res)=>{
  const u = USERS.find(x=>x.user===req.body.user && x.pass===req.body.pass);
  if(!u) return res.status(401).json({ok:false});
  res.json({ok:true, role:u.role, user:u.user});
});

/* ===== WEBSOCKET ===== */
wss.on("connection", ws=>{
  ws.send(JSON.stringify({type:"INIT", data:STATE}));

  ws.on("message", msg=>{
    const p = JSON.parse(msg);
    if(p.type==="SYNC"){
      STATE = p.data;
      broadcast();
    }
  });
});

function broadcast(){
  const payload = JSON.stringify({type:"UPDATE", data:STATE});
  wss.clients.forEach(c=>{
    if(c.readyState===WebSocket.OPEN) c.send(payload);
  });
}

server.listen(3000,()=>console.log("MDT Backend läuft auf :3000"));
