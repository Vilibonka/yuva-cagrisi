const STATUS_STYLES = {
  PENDING: 'bg-amber-100 text-amber-700 border border-amber-200',
  APPROVED: 'bg-emerald-100 text-emerald-700 border border-emerald-200',
  REJECTED: 'bg-rose-100 text-rose-700 border border-rose-200',
  CANCELLED: 'bg-slate-100 text-slate-700 border border-slate-200',
};

const STATUS_LABELS = {
  PENDING: 'Beklemede',
  APPROVED: 'Onaylandi',
  REJECTED: 'Reddedildi',
  CANCELLED: 'Iptal edildi',
};

export function getRequestStatusLabel(status) {
  return STATUS_LABELS[status] || status;
}

export default function RequestStatusBadge({ status }) {
  return (
    <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${STATUS_STYLES[status] || STATUS_STYLES.CANCELLED}`}>
      {getRequestStatusLabel(status)}
    </span>
  );
}
