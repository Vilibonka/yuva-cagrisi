import { getRequestStatusLabel } from './RequestStatusBadge';

function formatDateTime(value) {
  if (!value) {
    return '-';
  }

  return new Date(value).toLocaleString('tr-TR');
}

export default function RequestStatusTimeline({ history }) {
  if (!history?.length) {
    return (
      <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 p-4 text-sm text-gray-500">
        Durum gecmisi henuz olusmadi.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {history.map((item) => (
        <div key={item.id} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="font-semibold text-gray-800">
              {item.oldStatus ? `${getRequestStatusLabel(item.oldStatus)} -> ${getRequestStatusLabel(item.newStatus)}` : `${getRequestStatusLabel(item.newStatus)} olarak olusturuldu`}
            </div>
            <div className="text-xs text-gray-500">{formatDateTime(item.changedAt)}</div>
          </div>
          <div className="mt-2 text-sm text-gray-600">
            Islem yapan: <span className="font-medium text-gray-800">{item.changedBy?.fullName || 'Sistem'}</span>
          </div>
          {item.note && <div className="mt-2 text-sm text-gray-500">{item.note}</div>}
        </div>
      ))}
    </div>
  );
}
