export const formatINR = (amount) => {
  const n = Number(amount || 0);
  if (n >= 10000000) return '₹' + (n / 10000000).toFixed(2) + 'Cr';
  if (n >= 100000) return '₹' + (n / 100000).toFixed(2) + 'L';
  if (n >= 1000) return '₹' + (n / 1000).toFixed(1) + 'K';
  return '₹' + n;
};

export const formatCount = (num) => {
  const n = Number(num || 0);
  if (n >= 100000) return (n / 100000).toFixed(1) + 'L';
  if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
  return n.toString();
};

export const formatROI = (spend, revenue) => {
  if (!spend || !revenue) return '—';
  return (Number(revenue) / Number(spend)).toFixed(1) + 'x';
};

export const safeFixed = (value, decimals = 1) => {
  return Number(value || 0).toFixed(decimals);
};

export const getInitials = (name) => {
  if (!name) return '';
  return name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase();
};

export const getAvatarColor = (id) => {
  const colors = ['#2563EB', '#F59E0B', '#10B981', '#8B5CF6', '#EC4899', '#06B6D4'];
  return colors[id % colors.length];
};
