import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { db } from '../db/dexie';
import { deleteTrip, updateTrip } from '../db/actions';
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

        {trip.notes ? (
          <div className="border-t border-slate-100 px-5 py-4">
            <div className="text-[11px] text-slate-400">备注</div>
            <p className="mt-1 text-sm leading-relaxed text-slate-700">{trip.notes}</p>
          </div>
        ) : null}

        <div className="flex flex-wrap gap-2 border-t border-slate-100 px-5 py-4">
          <button type="button" className="btn-outline" onClick={() => setEditing(true)}>
            编辑行程
          </button>
          <button type="button" className="btn-danger" onClick={() => setConfirmDelete(true)}>
            删除行程
          </button>
        </div>
      </section>

      <section className="rounded-2xl border border-dashed border-slate-300 px-5 py-6 text-sm text-slate-500">
        <h2 className="font-medium text-slate-700">Next up</h2>
        <p className="mt-1 leading-relaxed">
          第 2 周会加上按天时间线与冲突检测，第 3 周会加上规则驱动的打包清单。
        </p>
      </section>

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
          将删除「{trip.name}」，且无法恢复。确定继续？
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
