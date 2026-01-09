const express=require("express");
const http=require("http");
const WebSocket=require("ws");

const app=express();
const server=http.createServer(app);
const wss=new WebSocket.Server({server});

app.use(express.json());
app.use(express.static("public"));

const users=[
 {u:"ADMIN",p:"9999",r:"admin"},
 {u:"LSPD",p:"1234",r:"officer"}
];

let state={
 units:{},
 persons:[],
 vehicles:[]
};

app.post("/login",(req,res)=>{
 const f=users.find(x=>x.u===req.body.u&&x.p===req.body.p);
 if(!f)return res.sendStatus(401);
 res.json({u:f.u,r:f.r});
});

app.get("/data",(req,res)=>res.json(state));

wss.on("connection",ws=>{
 ws.send(JSON.stringify(state));
 ws.on("message",m=>{
  const d=JSON.parse(m);
  if(d.type==="unit")state.units[d.name]=d.status;
  if(d.type==="person")state.persons.push(d.data);
  if(d.type==="vehicle")state.vehicles.push(d.data);
  wss.clients.forEach(c=>c.readyState===1&&c.send(JSON.stringify(state)));
 });
});

server.listen(3000);
