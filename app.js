const express = require("express");
const jwt = require("jsonwebtoken");
const path = require("path");
const app = express();
const PORT = 3000;
const JWT_SECRET = "random-secret-key";

let users = [];

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from root
app.use(express.static(__dirname));

// Logger middleware
function logger(req, res, next) {
  console.log(`${req.method} request on ${req.url}`);
  next();
}

// Home route
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

// Signup Route
app.post("/signup", logger, (req, res) => {
  const { username, password } = req.body;

  const existingUser = users.find((user) => user.username === username);
  if (existingUser) {
    return res.status(409).send("User already exists");
  }

  const token = jwt.sign({ username }, JWT_SECRET);
  users.push({ username, password, token, todos: [] });

  console.log("User signed up:", username);
  res.redirect("/index.html");
});

// Signin Route – with token match
app.post("/signin", logger, (req, res) => {
  const { username, password } = req.body;

  const foundUser = users.find(
    (user) => user.username === username && user.password === password
  );

  if (foundUser) {
    try {
      const decoded = jwt.verify(foundUser.token, JWT_SECRET);
      if (decoded.username === username) {
        console.log("Token verified & signin success:", username);
        return res.json({ token: foundUser.token });
      } else {
        return res.status(403).send("Token mismatch");
      }
    } catch (err) {
      return res.status(401).send("Invalid token");
    }
  } else {
    res.status(401).send("Invalid username or password");
  }
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
  res.json(user.todos);
});

// Add Todo
app.post("/api/todos", auth, (req, res) => {
  const { todo } = req.body;
  const user = users.find((u) => u.username === req.username);
  user.todos.push({ text: todo, done: false });
  res.json(user.todos);
});

// Toggle Done
app.put("/api/todos/:index", auth, (req, res) => {
  const index = req.params.index;
  const user = users.find((u) => u.username === req.username);
  if (user.todos[index]) {
    user.todos[index].done = !user.todos[index].done;
    res.json(user.todos);
  }
});

// Delete Todo
app.delete("/api/todos/:index", auth, (req, res) => {
  const index = req.params.index;
  const user = users.find((u) => u.username === req.username);
  user.todos.splice(index, 1);
  res.json(user.todos);
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
