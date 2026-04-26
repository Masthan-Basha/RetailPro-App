/**
 * Builds a professional HTML invoice for PDF generation.
 * @param {Object} invoice - Invoice data from backend
 * @param {string} shopName - Shop/business name
 * @returns {string} HTML string
 */
export function buildInvoiceHtml(invoice, shopName = 'RetailPro Store') {
  const inv = invoice;
  const items = Array.isArray(inv.items) ? inv.items : (typeof inv.items === 'string' ? JSON.parse(inv.items) : []);

  const itemsHtml = items.map(it => `
    <tr>
      <td>${it.name || '—'}</td>
      <td style="text-align:center;">${it.hsnCode || '—'}</td>
      <td style="text-align:center;">${it.qty || 1} ${it.unit || 'pcs'}</td>
      <td style="text-align:right;">₹${Number(it.price || 0).toFixed(2)}</td>
      <td style="text-align:center;">${it.gst || 0}%</td>
      <td style="text-align:right;">₹${(Number(it.qty || 1) * Number(it.price || 0) * (1 + (it.gst || 0) / 100)).toFixed(2)}</td>
    </tr>
  `).join('');

  const date = inv.createdAt ? new Date(inv.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
  const status = (inv.status || 'pending').toUpperCase();
  const statusColor = inv.status === 'paid' ? '#16a34a' : inv.status === 'partial' ? '#d97706' : '#dc2626';

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Arial', sans-serif; font-size: 13px; color: #1a1a2e; background: #fff; padding: 32px; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 28px; padding-bottom: 20px; border-bottom: 2px solid #2563eb; }
    .shop-name { font-size: 26px; font-weight: 700; color: #2563eb; }
    .invoice-tag { text-align: right; }
    .invoice-num { font-size: 22px; font-weight: 700; color: #0f172a; }
    .status-badge { display: inline-block; padding: 3px 12px; border-radius: 999px; font-size: 11px; font-weight: 700; color: #fff; background: ${statusColor}; margin-top: 4px; }
    .invoice-date { font-size: 12px; color: #64748b; margin-top: 4px; }
    .parties { display: flex; justify-content: space-between; margin-bottom: 24px; }
    .party h4 { font-size: 11px; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 6px; }
    .party p { font-size: 13px; color: #1a1a2e; line-height: 1.5; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
    thead tr { background: #2563eb; color: #fff; }
    thead th { padding: 9px 10px; text-align: left; font-size: 12px; font-weight: 600; }
    tbody tr:nth-child(even) { background: #f0f4fa; }
    tbody td { padding: 8px 10px; border-bottom: 1px solid #e2e8f0; font-size: 12px; }
    .totals { width: 280px; margin-left: auto; }
    .totals table td { border: none; padding: 5px 8px; }
    .total-row td { font-weight: 700; font-size: 14px; border-top: 2px solid #2563eb !important; color: #2563eb; }
    .payment-info { margin-top: 20px; padding: 12px 16px; background: #f0f4fa; border-radius: 8px; border-left: 4px solid #2563eb; }
    .payment-info p { font-size: 12px; color: #475569; margin-bottom: 3px; }
    .notes { margin-top: 16px; font-size: 12px; color: #64748b; font-style: italic; }
    .footer { margin-top: 36px; text-align: center; font-size: 11px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 12px; }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div class="shop-name">${shopName}</div>
      <p style="font-size:12px;color:#64748b;margin-top:4px;">Tax Invoice</p>
    </div>
    <div class="invoice-tag">
      <div class="invoice-num">${inv.invoiceNumber || '—'}</div>
      <span class="status-badge">${status}</span>
      <div class="invoice-date">Date: ${date}</div>
    </div>
  </div>

  <div class="parties">
    <div class="party">
      <h4>Bill To</h4>
      <p><strong>${inv.customerName || '—'}</strong></p>
      ${inv.customerPhone ? `<p>📞 ${inv.customerPhone}</p>` : ''}
      ${inv.customerAddress ? `<p>📍 ${inv.customerAddress}</p>` : ''}
    </div>
    <div class="party" style="text-align:right;">
      <h4>Payment</h4>
      <p>Mode: <strong>${(inv.paymentMode || 'cash').toUpperCase()}</strong></p>
      <p>Paid: <strong>₹${Number(inv.amountPaid || 0).toFixed(2)}</strong></p>
      ${Number(inv.balance || 0) > 0 ? `<p style="color:#dc2626;">Balance: <strong>₹${Number(inv.balance).toFixed(2)}</strong></p>` : ''}
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th>Item</th>
        <th style="text-align:center;">HSN</th>
        <th style="text-align:center;">Qty & Unit</th>
        <th style="text-align:right;">Price</th>
        <th style="text-align:center;">GST%</th>
        <th style="text-align:right;">Total</th>
      </tr>
    </thead>
    <tbody>${itemsHtml}</tbody>
  </table>

  <div class="totals">
    <table>
      <tr><td>Subtotal</td><td style="text-align:right;">₹${Number(inv.subtotal || 0).toFixed(2)}</td></tr>
      <tr><td>GST</td><td style="text-align:right;">₹${Number(inv.taxTotal || 0).toFixed(2)}</td></tr>
      <tr class="total-row"><td>Grand Total</td><td style="text-align:right;">₹${Number(inv.grandTotal || 0).toFixed(2)}</td></tr>
    </table>
  </div>

  ${inv.notes ? `<p class="notes">Notes: ${inv.notes}</p>` : ''}

  <div class="footer">
    Generated by RetailPro · ${new Date().toLocaleString('en-IN')}
  </div>
</body>
</html>`;
}
