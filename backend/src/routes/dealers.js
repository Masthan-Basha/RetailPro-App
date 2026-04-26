const router = require('express').Router();
const auth   = require('../middleware/auth');
const prisma = require('../config/db');
router.use(auth);

router.get('/', async (req, res) => {
  try {
    const dealers = await prisma.dealer.findMany({
      where: { userId: req.user._id },
      orderBy: { updatedAt: 'desc' }
    });
    res.json(dealers.map(d => ({ _id: d.id, ...d })));
  }
  catch (e) { res.status(500).json({ message: e.message }); }
});

router.get('/pending', async (req, res) => {
  try {
    const dealers = await prisma.dealer.findMany({
      where: { userId: req.user._id, pending: { gt: 0 } },
      orderBy: { pending: 'desc' }
    });
    res.json(dealers.map(d => ({ _id: d.id, ...d })));
  }
  catch (e) { res.status(500).json({ message: e.message }); }
});

router.post('/', async (req, res) => {
  try {
    const { _id, id, user, userId, createdAt, updatedAt, ...validData } = req.body;
    if (validData.totalOrdered !== undefined) validData.totalOrdered = Number(validData.totalOrdered) || 0;
    if (validData.totalPaid !== undefined) validData.totalPaid = Number(validData.totalPaid) || 0;
    if (validData.pending !== undefined) validData.pending = Number(validData.pending) || 0;
    const dealer = await prisma.dealer.create({
      data: { ...validData, userId: req.user._id }
    });
    res.status(201).json({ _id: dealer.id, ...dealer });
  }
  catch (e) { res.status(400).json({ message: e.message }); }
});

router.put('/:id', async (req, res) => {
  try {
    const d = await prisma.dealer.findFirst({ where: { id: req.params.id, userId: req.user._id } });
    if (!d) return res.status(404).json({ message: 'Dealer not found' });
    
    const { _id, id, user, userId, createdAt, updatedAt, ...data } = req.body;
    if (data.totalOrdered !== undefined) data.totalOrdered = Number(data.totalOrdered) || 0;
    if (data.totalPaid !== undefined) data.totalPaid = Number(data.totalPaid) || 0;
    if (data.pending !== undefined) data.pending = Number(data.pending) || 0;
    
    const updated = await prisma.dealer.update({
      where: { id: req.params.id },
      data
    });
    res.json({ _id: updated.id, ...updated });
  } catch (e) { res.status(400).json({ message: e.message }); }
});

router.post('/:id/settle', async (req, res) => {
  try {
    const d = await prisma.dealer.findFirst({ where: { id: req.params.id, userId: req.user._id } });
    if (!d) return res.status(404).json({ message: 'Dealer not found' });
    
    const amount = Math.min(parseFloat(req.body.amount) || 0, d.pending);
    const totalPaid = d.totalPaid + amount;
    const pending    = Math.max(0, d.totalOrdered - totalPaid);
    const status     = pending === 0 ? 'paid' : 'partial';
    
    const updated = await prisma.dealer.update({
      where: { id: req.params.id },
      data: { totalPaid, pending, status }
    });
    res.json({ _id: updated.id, ...updated });
  } catch (e) { res.status(400).json({ message: e.message }); }
});

router.delete('/:id', async (req, res) => {
  try {
    const d = await prisma.dealer.findFirst({ where: { id: req.params.id, userId: req.user._id } });
    if (!d) return res.status(404).json({ message: 'Dealer not found' });
    
    await prisma.dealer.delete({ where: { id: req.params.id } });
    res.json({ message: 'Deleted' });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

module.exports = router;
