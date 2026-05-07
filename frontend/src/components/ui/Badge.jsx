const statusMap = {
  // Campaign statuses
  request_sent:        { label: 'Sent',            cls: 'bg-blue-50 text-blue-700' },
  creator_accepted:    { label: 'Accepted',         cls: 'bg-emerald-50 text-emerald-700' },
  agreement_locked:    { label: 'Active',           cls: 'bg-emerald-50 text-emerald-700' },
  escrow_locked:       { label: 'Escrow Locked',    cls: 'bg-indigo-50 text-indigo-700' },
  content_uploaded:    { label: 'In Review',        cls: 'bg-amber-50 text-amber-700' },
  brand_approved:      { label: 'Approved',         cls: 'bg-emerald-50 text-emerald-700' },
  posted_live:         { label: 'Live',             cls: 'bg-emerald-50 text-emerald-700' },
  analytics_collected: { label: 'Metrics In',       cls: 'bg-blue-50 text-blue-700' },
  payment_released:    { label: 'Paid',             cls: 'bg-emerald-50 text-emerald-700' },
  escrow_released:     { label: 'Released',         cls: 'bg-emerald-50 text-emerald-700' },
  campaign_closed:     { label: 'Closed',           cls: 'bg-slate-100 text-slate-600' },
  declined:            { label: 'Declined',         cls: 'bg-red-50 text-red-700' },
  // Payment statuses
  paid:                { label: 'Paid',             cls: 'bg-emerald-50 text-emerald-700' },
  pending:             { label: 'Pending',          cls: 'bg-amber-50 text-amber-700' },
  processing:          { label: 'Processing',       cls: 'bg-blue-50 text-blue-700' },
  // Escrow
  locked:              { label: 'Locked',           cls: 'bg-indigo-50 text-indigo-700' },
  released:            { label: 'Released',         cls: 'bg-emerald-50 text-emerald-700' },
  // Generic
  active:              { label: 'Active',           cls: 'bg-emerald-50 text-emerald-700' },
  completed:           { label: 'Completed',        cls: 'bg-slate-100 text-slate-600' },
  verified:            { label: 'Verified',         cls: 'bg-emerald-50 text-emerald-700' },
  unverified:          { label: 'Unverified',       cls: 'bg-amber-50 text-amber-700' },
  open:                { label: 'Open',             cls: 'bg-red-50 text-red-700' },
  resolved:            { label: 'Resolved',         cls: 'bg-emerald-50 text-emerald-700' },
};

export default function Badge({ status }) {
  const key = (status || '').toLowerCase().replace(/\s+/g, '_');
  const meta = statusMap[key] || { label: status || '—', cls: 'bg-slate-100 text-slate-600' };

  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-[11px] font-semibold ${meta.cls}`}>
      {meta.label}
    </span>
  );
}
