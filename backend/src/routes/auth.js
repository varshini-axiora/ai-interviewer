import { Router } from 'express';
import { v4 as uuid } from 'uuid';

const router = Router();

// In-memory user store (demo mode)
const users = new Map();
// Temporary OTP store
const otpStore = new Map();

router.post('/signup', (req, res) => {
  const { email, password, fullName } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  // Check duplicate
  for (const [, user] of users) {
    if (user.email === email) {
      return res.status(409).json({ error: 'User already exists' });
    }
  }

  const id = uuid();
  const user = { id, email, fullName: fullName || email.split('@')[0], createdAt: new Date().toISOString() };
  users.set(id, { ...user, password });

  res.json({ user, token: id });
});

router.post('/login', (req, res) => {
  const { email, password } = req.body;

  for (const [, user] of users) {
    if (user.email === email && user.password === password) {
      const { password: _, ...userData } = user;
      return res.json({ user: userData, token: user.id });
    }
  }

  // Demo mode: auto-create user on login
  const id = uuid();
  const user = { id, email, fullName: email.split('@')[0], createdAt: new Date().toISOString() };
  users.set(id, { ...user, password });
  res.json({ user, token: id });
});

router.get('/me', (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  const user = users.get(token);
  if (!user) {
    // Demo: create on the fly
    const id = token || uuid();
    const demoUser = { id, email: 'demo@example.com', fullName: 'Demo User', createdAt: new Date().toISOString() };
    users.set(id, { ...demoUser, password: 'demo' });
    return res.json({ user: demoUser });
  }
  const { password: _, ...userData } = user;
  res.json({ user: userData });
});

router.post('/request-otp', (req, res) => {
  const { email } = req.body;
  
  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  // Generate a 6-digit OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  
  // Store OTP with an expiration of 10 minutes
  otpStore.set(email, {
    otp,
    expiresAt: Date.now() + 10 * 60 * 1000
  });

  // In a real application, send this via Email/SMS
  console.log(`\n🔑 [DEMO MODE] OTP for ${email} is: ${otp}\n`);

  res.json({ message: 'OTP sent successfully (check backend logs in dev)' });
});

router.post('/verify-otp', (req, res) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    return res.status(400).json({ error: 'Email and OTP are required' });
  }

  const record = otpStore.get(email);

  if (!record) {
    return res.status(400).json({ error: 'No OTP requested for this email' });
  }

  if (Date.now() > record.expiresAt) {
    otpStore.delete(email);
    return res.status(400).json({ error: 'OTP has expired' });
  }

  if (record.otp !== otp) {
    return res.status(400).json({ error: 'Invalid OTP' });
  }

  // Success! Clear the OTP
  otpStore.delete(email);

  // Auto-login or create user
  let userRecord = null;
  for (const [, u] of users) {
    if (u.email === email) {
      userRecord = u;
      break;
    }
  }

  if (!userRecord) {
    const id = uuid();
    userRecord = { id, email, fullName: email.split('@')[0], createdAt: new Date().toISOString() };
    users.set(id, userRecord);
  }

  res.json({ user: userRecord, token: userRecord.id });
});

export default router;
