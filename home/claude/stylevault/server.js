const express = require("express");
const fs = require("fs");
const app = express();

app.use(express.json());
app.use(express.static("public"));

const USERS_FILE    = "./data/users.json";
const CLOTHING_FILE = "./data/clothing.json";

// ─── Helpers ─────────────────────────────────────────────
const read  = (file) => JSON.parse(fs.readFileSync(file, "utf8"));
const write = (file, data) => fs.writeFileSync(file, JSON.stringify(data, null, 2));

// ─── AUTH ─────────────────────────────────────────────────

app.post("/api/register", (req, res) => {
  const users = read(USERS_FILE);
  if (users.find(u => u.email === req.body.email)) {
    return res.json({ ok: false, error: "Email already registered" });
  }
  const user = {
    id:       Date.now(),
    name:     req.body.name,
    email:    req.body.email,
    password: req.body.password,
    role:     "user",
  };
  users.push(user);
  write(USERS_FILE, users);
  res.json({ ok: true, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
});

app.post("/api/login", (req, res) => {
  const users = read(USERS_FILE);
  const user  = users.find(
    u => u.email === req.body.email && u.password === req.body.password
  );
  if (!user) return res.json({ ok: false, error: "Incorrect email or password" });
  res.json({ ok: true, user: { id: user.id, name: user.name, email: user.email, role: user.role || "user" } });
});

// ─── USERS ────────────────────────────────────────────────

app.get("/api/users", (req, res) => {
  const users = read(USERS_FILE);
  res.json(users.map(u => ({ id: u.id, name: u.name, email: u.email, role: u.role || "user" })));
});

app.post("/api/deleteUser", (req, res) => {
  let users = read(USERS_FILE);
  const before = users.length;
  users = users.filter(u => u.id !== req.body.id);
  if (users.length === before) return res.json({ ok: false, error: "User not found" });
  write(USERS_FILE, users);
  res.json({ ok: true });
});

app.post("/api/updateUser", (req, res) => {
  const users = read(USERS_FILE);
  const user  = users.find(u => u.id === req.body.id);
  if (!user) return res.json({ ok: false, error: "User not found" });
  if (req.body.name     !== undefined) user.name     = req.body.name;
  if (req.body.role     !== undefined) user.role     = req.body.role;
  if (req.body.password !== undefined) user.password = req.body.password;
  write(USERS_FILE, users);
  res.json({ ok: true });
});

// PROMOTE / DEMOTE — called by the admin panel toggle button
app.post("/api/makeAdmin", (req, res) => {
  const users = read(USERS_FILE);
  // Accept either email or id
  const user = req.body.email
    ? users.find(u => u.email === req.body.email)
    : users.find(u => u.id   === req.body.id);
  if (!user) return res.json({ ok: false, error: "User not found" });
  user.role = req.body.role || "admin";   // pass role:"user" to demote
  write(USERS_FILE, users);
  res.json({ ok: true, message: `${user.email} is now ${user.role}` });
});

// ─── CLOTHING ─────────────────────────────────────────────

app.get("/api/clothing", (req, res) => {
  let items = read(CLOTHING_FILE);
  const { style, category, search } = req.query;
  if (style    && style    !== "all") items = items.filter(i => i.style    === style);
  if (category && category !== "all") items = items.filter(i => i.category === category);
  if (search) {
    const q = search.toLowerCase();
    items = items.filter(i => (i.name + i.brand + i.style + i.category).toLowerCase().includes(q));
  }
  res.json(items);
});

app.post("/api/clothing", (req, res) => {
  const items = read(CLOTHING_FILE);
  const item  = {
    id:        Date.now(),
    name:      req.body.name,
    brand:     req.body.brand     || "",
    style:     req.body.style     || "Casual",
    category:  req.body.category  || "Tops",
    price:     Number(req.body.price) || 0,
    salePrice: req.body.salePrice ? Number(req.body.salePrice) : null,
    emoji:     req.body.emoji     || "👕",
    photo:     req.body.photo     || "",
    link:      req.body.link      || "",
    badge:     req.body.badge     || "",
  };
  items.push(item);
  write(CLOTHING_FILE, items);
  res.json({ ok: true, item });
});

app.post("/api/updateClothing", (req, res) => {
  const items = read(CLOTHING_FILE);
  const idx   = items.findIndex(i => i.id === req.body.id);
  if (idx === -1) return res.json({ ok: false, error: "Item not found" });
  items[idx] = { ...items[idx], ...req.body };
  write(CLOTHING_FILE, items);
  res.json({ ok: true });
});

app.post("/api/deleteClothing", (req, res) => {
  let items = read(CLOTHING_FILE);
  items = items.filter(i => i.id !== req.body.id);
  write(CLOTHING_FILE, items);
  res.json({ ok: true });
});

// ─── START ────────────────────────────────────────────────
app.listen(3000, () => {
  console.log("✦ StyleVault running → http://localhost:3000");
});
