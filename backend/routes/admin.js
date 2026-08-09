// routes/admin.js
const express = require("express");
const bcrypt = require("bcryptjs");
const router = express.Router();
const { run } = require("../db"); // ✅ correct — goes up one level from routes/, into backend/, finds db.js

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

module.exports = router;