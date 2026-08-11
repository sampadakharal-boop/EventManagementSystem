const express = require('express');
const verifyAdmin = require('../middleware/verifyAdmin');

const router = express.Router();

router.get('/verify', verifyAdmin, (req, res) => {
  res.json({ success: true });
});

module.exports = router;
