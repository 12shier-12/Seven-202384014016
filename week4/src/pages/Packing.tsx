import { useState, type FormEvent } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Link, useParams } from 'react-router-dom';
import { db } from '../db/dexie';
import { addManualItem } from '../db/actions';
import { buildPackingList } from '../core/packingEngine';
import { toCsv, withBom } from '../core/csv';
import type { Category } from '../types';
import { CATEGORY_LABELS, CATEGORY_ORDER } from '../types';
import { formatDateRange } from '../utils/format';
import PackingItemRow from '../components/packing/PackingItemRow';
import EmptyState from '../components/common/EmptyState';

export default function PackingPage() {
  const { id = '' } = useParams();
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState('');
  const [qty, setQty] = useState('1');
  const [category, setCategory] = useState<Category>('clothes');
  const [required, setRequired] = useState(false);
  const [copied, setCopied] = useState(false);

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

  const list = buildPackingList({
    trip,
    activities: activities ?? [],
    rules: rules ?? [],
    state: state ?? null,
  });
  const { summary } = list;
  const progress = summary.total > 0 ? Math.round((summary.packed / summary.total) * 100) : 0;

  const handleAdd = async (event: FormEvent) => {
    event.preventDefault();
    if (!name.trim()) return;
    await addManualItem(trip.id, {
      name,
      qty: Number(qty) || 1,
      category,
      required,
    });
    setName('');
    setQty('1');
    setRequired(false);
    setAdding(false);
  };

  const handleCopy = async () => {
    const lines = [
      `${trip.name} · 打包清单`,
      `${formatDateRange(trip.startDate, trip.endDate)} · ${trip.travelers} 人`,
      '',
    ];
    for (const group of list.groups) {
      lines.push(`【${group.label}】`);
      for (const item of group.items) {
        lines.push(`${item.packed ? '[x]' : '[ ]'} ${item.name} × ${item.qty}${item.required ? '（必带）' : ''}`);
      }
      lines.push('');
    }
    try {
      await navigator.clipboard.writeText(lines.join('\n'));
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      window.alert('复制失败，请手动选中清单内容。');
    }
  };

  const handleCsv = () => {
    const rows: Array<Array<string | number>> = [['Category', 'Item', 'Qty', 'Required', 'Packed']];
    for (const group of list.groups) {
      for (const item of group.items) {
        rows.push([
          group.label,
          item.name,
          item.qty,
          item.required ? 'yes' : 'no',
          item.packed ? 'yes' : 'no',
        ]);
      }
    }
    const blob = new Blob([withBom(toCsv(rows))], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `packing-${trip.name || 'trip'}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      <Link to={`/trip/${trip.id}`} className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700">
        ← 返回行程
      </Link>

      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-slate-900">打包清单</h1>
          <p className="mt-1 text-sm text-slate-500">
            {trip.name} · 命中 {list.matchedRuleIds.length} 条规则，改动自动保存
          </p>
        </div>
        <div className="no-print flex flex-wrap gap-2">
          <button type="button" className="btn-outline" onClick={() => void handleCopy()}>
            {copied ? '已复制 ✓' : '复制清单'}
          </button>
          <button type="button" className="btn-outline" onClick={handleCsv}>
            导出 CSV
          </button>
          <button type="button" className="btn-outline" onClick={() => window.print()}>
            打印
          </button>
          <button type="button" className="btn-primary" onClick={() => setAdding((value) => !value)}>
            {adding ? '收起' : '+ 添加物品'}
          </button>
        </div>
      </div>

      <section className="card p-5">
        <div className="flex items-end justify-between">
          <div>
            <div className="text-[11px] text-slate-400">打包进度</div>
            <div className="text-2xl font-semibold text-slate-900">
              {summary.packed}
              <span className="text-base font-normal text-slate-400"> / {summary.total}</span>
            </div>
          </div>
          <div className="text-right text-xs text-slate-500">
            {summary.requiredLeft > 0 ? (
              <span className="text-rose-600">还剩 {summary.requiredLeft} 件必带</span>
            ) : (
              <span className="text-emerald-600">必带物品已齐</span>
            )}
          </div>
        </div>
        <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-slate-100">
          <div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: `${progress}%` }} />
        </div>
      </section>

      {adding && (
        <form onSubmit={handleAdd} className="card no-print space-y-3 p-4">
          <div className="grid gap-3 sm:grid-cols-[2fr_1fr_1fr]">
            <div>
              <label className="label" htmlFor="manual-name">
                物品名称
              </label>
              <input
                id="manual-name"
                className="input"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="例如：折叠水壶"
                autoFocus
              />
            </div>
            <div>
              <label className="label" htmlFor="manual-qty">
                数量
              </label>
              <input
                id="manual-qty"
                type="number"
                min={1}
                className="input"
                value={qty}
                onChange={(event) => setQty(event.target.value)}
              />
            </div>
            <div>
              <label className="label" htmlFor="manual-category">
                分类
              </label>
              <select
                id="manual-category"
                className="input"
                value={category}
                onChange={(event) => setCategory(event.target.value as Category)}
              >
                {CATEGORY_ORDER.map((item) => (
                  <option key={item} value={item}>
                    {CATEGORY_LABELS[item]}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm text-slate-600">
            <input
              type="checkbox"
              checked={required}
              onChange={(event) => setRequired(event.target.checked)}
              className="h-4 w-4 accent-indigo-600"
            />
            必带物品
          </label>
          <div className="flex justify-end gap-2">
            <button type="button" className="btn-outline" onClick={() => setAdding(false)}>
              取消
            </button>
            <button type="submit" className="btn-primary">
              添加
            </button>
          </div>
        </form>
      )}

      {list.groups.length === 0 ? (
        <EmptyState
          icon="🎒"
          title="清单还是空的"
          description="给行程加上活动和预期气温，规则会自动生成建议清单；也可以手动添加物品。"
          action={
            <Link to={`/trip/${trip.id}/itinerary`} className="btn-outline">
              去排时间线
            </Link>
          }
        />
      ) : (
        <div className="space-y-3">
          {list.groups.map((group) => (
            <section key={group.category} className="card overflow-hidden">
              <header className="flex items-center justify-between border-b border-slate-100 bg-slate-50/60 px-4 py-2">
                <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-500">{group.label}</h2>
                <span className="text-[11px] text-slate-400">
                  {group.items.filter((item) => item.packed).length}/{group.items.length}
                </span>
              </header>
              <ul className="divide-y divide-slate-100">
                {group.items.map((item) => (
                  <PackingItemRow key={item.key} item={item} tripId={trip.id} />
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}

      <p className="text-[11px] leading-relaxed text-slate-400">
        清单由「规则建议 + 你的改动」实时计算：勾选、改数量、删除都会记住；关掉规则不会删掉你的手动添加。
      </p>
    </div>
  );
}
