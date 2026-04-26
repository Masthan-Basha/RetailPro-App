export const formatCurrency = (amount) =>
  new Intl.NumberFormat('en-IN',{style:'currency',currency:'INR',maximumFractionDigits:2}).format(amount||0);
export const formatDate = (d) => {
  if(!d) return '—';
  return new Intl.DateTimeFormat('en-IN',{day:'2-digit',month:'short',year:'numeric'}).format(new Date(d));
};
export const formatNumber = (n) => new Intl.NumberFormat('en-IN').format(n||0);
export const badgeColor = (status,C) => ({paid:C.green,pending:C.amber,overdue:C.red,partial:C.purple}[status]||C.textMuted);
export const badgeBg    = (status,C) => ({paid:C.greenBg,pending:C.amberBg,overdue:C.redBg,partial:C.purpleBg}[status]||C.bgElevated);
