import { Link } from 'react-router-dom';
import type { Trip } from '../../types';
import { tripStatus } from '../../core/date';
import { formatDateRange, formatMoney, STATUS_META, tripDayCount } from '../../utils/format';

export default function TripCard({ trip }: { trip: Trip }) {
  const status = tripStatus(trip);
  const meta = STATUS_META[status];
  const days = tripDayCount(trip.startDate, trip.endDate);

  return (
    <Link
      to={`/trip/${trip.id}`}
      className="card group flex flex-col gap-4 p-5 transition hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-xl bg-slate-50 text-2xl">{trip.coverEmoji}</span>
          <div className="min-w-0">
            <h3 className="truncate text-base font-semibold text-slate-900 group-hover:text-indigo-700">{trip.name}</h3>
            <p className="truncate text-xs text-slate-500">{trip.destination || '未填写目的地'}</p>
          </div>
        </div>
        <span className={`chip shrink-0 ${meta.chip}`}>{meta.label}</span>
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs text-slate-500">
        <span className="flex items-center gap-1.5">
          <span aria-hidden>📅</span>
          {formatDateRange(trip.startDate, trip.endDate)}
        </span>
        <span className="flex items-center gap-1.5">
          <span aria-hidden>⏱️</span>
          {days} 天 · {trip.travelers} 人
        </span>
        <span className="flex items-center gap-1.5">
          <span aria-hidden>💰</span>
          {formatMoney(trip.budget)}
        </span>
        <span className="flex items-center gap-1.5">
          <span aria-hidden>📍</span>
          {trip.destination || '—'}
        </span>
      </div>
    </Link>
  );
}
