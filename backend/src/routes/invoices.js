const router    = require('express').Router();
const auth      = require('../middleware/auth');
const prisma    = require('../config/db');
router.use(auth);

router.get('/', async (req, res) => {
  try {
    const { limit = 50, sort = '-createdAt', status } = req.query;
    const where = { userId: req.user._id };
    if (status && status !== 'all') where.status = status;
    
    const orderBy = {};
    if (sort.startsWith('-')) {
      orderBy[sort.slice(1)] = 'desc';
    } else {
      orderBy[sort] = 'asc';
    }
    
    const invoices = await prisma.invoice.findMany({
      where,
      orderBy,
      take: Number(limit) || 50
    });
    res.json(invoices.map(i => ({ _id: i.id, ...i })));
  } catch (e) { res.status(500).json({ message: e.message }); }
});

router.get('/:id', async (req, res) => {
  try {
    const inv = await prisma.invoice.findFirst({ where: { id: req.params.id, userId: req.user._id } });
    if (!inv) return res.status(404).json({ message: 'Invoice not found' });
    res.json({ _id: inv.id, ...inv });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

router.post('/', async (req, res) => {
  try {
    const { _id, id, user, userId, createdAt, updatedAt, customer, ...validData } = req.body;
    if (validData.subtotal !== undefined) validData.subtotal = Number(validData.subtotal) || 0;
    if (validData.taxTotal !== undefined) validData.taxTotal = Number(validData.taxTotal) || 0;
    if (validData.grandTotal !== undefined) validData.grandTotal = Number(validData.grandTotal) || 0;
    if (validData.amountPaid !== undefined) validData.amountPaid = Number(validData.amountPaid) || 0;
    if (validData.balance !== undefined) validData.balance = Number(validData.balance) || 0;

    // Always ensure invoiceNumber is set before create
    if (!validData.invoiceNumber || validData.invoiceNumber === '') {
      const ts = Date.now().toString().slice(-6);
      const rand = Math.floor(Math.random() * 900 + 100);
      validData.invoiceNumber = `INV-${ts}-${rand}`;
    }

    const inv = await prisma.invoice.create({ data: { ...validData, invoiceNumber: validData.invoiceNumber, userId: req.user._id } });

    // Deduct inventory stock for each item
    for (const item of (req.body.items || [])) {
       const inventoryItem = await prisma.inventory.findFirst({
         where: { userId: req.user._id, name: { equals: item.name, mode: 'insensitive' } }
       });
       if (inventoryItem) {
         await prisma.inventory.update({
           where: { id: inventoryItem.id },
           data: { quantity: { decrement: (item.qty || 0) } }
         });
       }
    }

    // Update or create customer pending record
    if (inv.customerName && inv.balance > 0) {
      const existingCust = await prisma.customer.findFirst({
        where: { userId: req.user._id, name: inv.customerName }
      });
      if (existingCust) {
        await prisma.customer.update({
          where: { id: existingCust.id },
          data: {
            totalBilled: { increment: inv.grandTotal },
            totalPaid: { increment: inv.amountPaid },
            pending: { increment: inv.balance },
            status: inv.status === 'paid' ? 'paid' : inv.amountPaid > 0 ? 'partial' : 'pending'
          }
        });
      } else {
        await prisma.customer.create({
          data: {
            userId: req.user._id,
            name: inv.customerName,
            phone: inv.customerPhone || '',
            address: inv.customerAddress || '',
            totalBilled: inv.grandTotal,
            totalPaid: inv.amountPaid,
            pending: inv.balance,
            status: inv.status === 'paid' ? 'paid' : inv.amountPaid > 0 ? 'partial' : 'pending'
          }
        });
      }
    }

    res.status(201).json({ _id: inv.id, ...inv });
  } catch (e) { res.status(400).json({ message: e.message }); }
});

router.put('/:id', async (req, res) => {
  try {
    const invTest = await prisma.invoice.findFirst({ where: { id: req.params.id, userId: req.user._id } });
    if (!invTest) return res.status(404).json({ message: 'Invoice not found' });
    
    const { _id, id, user, userId, createdAt, updatedAt, customer, ...data } = req.body;
    if (data.subtotal !== undefined) data.subtotal = Number(data.subtotal) || 0;
    if (data.taxTotal !== undefined) data.taxTotal = Number(data.taxTotal) || 0;
    if (data.grandTotal !== undefined) data.grandTotal = Number(data.grandTotal) || 0;
    if (data.amountPaid !== undefined) data.amountPaid = Number(data.amountPaid) || 0;
    if (data.balance !== undefined) data.balance = Number(data.balance) || 0;
    
    const inv = await prisma.invoice.update({
      where: { id: req.params.id },
      data
    });
    res.json({ _id: inv.id, ...inv });
  } catch (e) { res.status(400).json({ message: e.message }); }
});

router.delete('/:id', async (req, res) => {
  try {
    const invTest = await prisma.invoice.findFirst({ where: { id: req.params.id, userId: req.user._id } });
    if (!invTest) return res.status(404).json({ message: 'Invoice not found' });
    
    await prisma.invoice.delete({ where: { id: req.params.id } });
    res.json({ message: 'Deleted' });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

module.exports = router;
