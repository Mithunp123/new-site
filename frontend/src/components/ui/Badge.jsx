export default function Badge({ status, className = '' }) {
  const styles = {
    'active': 'bg-green-100 text-green-700',
    'creator_accepted': 'bg-purple-100 text-purple-700',
    'agreement_locked': 'bg-indigo-100 text-indigo-700',
    'in_review': 'bg-orange-100 text-orange-700',
    'content_uploaded': 'bg-orange-100 text-orange-700',
    'brief_ready': 'bg-blue-100 text-blue-700',
    'request_sent': 'bg-blue-100 text-blue-700',
    'completed': 'bg-slate-100 text-slate-600',
    'campaign_closed': 'bg-slate-100 text-slate-600',
    'escrow_released': 'bg-green-100 text-green-700',
    'brand_approved': 'bg-green-100 text-green-700',
    'posted_live': 'bg-green-100 text-green-700',
    'analytics_collected': 'bg-blue-100 text-blue-700',
    // Escrow
    'held': 'bg-orange-100 text-orange-700',
    'locked': 'bg-orange-100 text-orange-700',
    'released': 'bg-green-100 text-green-700',
    'pending': 'bg-slate-100 text-slate-500',
    // Payment
    'in_escrow': 'bg-orange-100 text-orange-700',
    'paid': 'bg-green-100 text-green-700',
    'declined': 'bg-red-100 text-red-600',
  };

  const labels = {
    'request_sent': 'Brief Sent',
    'creator_accepted': 'Accepted',
    'agreement_locked': 'Escrow Locked',
    'content_uploaded': 'In Review',
    'brand_approved': 'Approved',
    'posted_live': 'Live',
    'analytics_collected': 'Metrics In',
    'escrow_released': 'Payment Released',
    'campaign_closed': 'Completed',
    'held': '🔒 Locked',
    'locked': '🔒 Locked',
    'released': 'Released',
    'pending': 'Pending',
    'in_escrow': 'In Escrow',
    'paid': 'Paid',
    'active': 'Active',
    'in_review': 'In Review',
    'brief_ready': 'Brief Ready',
    'completed': 'Completed',
    'declined': 'Declined',
  };

  const style = styles[status] || 'bg-slate-100 text-slate-500';
  const label = labels[status] || status?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'Unknown';

  return (
    <span className={`inline-flex items-center rounded-full px-3 py-0.5 text-xs font-medium ${style} ${className}`}>
      {label}
    </span>
  );
}
