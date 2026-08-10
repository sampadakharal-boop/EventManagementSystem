// routes/admin.js
const express = require("express");
const bcrypt = require("bcryptjs");
const router = express.Router();
const { run } = require("../db");
const verifyAdmin = require("../middleware/verifyAdmin");

router.post("/setup-admin", async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({
      success: false,
      message: "Name, email, and password are required."
    });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    await run(
      `INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, 'admin')`,
      [name, email, hashedPassword]
    );

    res.json({
      success: true,
      message: "Admin account created."
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: "Could not create admin account. Email may already be in use."
    });
  }
});

// New route — checks if the logged-in user is really an admin
router.get("/verify", verifyAdmin, (req, res) => {
  res.json({ success: true });
});

module.exports = router;