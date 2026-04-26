const router  = require('express').Router();
const auth    = require('../middleware/auth');
const prisma  = require('../config/db');
router.use(auth);

// GET /api/sales/summary
router.get('/summary', async (req, res) => {
  try {
    const uid = req.user._id;
    const now = new Date();
    const startOfDay   = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [todayInvs, monthInvs, allInvs] = await Promise.all([
      prisma.invoice.findMany({ where: { userId: uid, createdAt: { gte: startOfDay } } }),
      prisma.invoice.findMany({ where: { userId: uid, createdAt: { gte: startOfMonth } } }),
      prisma.invoice.findMany({ where: { userId: uid } }),
    ]);

    const sum = (arr, field) => arr.reduce((s, i) => s + (i[field] || 0), 0);
    const pendingInvs   = allInvs.filter(i => ['pending','partial','overdue'].includes(i.status));
    const overdueInvs   = allInvs.filter(i => i.status === 'overdue');
    
    const custPending = await prisma.customer.aggregate({
      where: { userId: uid, pending: { gt: 0 } },
      _sum: { pending: true }
    });
    
    const dealPending = await prisma.dealer.aggregate({
      where: { userId: uid, pending: { gt: 0 } },
      _sum: { pending: true }
    });

    res.json({
      todaySales:      sum(todayInvs, 'grandTotal'),
      invoicesToday:   todayInvs.length,
      monthSales:      sum(monthInvs, 'grandTotal'),
      pendingCustomer: custPending._sum.pending || 0,
      pendingDealer:   dealPending._sum.pending || 0,
      overdueCount:    overdueInvs.length,
    });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

// GET /api/sales/graph?period=weekly|daily|monthly
router.get('/graph', async (req, res) => {
  try {
    const uid    = req.user._id;
    const period = req.query.period || 'weekly';
    const now    = new Date();
    let data = [];

    if (period === 'weekly') {
      for (let i = 6; i >= 0; i--) {
        const d     = new Date(now); d.setDate(d.getDate() - i);
        const start = new Date(d.getFullYear(), d.getMonth(), d.getDate());
        const end   = new Date(start); end.setDate(end.getDate() + 1);
        const invs  = await prisma.invoice.findMany({ where: { userId: uid, createdAt: { gte: start, lt: end } } });
        data.push({ label: start.toLocaleDateString('en',{weekday:'short'}), sales: invs.reduce((s,i)=>s+(i.grandTotal||0),0), orders: invs.length });
      }
    } else if (period === 'monthly') {
      for (let i = 11; i >= 0; i--) {
        const start = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const end   = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
        const invs  = await prisma.invoice.findMany({ where: { userId: uid, createdAt: { gte: start, lt: end } } });
        data.push({ label: start.toLocaleDateString('en',{month:'short'}), sales: invs.reduce((s,i)=>s+(i.grandTotal||0),0), orders: invs.length });
      }
    } else {
      // daily — hourly
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      for (let h = 0; h < 24; h++) {
        const start = new Date(startOfDay); start.setHours(h);
        const end   = new Date(startOfDay); end.setHours(h + 1);
        const invs  = await prisma.invoice.findMany({ where: { userId: uid, createdAt: { gte: start, lt: end } } });
        data.push({ label: `${h}:00`, sales: invs.reduce((s,i)=>s+(i.grandTotal||0),0), orders: invs.length });
      }
    }
    res.json(data);
  } catch (e) { res.status(500).json({ message: e.message }); }
});

module.exports = router;
