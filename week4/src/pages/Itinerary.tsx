import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Link, useParams } from 'react-router-dom';
import { db } from '../db/dexie';
import { createActivity, updateActivity, type ActivityInput } from '../db/actions';
import type { Activity } from '../types';
import { dayDates, daysBetweenInclusive } from '../core/date';
import { findConflicts } from '../core/conflict';
import { formatDateRange } from '../utils/format';
import DayColumn from '../components/itinerary/DayColumn';
import ActivityForm from '../components/itinerary/ActivityForm';
import Modal from '../components/common/Modal';
import EmptyState from '../components/common/EmptyState';

interface EditingState {
  activity?: Activity;
  dayIndex: number;
}

export default function ItineraryPage() {
  const { id = '' } = useParams();
  const [editing, setEditing] = useState<EditingState | null>(null);

  const trip = useLiveQuery(async () => (id ? ((await db.trips.get(id)) ?? null) : null), [id]);
  const activities = useLiveQuery(() => db.activities.where('tripId').equals(id).toArray(), [id]);

  if (trip === undefined) {
    return <div className="card h-64 animate-pulse bg-slate-100" />;
  }

  if (trip === null) {
    return (
      <EmptyState
        icon="🧭"
        title="找不到这个行程"
        description="它可能已经被删除，或者链接不完整。"
        action={
          <Link to="/" className="btn-primary">
            返回行程列表
          </Link>
        }
      />
    );
  }

  const dayCount = Math.max(1, daysBetweenInclusive(trip.startDate, trip.endDate));
  const dates = dayDates(trip.startDate, dayCount);
  const list = activities ?? [];
  const conflicts = findConflicts(list);

  const conflictMap = new Map<string, string[]>();
  for (const pair of conflicts) {
    conflictMap.set(pair.a.id, [...(conflictMap.get(pair.a.id) ?? []), pair.b.title]);
    conflictMap.set(pair.b.id, [...(conflictMap.get(pair.b.id) ?? []), pair.a.title]);
  }

  const handleSubmit = async (input: ActivityInput) => {
    if (editing?.activity) {
      await updateActivity(editing.activity.id, input);
    } else {
      await createActivity(trip.id, input);
    }
    setEditing(null);
  };

  return (
    <div className="space-y-4">
      <Link to={`/trip/${trip.id}`} className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700">
        ← 返回行程
      </Link>

      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-slate-900">按天时间线</h1>
          <p className="mt-1 text-sm text-slate-500">
            {trip.name} · {formatDateRange(trip.startDate, trip.endDate)}
          </p>
        </div>
        <button type="button" className="btn-primary" onClick={() => setEditing({ dayIndex: 1 })}>
          + 添加活动
        </button>
      </div>

      {conflicts.length > 0 && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          ⚠️ 有 {conflicts.length} 处活动时间重叠，已标黄。相邻时间（如 11:00 结束、11:00 开始）不算冲突。
        </div>
      )}

      {list.length === 0 && (
        <div className="rounded-xl border border-dashed border-slate-300 px-4 py-8 text-center text-sm text-slate-500">
          还没有活动。点「添加活动」，或在行程里先写个大概的日程。
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {dates.map((date, index) => {
          const dayIndex = index + 1;
          return (
            <DayColumn
              key={date}
              tripId={trip.id}
              dayIndex={dayIndex}
              date={date}
              dayCount={dayCount}
              activities={list.filter((activity) => activity.dayIndex === dayIndex)}
              conflicts={conflictMap}
              onAdd={() => setEditing({ dayIndex })}
              onEdit={(activity) => setEditing({ activity, dayIndex: activity.dayIndex })}
            />
          );
        })}
      </div>

      <Modal
        open={editing !== null}
        title={editing?.activity ? '编辑活动' : '添加活动'}
        onClose={() => setEditing(null)}
      >
        {editing && (
          <ActivityForm
            key={editing.activity?.id ?? `new-${editing.dayIndex}`}
            initial={editing.activity}
            dayCount={dayCount}
            defaultDay={editing.dayIndex}
            onSubmit={handleSubmit}
            onCancel={() => setEditing(null)}
          />
        )}
      </Modal>
    </div>
  );
}
