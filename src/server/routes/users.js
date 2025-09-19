const express = require('express');
const router = express.Router();

// Mock user data
let users = [
  { id: 1, username: 'admin', email: 'admin@webos.com' },
  { id: 2, username: 'user1', email: 'user1@webos.com' }
];

// GET /api/users - Get all users
router.get('/', (req, res) => {
  res.json({ success: true, users });
});

// POST /api/users/register - Register new user
router.post('/register', (req, res) => {
  const { username, email, password } = req.body;
  
  if (!username || !email || !password) {
    return res.status(400).json({ success: false, message: 'Missing required fields' });
  }

  const newUser = {
    id: users.length + 1,
    username,
    email
  };
  
  users.push(newUser);
  res.json({ success: true, user: newUser });
});

// POST /api/users/login - User login
router.post('/login', (req, res) => {
  const { username, password } = req.body;
  
  const user = users.find(u => u.username === username);
  if (!user) {
    return res.status(401).json({ success: false, message: 'Invalid credentials' });
  }
  
  res.json({ success: true, user, token: 'mock-jwt-token' });
});

module.exports = router;