const express = require("express");
const http = require("http");
const WebSocket = require("ws");
const fetch = (...a)=>import("node-fetch").then(({default:f})=>f(...a));

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

app.use(express.json());
app.use(express.static("public"));

const DISCORD = "https://discord.com/api/webhooks/1453855487937482894/dO3DP9IQw0xXnl6m62J4rqblUan0u38uya7zEJdtKgekuOXwe0oqdYiMfpGT6okIWSeg";

let users = [
 {u:"ADMIN",p:"9999",r:"admin"},
 {u:"LSPD",p:"1234",r:"officer"}
];

let state = {units:{}};

app.post("/login",(req,res)=>{
 const {u,p}=req.body;
 const f=users.find(x=>x.u===u && x.p===p);
 if(!f) return res.status(401).end();
 res.json({u:f.u,r:f.r});
});

function broadcast(){
 const msg=JSON.stringify(state);
 wss.clients.forEach(c=>c.readyState===1&&c.send(msg));
}

wss.on("connection",ws=>{
 ws.send(JSON.stringify(state));
 ws.on("message",m=>{
  const d=JSON.parse(m);
  state.units[d.unit]=d.status;
  broadcast();
  fetch(DISCORD,{
   method:"POST",
   headers:{"Content-Type":"application/json"},
   body:JSON.stringify({content:`🧾 ${d.unit} → ${d.status}`})
  });
 });
});

server.listen(3000,()=>console.log("MDT läuft auf :3000"));
