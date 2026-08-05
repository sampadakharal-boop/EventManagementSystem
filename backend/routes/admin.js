// routes/admin.js

const express = require("express");
const bcrypt = require("bcryptjs");
const router = express.Router();
const db = require("../database/db"); // your database file

router.post("/setup-admin", async (req, res) => {
    const { username, password } = req.body;

    const hashedPassword = await bcrypt.hash(password, 10);

    await db.execute({
        sql: `
            INSERT INTO users (username, password, role)
            VALUES (?, ?, 'admin')
        `,
        args: [username, hashedPassword]
    });

    res.json({
        success: true,
        message: "Admin account created."
    });
});

module.exports = router;