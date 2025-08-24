const express = require("express");
const session = require("express-session");
const PgSession = require("connect-pg-simple")(session);
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const cors = require("cors");
const { Pool } = require("pg");

const app = express();
const PORT = 5000;

// PostgreSQL pool
const pool = new Pool({
  user: "postgres",
  host: "localhost",
  database: "peakform",
  password: "admin",
  port: 5432,
});

// Middleware
app.use(
  cors({
    origin: "http://localhost:5173", // React frontend URL
    credentials: true,
  })
);
app.use(express.json());

// -------------------
// Session middleware
// -------------------
app.use(
  session({
    store: new PgSession({ pool: pool, tableName: "session" }),
    secret: "your_session_secret",
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 15 * 60 * 1000, // 15 minutes
      httpOnly: true,
      sameSite: "lax",
    },
  })
);

// JWT secret
const JWT_SECRET = "your_jwt_secret";
const JWT_EXPIRES_IN = "15m";

// -------------------
// Signup route
// -------------------
app.post("/signup", async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password)
    return res.status(400).json({ error: "Missing fields" });

  try {
    const hash = await bcrypt.hash(password, 10);
    const result = await pool.query(
      "INSERT INTO users (name, email, password_hash) VALUES ($1, $2, $3) RETURNING id, name, email",
      [name, email, hash]
    );
    res.json({ user: result.rows[0] });
  } catch (err) {
    if (err.code === "23505")
      return res.status(400).json({ error: "Email already exists" });
    res.status(500).json({ error: err.message });
  }
});

// -------------------
// Login route
// -------------------
app.post("/login", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).json({ error: "Missing fields" });

  try {
    const result = await pool.query("SELECT * FROM users WHERE email=$1", [
      email,
    ]);
    if (result.rows.length === 0)
      return res.status(401).json({ error: "Invalid credentials" });

    const user = result.rows[0];
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) return res.status(401).json({ error: "Invalid credentials" });

    // -------------------
    // Create server-side session
    // -------------------
    req.session.user = { id: user.id, name: user.name, email: user.email };

    // -------------------
    // Generate JWT for API auth
    // -------------------
    const token = jwt.sign(
      { id: user.id, name: user.name, email: user.email },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    res.json({ token, user: req.session.user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// -------------------
// Middleware for JWT auth
// -------------------
const authMiddleware = async (req, res, next) => {
  const authHeader = req.headers["authorization"];
  if (!authHeader) return res.status(401).json({ error: "Missing token" });

  const token = authHeader.split(" ")[1]; // Bearer <token>
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;

    // Optional: check session still exists
    if (!req.session.user || req.session.user.id !== decoded.id) {
      return res.status(401).json({ error: "Session expired or invalid" });
    }

    next();
  } catch (err) {
    res.status(401).json({ error: "Invalid token" });
  }
};

// -------------------
// Protected route example
// -------------------
app.get("/profile", authMiddleware, (req, res) => {
  res.json({ user: req.user });
});

// -------------------
// Logout route
// -------------------
app.post("/logout", authMiddleware, (req, res) => {
  // Destroy server-side session
  req.session.destroy((err) => {
    if (err) return res.status(500).json({ error: "Logout failed" });
    res.clearCookie("connect.sid"); // remove cookie
    res.json({ message: "Logged out successfully" });
  });
});

// -------------------
// Start server
// -------------------
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
