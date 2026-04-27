const router = require('express').Router();
const jwt    = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const prisma = require('../config/db');
const auth   = require('../middleware/auth');
const sendEmail = require('../utils/mailer');
const { OAuth2Client } = require('google-auth-library');
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRE || '30d' });

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, shopName } = req.body;
    if (!name || !email || !password || !shopName)
      return res.status(400).json({ message: 'All fields are required' });
    
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing)
      return res.status(409).json({ message: 'Email already registered' });
    
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({ 
      data: { name, email, password: hashedPassword, shopName } 
    });
    
    res.status(201).json({ _id: user.id, name: user.name, email: user.email, shopName: user.shopName, token: signToken(user.id) });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) 
      return res.status(401).json({ message: 'Invalid email or password' });
      
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(401).json({ message: 'Invalid email or password' });
      
    res.json({ _id: user.id, name: user.name, email: user.email, shopName: user.shopName, token: signToken(user.id) });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// POST /api/auth/forgot-password
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(404).json({ message: 'User not found' });

    const resetToken = crypto.randomBytes(20).toString('hex');
    const resetExpire = new Date(Date.now() + 3600000); // 1 hour

    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetPasswordToken: resetToken,
        resetPasswordExpires: resetExpire
      }
    });

    const resetUrl = `retailpro://reset-password?token=${resetToken}`;
    const message = `You are receiving this email because you (or someone else) have requested the reset of a password. \n\n Please click on the following link, or paste this into your browser to complete the process: \n\n ${resetUrl}`;

    try {
      await sendEmail({
        to: user.email,
        subject: 'Password Reset Token',
        text: message
      });
      res.status(200).json({ message: 'Email sent' });
    } catch (err) {
      console.error('SMTP Error:', err.message);
      console.log('--------------------------------------------------');
      console.log('DEV MODE: SMTP failed or keys missing.');
      console.log('RESET URL:', resetUrl);
      console.log('--------------------------------------------------');
      
      // If in development, return success anyway and provide the token in the response for testing
      if (process.env.NODE_ENV === 'development' || !process.env.EMAIL_PASS || process.env.EMAIL_PASS === 'your-gmail-app-password') {
        return res.status(200).json({ 
          message: 'DEV: Email skipped, check console or use this token', 
          devToken: resetToken,
          devUrl: resetUrl 
        });
      }

      await prisma.user.update({
        where: { id: user.id },
        data: { resetPasswordToken: null, resetPasswordExpires: null }
      });
      return res.status(500).json({ message: 'Email could not be sent. Check backend console for details.' });
    }
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// POST /api/auth/reset-password/:token
router.post('/reset-password/:token', async (req, res) => {
  try {
    const { password } = req.body;
    const user = await prisma.user.findFirst({
      where: {
        resetPasswordToken: req.params.token,
        resetPasswordExpires: { gt: new Date() }
      }
    });

    if (!user) return res.status(400).json({ message: 'Invalid or expired token' });

    const hashedPassword = await bcrypt.hash(password, 10);
    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        resetPasswordToken: null,
        resetPasswordExpires: null
      }
    });

    res.status(200).json({ message: 'Password reset successful' });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// POST /api/auth/google-login
router.post('/google-login', async (req, res) => {
  try {
    const { idToken } = req.body;
    if (!idToken) return res.status(400).json({ message: 'ID Token is required' });

    let googleId, email, name, picture;

    // --- MOCK CHECK FOR DEV ---
    if (idToken === 'mock-token-123' || (process.env.GOOGLE_CLIENT_ID === 'your-google-client-id.apps.googleusercontent.com')) {
      console.log('DEV MODE: Using Mock Google Auth');
      googleId = 'mock-google-id-123';
      email = 'testuser@gmail.com';
      name = 'Test Google User';
    } else {
      const ticket = await client.verifyIdToken({
        idToken,
        audience: process.env.GOOGLE_CLIENT_ID,
      });
      const payload = ticket.getPayload();
      googleId = payload.sub;
      email = payload.email;
      name = payload.name;
      picture = payload.picture;
    }

    let user = await prisma.user.findUnique({ where: { googleId } });
    
    if (!user) {
      // Check if user exists with this email
      user = await prisma.user.findUnique({ where: { email } });
      if (user) {
        // Link googleId to existing user
        user = await prisma.user.update({
          where: { id: user.id },
          data: { googleId }
        });
      } else {
        // Create new user
        user = await prisma.user.create({
          data: {
            name,
            email,
            password: await bcrypt.hash(crypto.randomBytes(16).toString('hex'), 10), // Random password
            shopName: `${name}'s Shop`,
            googleId
          }
        });
      }
    }

    res.json({ 
      _id: user.id, 
      name: user.name, 
      email: user.email, 
      shopName: user.shopName, 
      token: signToken(user.id) 
    });
  } catch (err) { 
    console.error('Google Login Error:', err);
    res.status(401).json({ message: 'Google authentication failed' }); 
  }
});

// GET /api/auth/me
router.get('/me', auth, (req, res) => res.json(req.user));

module.exports = router;
