const express = require("express");
const jwt = require("jsonwebtoken");
const path = require("path");
const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = "random-secret-key";

let users = [];

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

// Logger middleware
function logger(req, res, next) {
  console.log(`${req.method} request on ${req.url}`);
  next();
}

// Home route
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Signup route
app.post("/signup", logger, (req, res) => {
  const { username, password } = req.body;

  const existingUser = users.find((user) => user.username === username);
  if (existingUser) {
    return res.status(409).send("User already exists");
  }

  const token = jwt.sign({ username }, JWT_SECRET);
  users.push({ username, password, todos: [] });

  console.log("User signed up:", username);
  res.json({ token });
});

// Signin route
app.post("/signin", logger, (req, res) => {
  const { username, password } = req.body;

  const foundUser = users.find(
    (user) => user.username === username && user.password === password
  );

  if (!foundUser) {
    return res.status(401).send("Invalid username or password");
  }

  const token = jwt.sign({ username }, JWT_SECRET);
  foundUser.token = token; // Optionally update stored token
  console.log("Signin success:", username);
  res.json({ token });
});

// Auth middleware
function auth(req, res, next) {
  const token = req.headers.token;
  if (!token) return res.status(403).json({ msg: "Token missing!" });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.username = decoded.username;
    next();
  } catch (err) {
    return res.status(401).json({ msg: "Invalid token" });
  }
}

// Get Todos
app.get("/api/todos", auth, (req, res) => {
  const user = users.find((u) => u.username === req.username);
  if (!user) return res.status(404).json({ msg: "User not found" });
  res.json(user.todos);
});

// Add Todo
app.post("/api/todos", auth, (req, res) => {
  const { todo } = req.body;
  const user = users.find((u) => u.username === req.username);
  if (!user) return res.status(404).json({ msg: "User not found" });

  user.todos.push({ text: todo, done: false });
  res.json(user.todos);
});

// Toggle Done
app.put("/api/todos/:index", auth, (req, res) => {
  const index = parseInt(req.params.index);
  const user = users.find((u) => u.username === req.username);
  if (!user || !user.todos[index])
    return res.status(404).json({ msg: "Todo not found" });

  user.todos[index].done = !user.todos[index].done;
  res.json(user.todos);
});

// Delete Todo
app.delete("/api/todos/:index", auth, (req, res) => {
  const index = parseInt(req.params.index);
  const user = users.find((u) => u.username === req.username);
  if (!user || !user.todos[index])
    return res.status(404).json({ msg: "Todo not found" });

  user.todos.splice(index, 1);
  res.json(user.todos);
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
