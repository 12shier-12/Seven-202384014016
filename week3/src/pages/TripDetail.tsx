import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { db } from '../db/dexie';
import { deleteTrip, updateTrip } from '../db/actions';
import { buildPackingList } from '../core/packingEngine';
import { findConflicts } from '../core/conflict';
import { tripStatus } from '../core/date';
import { formatDateRange, formatMoney, STATUS_META, tripDayCount } from '../utils/format';
import TripForm from '../components/trip/TripForm';
import Modal from '../components/common/Modal';
import EmptyState from '../components/common/EmptyState';

export default function TripDetailPage() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const [editing, setEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const trip = useLiveQuery(async () => (id ? ((await db.trips.get(id)) ?? null) : null), [id]);
  const activities = useLiveQuery(() => db.activities.where('tripId').equals(id).toArray(), [id]);
  const rules = useLiveQuery(() => db.rules.toArray(), []);
  const state = useLiveQuery(async () => (id ? ((await db.packing.get(id)) ?? null) : null), [id]);

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

  const dayCount = tripDayCount(trip.startDate, trip.endDate);
  const status = tripStatus(trip);
  const meta = STATUS_META[status];
  const list = buildPackingList({
    trip,
    activities: activities ?? [],
    rules: rules ?? [],
    state: state ?? null,
  });
  const spent = (activities ?? []).reduce((sum, item) => sum + (item.budget ?? 0), 0);
  const budget = trip.budget ?? 0;
  const budgetRatio = budget > 0 ? Math.min(100, Math.round((spent / budget) * 100)) : 0;
  const conflicts = findConflicts(activities ?? []);
  const { summary } = list;
  const progress = summary.total > 0 ? Math.round((summary.packed / summary.total) * 100) : 0;

  return (
    <div className="space-y-4">
      <Link to="/" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700">
        ← 全部行程
      </Link>

      <section className="card overflow-hidden">
        <div className="bg-gradient-to-br from-indigo-600 via-indigo-500 to-violet-600 px-5 py-6 text-white">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-white/15 text-3xl">
                {trip.coverEmoji}
              </span>
              <div>
                <h1 className="text-lg font-semibold leading-tight sm:text-xl">{trip.name}</h1>
                <p className="mt-1 text-sm text-indigo-100">{trip.destination || '未填写目的地'}</p>
              </div>
            </div>
            <span className="chip shrink-0 bg-white/20 text-white">{meta.label}</span>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
            <div>
              <div className="text-[11px] text-indigo-200">日期</div>
              <div className="font-medium">{formatDateRange(trip.startDate, trip.endDate)}</div>
            </div>
            <div>
              <div className="text-[11px] text-indigo-200">天数</div>
              <div className="font-medium">{dayCount} 天</div>
            </div>
            <div>
              <div className="text-[11px] text-indigo-200">同行</div>
              <div className="font-medium">{trip.travelers} 人</div>
            </div>
            <div>
              <div className="text-[11px] text-indigo-200">预算</div>
              <div className="font-medium">{formatMoney(trip.budget)}</div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 divide-x divide-slate-100 border-b border-slate-100 sm:grid-cols-4">
          <div className="px-4 py-3">
            <div className="text-[11px] text-slate-400">活动</div>
            <div className="text-lg font-semibold text-slate-900">{activities?.length ?? 0}</div>
          </div>
          <div className="px-4 py-3">
            <div className="text-[11px] text-slate-400">活动预算合计</div>
            <div className="text-lg font-semibold text-slate-900">{formatMoney(spent)}</div>
          </div>
          <div className="px-4 py-3">
            <div className="text-[11px] text-slate-400">打包完成</div>
            <div className="text-lg font-semibold text-slate-900">
              {summary.packed}
              <span className="text-sm font-normal text-slate-400"> / {summary.total}</span>
            </div>
          </div>
          <div className="px-4 py-3">
            <div className="text-[11px] text-slate-400">时间冲突</div>
            <div className={`text-lg font-semibold ${conflicts.length > 0 ? 'text-amber-600' : 'text-slate-900'}`}>
              {conflicts.length}
            </div>
          </div>
        </div>

        <div className="px-5 py-4">
          <div className="mb-1 flex items-center justify-between text-xs text-slate-500">
            <span>活动预算进度</span>
            <span>
              {formatMoney(spent)} / {budget > 0 ? formatMoney(budget) : '未设预算'}
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-slate-100">
            <div
              className={`h-full rounded-full ${budgetRatio > 100 ? 'bg-rose-500' : 'bg-indigo-500'}`}
              style={{ width: `${budget > 0 ? budgetRatio : 0}%` }}
            />
          </div>
        </div>
      </section>

      <div className="grid gap-3 sm:grid-cols-2">
        <Link to={`/trip/${trip.id}/itinerary`} className="card flex items-center gap-4 p-5 transition hover:border-indigo-200 hover:shadow-md">
          <span className="grid h-12 w-12 place-items-center rounded-xl bg-sky-50 text-2xl">🗓️</span>
          <div className="min-w-0">
            <h2 className="text-sm font-semibold text-slate-900">按天时间线</h2>
            <p className="mt-0.5 truncate text-xs text-slate-500">
              {activities?.length ?? 0} 个活动
              {conflicts.length > 0 ? ` · ${conflicts.length} 处时间重叠` : ' · 暂无时间冲突'}
            </p>
          </div>
          <span className="ml-auto text-slate-300">›</span>
        </Link>

        <Link to={`/trip/${trip.id}/packing`} className="card flex items-center gap-4 p-5 transition hover:border-indigo-200 hover:shadow-md">
          <span className="grid h-12 w-12 place-items-center rounded-xl bg-emerald-50 text-2xl">🎒</span>
          <div className="min-w-0">
            <h2 className="text-sm font-semibold text-slate-900">打包清单</h2>
            <p className="mt-0.5 truncate text-xs text-slate-500">
              已打包 {summary.packed} / {summary.total} 项 · 命中 {list.matchedRuleIds.length} 条规则
            </p>
          </div>
          <span className="ml-auto text-slate-300">›</span>
        </Link>
      </div>

      <div className="card space-y-3 p-5">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-900">出发前提醒</h2>
          <span className="chip bg-slate-100 text-slate-500">预览</span>
        </div>
        <ul className="space-y-1.5 text-sm text-slate-600">
          <li className={summary.requiredLeft > 0 ? 'text-rose-600' : ''}>
            {summary.requiredLeft > 0
              ? `还有 ${summary.requiredLeft} 件必带物品没有打勾`
              : '必带物品都齐了 🎉'}
          </li>
          <li>{conflicts.length > 0 ? `有 ${conflicts.length} 处活动时间重叠，去时间线看一下` : '时间线没有冲突'}</li>
          <li>{budget > 0 ? `活动预算已用 ${budgetRatio}%` : '还没有填预算'}</li>
        </ul>
        {trip.notes ? (
          <div className="rounded-xl bg-amber-50 px-3 py-2 text-sm leading-relaxed text-amber-900">
            {trip.notes}
          </div>
        ) : null}
        <div className="flex flex-wrap gap-2 pt-1">
          <button type="button" className="btn-outline" onClick={() => setEditing(true)}>
            编辑行程
          </button>
          <button type="button" className="btn-danger" onClick={() => setConfirmDelete(true)}>
            删除行程
          </button>
        </div>
      </div>

      <Modal open={editing} title="编辑行程" onClose={() => setEditing(false)}>
        <TripForm
          initial={trip}
          submitLabel="保存修改"
          onSubmit={async (input) => {
            await updateTrip(trip.id, input);
            setEditing(false);
          }}
          onCancel={() => setEditing(false)}
        />
      </Modal>

      <Modal open={confirmDelete} title="删除行程" onClose={() => setConfirmDelete(false)}>
        <p className="text-sm leading-relaxed text-slate-600">
          将删除「{trip.name}」及其 {activities?.length ?? 0} 条活动和打包清单，且无法恢复。确定继续？
        </p>
        <div className="mt-4 flex justify-end gap-2">
          <button type="button" className="btn-outline" onClick={() => setConfirmDelete(false)}>
            取消
          </button>
          <button
            type="button"
            className="btn-danger"
            onClick={async () => {
              await deleteTrip(trip.id);
              navigate('/');
            }}
          >
            删除
          </button>
        </div>
      </Modal>
    </div>
  );
}
