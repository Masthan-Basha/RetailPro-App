require('dotenv').config();
const prisma = require('./src/config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

async function test() {
  try {
    const name = "Test User";
    const email = "test2@example.com";
    const password = "password123";
    const shopName = "Test Shop";

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { name, email, password: hashedPassword, shopName }
    });
    console.log("User created:", user);
    
    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '30d' });
    console.log("Token:", token);
  } catch (err) {
    console.error("Error:", err);
  } finally {
    prisma.$disconnect();
  }
}
test();
