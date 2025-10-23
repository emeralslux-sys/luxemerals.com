import express from "express";
import bodyParser from "body-parser";
import fs from "fs";
import path from "path";
import bcrypt from "bcrypt";
import fetch from "node-fetch";
import { v4 as uuidv4 } from "uuid";

const app = express();
app.use(bodyParser.json());
const __dirname = path.resolve();

const USERS_FILE = path.join(__dirname, "users.json");
const ORDERS_FILE = path.join(__dirname, "orders.json");
const SALT_ROUNDS = 10;

function readJson(file){ if(!fs.existsSync(file)) return null; try{ return JSON.parse(fs.readFileSync(file)); }catch(e){return null;} }
function writeJson(file,data){ fs.writeFileSync(file, JSON.stringify(data, null, 2)); }

function getWebhook(){ return process.env.WEBHOOK_URL || (readJson(path.join(__dirname,'config.json'))||{}).webhook || ""; }

app.post("/api/init-director", async (req, res) => {
  const { username, password } = req.body;
  if(!username || !password) return res.status(400).json({ error: "username+password required" });
  const users = readJson(USERS_FILE) || [];
  if(users.find(u=>u.role==="director")) return res.status(400).json({ error: "Director already set" });
  const hash = await bcrypt.hash(password, SALT_ROUNDS);
  users.push({ id: uuidv4(), username, passHash: hash, role: "director" });
  writeJson(USERS_FILE, users);
  return res.json({ ok:true });
});

app.post("/api/login", async (req,res) => {
  const { username, password } = req.body;
  const users = readJson(USERS_FILE) || [];
  const u = users.find(x=>x.username === username);
  if(!u) return res.json({ success:false });
  const match = await bcrypt.compare(password, u.passHash);
  if(!match) return res.json({ success:false });
  return res.json({ success:true, role: u.role, username: u.username, id: u.id });
});

async function requireDirector(req,res,next){
  const { directorUsername, directorPassword } = req.body;
  if(!directorUsername || !directorPassword) return res.status(401).json({ error:"auth required" });
  const users = readJson(USERS_FILE) || [];
  const d = users.find(u=>u.username===directorUsername && u.role==="director");
  if(!d) return res.status(403).json({ error:"director not found" });
  const ok = await bcrypt.compare(directorPassword, d.passHash);
  if(!ok) return res.status(403).json({ error:"bad credentials" });
  req.director = d;
  next();
}

app.post("/api/add-user", requireDirector, async (req,res)=>{
  const { username, password, role="staff" } = req.body;
  if(!username || !password) return res.status(400).json({ error:"username+password required" });
  const users = readJson(USERS_FILE) || [];
  if(users.find(u=>u.username===username)) return res.status(400).json({ error:"user exists" });
  const hash = await bcrypt.hash(password, SALT_ROUNDS);
  const newU = { id: uuidv4(), username, passHash: hash, role };
  users.push(newU);
  writeJson(USERS_FILE, users);
  res.json({ ok:true, user: { id:newU.id, username:newU.username, role:newU.role } });
});

app.post("/api/remove-user", requireDirector, (req,res)=>{
  const { username } = req.body;
  if(!username) return res.status(400).json({ error:"username required" });
  let users = readJson(USERS_FILE) || [];
  users = users.filter(u=>u.username !== username);
  writeJson(USERS_FILE, users);
  res.json({ ok:true });
});

app.post("/api/set-webhook", requireDirector, (req,res)=>{
  const { webhook } = req.body;
  if(!webhook) return res.status(400).json({ error:"webhook required" });
  const cfg = readJson(path.join(__dirname,"config.json"))||{};
  cfg.webhook = webhook;
  writeJson(path.join(__dirname,"config.json"), cfg);
  res.json({ ok:true });
});

app.post("/api/order", async (req,res)=>{
  const o = req.body;
  if(!o || !o.items) return res.status(400).json({ error:"bad order" });
  const orders = readJson(ORDERS_FILE) || [];
  const id = uuidv4();
  const entry = { id, ...o, status: "in attesa", createdAt: new Date().toISOString() };
  orders.push(entry);
  writeJson(ORDERS_FILE, orders);

  const webhook = getWebhook();
  if(webhook){
    try{
      const content = `📦 **Nuovo Ordine**\nCliente: ${o.name}\nServizio: ${o.serviceType}\nTotale: ${o.total}\nDettagli: ${o.notes || "—"}\nOra: ${entry.createdAt}`;
      await fetch(webhook, { method:"POST", headers:{ "Content-Type":"application/json" }, body: JSON.stringify({ content }) });
    }catch(e){ console.warn("discord send failed", e.message); }
  }

  res.json({ ok:true, id });
});

app.get("/api/orders", (req,res)=>{ const orders = readJson(ORDERS_FILE) || []; res.json(orders); });

app.put("/api/order/:id/status", requireDirector, (req,res)=>{
  const id = req.params.id; const { status } = req.body;
  let orders = readJson(ORDERS_FILE) || []; const idx = orders.findIndex(o=>o.id===id);
  if(idx===-1) return res.status(404).json({ error:"not found" });
  orders[idx].status = status; writeJson(ORDERS_FILE, orders); res.json({ ok:true, order: orders[idx] });
});

app.get("/api/users",(req,res)=>{ const users = readJson(USERS_FILE) || []; res.json(users.map(u=>({ id:u.id, username:u.username, role:u.role }))); });

app.use(express.static(path.join(__dirname, "./")));
const PORT = process.env.PORT || 3000; app.listen(PORT, ()=>console.log("Server listening on", PORT));