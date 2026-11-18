import type { Activity } from '../../types';
import { ACTIVITY_TYPE_LABELS } from '../../types';
import { formatDayLabel, formatMoney } from '../../utils/format';
import { deleteActivity, moveActivity, moveActivityToDay } from '../../db/actions';

interface DayColumnProps {
  tripId: string;
  dayIndex: number;
  date: string;
  dayCount: number;
  activities: Activity[];
  conflicts: Map<string, string[]>;
  onAdd: () => void;
  onEdit: (activity: Activity) => void;
}

function ActivityRow({
  activity,
  dayCount,
  dayIndex,
  conflictWith,
  onEdit,
}: {
  activity: Activity;
  dayCount: number;
  dayIndex: number;
  conflictWith: string[];
  onEdit: (activity: Activity) => void;
}) {
  const conflicting = conflictWith.length > 0;

  return (
    <li
      className={`rounded-xl border p-3 transition ${
        conflicting ? 'border-amber-300 bg-amber-50/70' : 'border-slate-200 bg-white hover:border-slate-300'
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
            <span className="font-mono text-xs font-medium text-indigo-600">{activity.startTime ?? '—:—'}</span>
            <h4 className="text-sm font-medium text-slate-900">{activity.title}</h4>
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[11px] text-slate-500">
            <span className="chip bg-slate-100 text-slate-600">{ACTIVITY_TYPE_LABELS[activity.type]}</span>
            {activity.durationMin ? <span>{activity.durationMin} 分钟</span> : null}
            {activity.location ? <span>· {activity.location}</span> : null}
            {activity.budget ? <span>· {formatMoney(activity.budget)}</span> : null}
            {(activity.tags ?? []).map((tag) => (
              <span key={tag} className="chip bg-indigo-50 text-indigo-600">
                #{tag}
              </span>
            ))}
          </div>
          {conflicting && (
            <p className="mt-1.5 text-[11px] font-medium text-amber-700">
              ⚠️ 与「{conflictWith.join('、')}」时间重叠
            </p>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-0.5">
          <button
            type="button"
            className="rounded p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
            aria-label={`上移 ${activity.title}`}
            onClick={() => void moveActivity(activity.id, -1)}
          >
            ↑
          </button>
          <button
            type="button"
            className="rounded p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
            aria-label={`下移 ${activity.title}`}
            onClick={() => void moveActivity(activity.id, 1)}
          >
            ↓
          </button>
        </div>
      </div>

      <div className="mt-2 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-2 text-xs">
        <select
          className="rounded-md border border-transparent bg-slate-50 px-1.5 py-1 text-[11px] text-slate-500 hover:border-slate-200"
          value={dayIndex}
          aria-label={`移动 ${activity.title} 到其它天`}
          onChange={(event) => {
            const next = Number(event.target.value);
            if (next !== dayIndex) void moveActivityToDay(activity.id, next);
          }}
        >
          {Array.from({ length: dayCount }, (_, index) => (
            <option key={index + 1} value={index + 1}>
              移到 Day {index + 1}
            </option>
          ))}
        </select>

        <div className="flex items-center gap-1">
          <button type="button" className="btn-ghost px-2 py-1 text-xs" onClick={() => onEdit(activity)}>
            编辑
          </button>
          <button
            type="button"
            className="btn-ghost px-2 py-1 text-xs text-rose-500 hover:bg-rose-50 hover:text-rose-600"
            onClick={() => {
              if (window.confirm(`删除活动「${activity.title}」？`)) void deleteActivity(activity.id);
            }}
          >
            删除
          </button>
        </div>
      </div>
    </li>
  );
}

export default function DayColumn({
  tripId,
  dayIndex,
  date,
  dayCount,
  activities,
  conflicts,
  onAdd,
  onEdit,
}: DayColumnProps) {
  const sorted = [...activities].sort((a, b) => a.order - b.order);
  const totalBudget = sorted.reduce((sum, item) => sum + (item.budget ?? 0), 0);

  return (
    <section className="card flex flex-col gap-3 p-4" aria-label={`Day ${dayIndex}`}>
      <header className="flex items-baseline justify-between gap-2">
        <div>
          <h3 className="text-sm font-semibold text-slate-900">Day {dayIndex}</h3>
          <p className="text-[11px] text-slate-400">{formatDayLabel(date)}</p>
        </div>
        <div className="text-right text-[11px] text-slate-400">
          <div>{sorted.length} 个活动</div>
          {totalBudget > 0 && <div>{formatMoney(totalBudget)}</div>}
        </div>
      </header>

      {sorted.length === 0 ? (
        <button
          type="button"
          onClick={onAdd}
          className="rounded-xl border border-dashed border-slate-300 px-3 py-6 text-xs text-slate-400 transition hover:border-indigo-300 hover:text-indigo-500"
        >
          + 这一天还没有安排，点击添加
        </button>
      ) : (
        <ul className="space-y-2">
          {sorted.map((activity) => (
            <ActivityRow
              key={activity.id}
              activity={activity}
              dayCount={dayCount}
              dayIndex={dayIndex}
              conflictWith={conflicts.get(activity.id) ?? []}
              onEdit={onEdit}
            />
          ))}
        </ul>
      )}

      {sorted.length > 0 && (
        <button type="button" className="btn-ghost justify-start px-1 text-xs" onClick={onAdd}>
          + 添加活动
        </button>
      )}
    </section>
  );
}
