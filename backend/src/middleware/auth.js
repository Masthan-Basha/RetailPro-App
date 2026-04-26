const jwt = require('jsonwebtoken');
const prisma = require('../config/db');

module.exports = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'No token provided' });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await prisma.user.findUnique({ where: { id: decoded.id } });
    if (!user) return res.status(401).json({ message: 'User not found' });
    
    // exclude password
    const { password, ...userWithoutPassword } = user;
    req.user = { _id: user.id, ...userWithoutPassword };
    next();
  } catch {
    res.status(401).json({ message: 'Invalid token' });
  }
};
