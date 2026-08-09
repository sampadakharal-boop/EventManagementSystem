// server.js
require('dotenv').config();
const path = require('path');
const express = require('express');
const cookieParser = require('cookie-parser');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { get, run } = require('./db'); // ✅ correct — db.js is right here in backend/

const adminRoutes = require('./routes/admin');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(cookieParser());
app.use(express.static(path.join(__dirname, '../frontend')));

app.get('/', (req, res) => res.redirect('/signup.html'));

app.post('/api/signup', async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ success: false, message: 'All fields are required.' });
  }
  try {
    const existing = await get('SELECT id FROM users WHERE email = ?', [email]);
    if (existing) {
      return res.status(409).json({ success: false, message: 'That email is already registered.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await run(
      'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
      [name, email, hashedPassword, 'user']
    );

    return res.json({ success: true, message: 'Account created!' });
  } catch (err) {
    console.error('Signup error:', err);
    return res.status(500).json({ success: false, message: 'Something went wrong.' });
  }
});

app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'Email and password are required.' });
  }
  try {
    const user = await get('SELECT * FROM users WHERE email = ?', [email]);
    if (!user) return res.status(401).json({ success: false, message: 'Invalid email or password.' });

    const passwordMatches = await bcrypt.compare(password, user.password);
    if (!passwordMatches) return res.status(401).json({ success: false, message: 'Invalid email or password.' });

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.cookie('token', token, {
      httpOnly: true,
      maxAge: 60 * 60 * 1000
    });

    return res.json({
      success: true,
      message: `Welcome back, ${user.name}!`,
      role: user.role
    });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ success: false, message: 'Something went wrong.' });
  }
});

app.use('/api/admin', adminRoutes);

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});

module.exports = app;