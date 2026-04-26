const prisma = require('./src/config/db');
async function run() {
  try {
    const user = await prisma.user.findFirst();
    if (!user) return console.log('No user found');
    console.log('Testing inventory create for user:', user.id);
    const item = await prisma.inventory.create({
      data: {
        name: 'Test Item',
        category: 'Other',
        hsnCode: '',
        quantity: 0,
        threshold: 10,
        unit: 'pcs',
        price: 0,
        supplier: '',
        userId: user.id
      }
    });
    console.log('Inventory created:', item);
  } catch (err) {
    console.error('Error creating inventory:', err);
  } finally {
    prisma.$disconnect();
  }
}
run();
