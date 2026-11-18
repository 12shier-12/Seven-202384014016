import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { useNavigate } from 'react-router-dom';
import { db } from '../db/dexie';
import { createTrip, resetAll } from '../db/actions';
import { tripStatus } from '../core/date';
import TripCard from '../components/trip/TripCard';
import TripForm from '../components/trip/TripForm';
import Modal from '../components/common/Modal';
import EmptyState from '../components/common/EmptyState';
import { useUiStore, type TripFilter } from '../store/ui';

const FILTERS: Array<{ value: TripFilter; label: string }> = [
  { value: 'all', label: '全部' },
  { value: 'upcoming', label: '即将出行' },
  { value: 'ongoing', label: '进行中' },
  { value: 'past', label: '已结束' },
];

export default function TripListPage() {
  const trips = useLiveQuery(() => db.trips.orderBy('startDate').toArray(), []);
  const [creating, setCreating] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const filter = useUiStore((state) => state.filter);
  const setFilter = useUiStore((state) => state.setFilter);
  const navigate = useNavigate();

  const list = trips ?? [];
  const counts: Record<TripFilter, number> = {
    all: list.length,
    upcoming: list.filter((trip) => tripStatus(trip) === 'upcoming').length,
    ongoing: list.filter((trip) => tripStatus(trip) === 'ongoing').length,
    past: list.filter((trip) => tripStatus(trip) === 'past').length,
  };
  const visible = filter === 'all' ? list : list.filter((trip) => tripStatus(trip) === filter);

  const handleCreate = async (input: Parameters<typeof createTrip>[0]) => {
    const trip = await createTrip(input);
    setCreating(false);
    navigate(`/trip/${trip.id}`);
  };

  const handleSeed = async () => {
    setSeeding(true);
    try {
      await resetAll();
    } finally {
      setSeeding(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-slate-900">我的行程</h1>
          <p className="mt-1 text-sm text-slate-500">数据存在这台设备上，断网也能用。</p>
        </div>
        <button type="button" className="btn-primary" onClick={() => setCreating(true)}>
          + 新建行程
        </button>
      </div>

      {trips === undefined ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {[0, 1, 2].map((key) => (
            <div key={key} className="card h-40 animate-pulse bg-slate-100" />
          ))}
        </div>
      ) : list.length === 0 ? (
        <EmptyState
          icon="🗺️"
          title="还没有行程"
          description="新建一个行程，按天排好活动，打包清单会根据天数、人数、活动类型和气温自动生成。"
          action={
            <div className="flex flex-wrap justify-center gap-2">
              <button type="button" className="btn-primary" onClick={() => setCreating(true)}>
                新建行程
              </button>
              <button type="button" className="btn-outline" onClick={() => void handleSeed()} disabled={seeding}>
                {seeding ? '正在载入…' : '载入示例行程'}
              </button>
            </div>
          }
        />
      ) : (
        <>
          <div className="flex flex-wrap gap-1.5">
            {FILTERS.map((item) => (
              <button
                key={item.value}
                type="button"
                aria-pressed={filter === item.value}
                onClick={() => setFilter(item.value)}
                className={`chip border px-3 py-1.5 ${
                  filter === item.value
                    ? 'border-indigo-200 bg-indigo-50 text-indigo-700'
                    : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-50'
                }`}
              >
                {item.label}
                <span className="text-[10px] opacity-60">{counts[item.value]}</span>
              </button>
            ))}
          </div>

          {visible.length === 0 ? (
            <p className="card px-5 py-10 text-center text-sm text-slate-500">这个分类下还没有行程。</p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {visible.map((trip) => (
                <TripCard key={trip.id} trip={trip} />
              ))}
            </div>
          )}
        </>
      )}

      <Modal open={creating} title="新建行程" onClose={() => setCreating(false)}>
        <TripForm submitLabel="创建行程" onSubmit={handleCreate} onCancel={() => setCreating(false)} />
      </Modal>
    </div>
  );
}
