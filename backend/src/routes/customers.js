const router   = require('express').Router();
const auth     = require('../middleware/auth');
const prisma   = require('../config/db');
router.use(auth);

router.get('/', async (req, res) => {
  try {
    const customers = await prisma.customer.findMany({
      where: { userId: req.user._id },
      orderBy: { updatedAt: 'desc' }
    });
    res.json(customers.map(c => ({ _id: c.id, ...c })));
  }
  catch (e) { res.status(500).json({ message: e.message }); }
});

router.get('/pending', async (req, res) => {
  try {
    const customers = await prisma.customer.findMany({
      where: { userId: req.user._id, pending: { gt: 0 } },
      orderBy: { pending: 'desc' }
    });
    res.json(customers.map(c => ({ _id: c.id, ...c })));
  }
  catch (e) { res.status(500).json({ message: e.message }); }
});

// Search customers by name or phone (for autocomplete in invoice creation)
router.get('/search', async (req, res) => {
  try {
    const q = (req.query.q || '').trim();
    if (!q) return res.json([]);
    const customers = await prisma.customer.findMany({
      where: {
        userId: req.user._id,
        OR: [
          { name:  { contains: q, mode: 'insensitive' } },
          { phone: { contains: q } }
        ]
      },
      orderBy: { name: 'asc' },
      take: 8
    });
    res.json(customers.map(c => ({ _id: c.id, ...c })));
  }
  catch (e) { res.status(500).json({ message: e.message }); }
});



router.post('/', async (req, res) => {
  try {
    const { _id, id, user, userId, createdAt, updatedAt, Invoices, ...validData } = req.body;
    if (validData.totalBilled !== undefined) validData.totalBilled = Number(validData.totalBilled) || 0;
    if (validData.totalPaid !== undefined) validData.totalPaid = Number(validData.totalPaid) || 0;
    if (validData.pending !== undefined) validData.pending = Number(validData.pending) || 0;
    const customer = await prisma.customer.create({
      data: { ...validData, userId: req.user._id }
    });
    res.status(201).json({ _id: customer.id, ...customer });
  }
  catch (e) { res.status(400).json({ message: e.message }); }
});

router.put('/:id', async (req, res) => {
  try {
    const c = await prisma.customer.findFirst({ where: { id: req.params.id, userId: req.user._id } });
    if (!c) return res.status(404).json({ message: 'Customer not found' });
    
    const { _id, id, user, userId, createdAt, updatedAt, Invoices, ...data } = req.body;
    if (data.totalBilled !== undefined) data.totalBilled = Number(data.totalBilled) || 0;
    if (data.totalPaid !== undefined) data.totalPaid = Number(data.totalPaid) || 0;
    if (data.pending !== undefined) data.pending = Number(data.pending) || 0;
    
    const updated = await prisma.customer.update({
      where: { id: req.params.id },
      data
    });
    res.json({ _id: updated.id, ...updated });
  } catch (e) { res.status(400).json({ message: e.message }); }
});

router.post('/:id/settle', async (req, res) => {
  try {
    const c = await prisma.customer.findFirst({ where: { id: req.params.id, userId: req.user._id } });
    if (!c) return res.status(404).json({ message: 'Customer not found' });
    
    const amount = Math.min(parseFloat(req.body.amount) || 0, c.pending);
    const totalPaid = c.totalPaid + amount;
    const pending    = Math.max(0, c.totalBilled - totalPaid);
    const status     = pending === 0 ? 'paid' : totalPaid > 0 ? 'partial' : 'pending';
    
    const updated = await prisma.customer.update({
      where: { id: req.params.id },
      data: { totalPaid, pending, status }
    });
    res.json({ _id: updated.id, ...updated });
  } catch (e) { res.status(400).json({ message: e.message }); }
});

router.delete('/:id', async (req, res) => {
  try {
    const c = await prisma.customer.findFirst({ where: { id: req.params.id, userId: req.user._id } });
    if (!c) return res.status(404).json({ message: 'Customer not found' });
    
    await prisma.customer.delete({ where: { id: req.params.id } });
    res.json({ message: 'Deleted' });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

module.exports = router;
