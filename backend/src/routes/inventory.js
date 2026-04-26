const router    = require('express').Router();
const auth      = require('../middleware/auth');
const prisma    = require('../config/db');
router.use(auth);

router.get('/', async (req, res) => {
  try { 
    const items = await prisma.inventory.findMany({
      where: { userId: req.user._id },
      orderBy: { createdAt: 'desc' }
    });
    res.json(items.map(i => ({ _id: i.id, ...i })));
  }
  catch (e) { res.status(500).json({ message: e.message }); }
});

router.get('/low-stock', async (req, res) => {
  try {
    const items = await prisma.inventory.findMany({ where: { userId: req.user._id } });
    res.json(items.filter(i => i.quantity <= i.threshold).map(i => ({ _id: i.id, ...i })));
  } catch (e) { res.status(500).json({ message: e.message }); }
});

router.get('/search', async (req, res) => {
  try {
    const q = req.query.q || '';
    const items = await prisma.inventory.findMany({ 
      where: { 
        userId: req.user._id, 
        name: { contains: q, mode: 'insensitive' } 
      },
      take: 10
    });
    res.json(items.map(i => ({ _id: i.id, ...i })));
  } catch (e) { res.status(500).json({ message: e.message }); }
});

router.get('/:id', async (req, res) => {
  try {
    const item = await prisma.inventory.findFirst({ where: { id: req.params.id, userId: req.user._id } });
    if (!item) return res.status(404).json({ message: 'Item not found' });
    res.json({ _id: item.id, ...item });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

router.post('/', async (req, res) => {
  try { 
    const { _id, id, user, userId, createdAt, updatedAt, ...validData } = req.body;
    if (validData.quantity !== undefined) validData.quantity = Number(validData.quantity) || 0;
    if (validData.threshold !== undefined) validData.threshold = Number(validData.threshold) || 0;
    if (validData.price !== undefined) validData.price = Number(validData.price) || 0;
    const item = await prisma.inventory.create({ data: { ...validData, userId: req.user._id } });
    res.status(201).json({ _id: item.id, ...item });
  }
  catch (e) { res.status(400).json({ message: e.message }); }
});

router.put('/:id', async (req, res) => {
  try {
    const item = await prisma.inventory.findFirst({ where: { id: req.params.id, userId: req.user._id } });
    if (!item) return res.status(404).json({ message: 'Item not found' });
    
    const { _id, id, user, userId, createdAt, updatedAt, ...data } = req.body;
    if (data.quantity !== undefined) data.quantity = Number(data.quantity) || 0;
    if (data.threshold !== undefined) data.threshold = Number(data.threshold) || 0;
    if (data.price !== undefined) data.price = Number(data.price) || 0;
    
    const updated = await prisma.inventory.update({
      where: { id: req.params.id },
      data
    });
    res.json({ _id: updated.id, ...updated });
  } catch (e) { res.status(400).json({ message: e.message }); }
});

router.delete('/:id', async (req, res) => {
  try {
    const item = await prisma.inventory.findFirst({ where: { id: req.params.id, userId: req.user._id } });
    if (!item) return res.status(404).json({ message: 'Item not found' });
    
    await prisma.inventory.delete({ where: { id: req.params.id } });
    res.json({ message: 'Deleted' });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

module.exports = router;
