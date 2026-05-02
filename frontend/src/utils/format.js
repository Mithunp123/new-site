export const formatINR = (amount) => {
  if (amount === null || amount === undefined) return '₹0';
  if (amount >= 10000000) return '₹' + (amount / 10000000).toFixed(2) + 'Cr';
  if (amount >= 100000) return '₹' + (amount / 100000).toFixed(2) + 'L';
  if (amount >= 1000) return '₹' + (amount / 1000).toFixed(1) + 'K';
  return '₹' + amount;
};

export const formatCount = (num) => {
  if (num === null || num === undefined) return '0';
  if (num >= 100000) return (num / 100000).toFixed(1) + 'L';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num.toString();
};

export const formatROI = (spend, revenue) => {
  if (!spend || !revenue) return '—';
  return (revenue / spend).toFixed(1) + 'x';
};

export const getInitials = (name) => {
  if (!name) return '';
  return name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase();
};

export const getAvatarColor = (id) => {
  const colors = ['#2563EB', '#F59E0B', '#10B981', '#8B5CF6', '#EC4899', '#06B6D4'];
  return colors[id % colors.length];
};
