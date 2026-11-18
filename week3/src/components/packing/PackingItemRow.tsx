import type { PackingItem } from '../../types';
import { removePackingItem, setPacked, setQty } from '../../db/actions';

export default function PackingItemRow({ item, tripId }: { item: PackingItem; tripId: string }) {
  return (
    <li className={`flex items-center gap-3 px-4 py-2.5 ${item.packed ? 'bg-slate-50/60' : ''}`}>
      <label className="flex min-w-0 flex-1 cursor-pointer items-center gap-2.5">
        <input
          type="checkbox"
          checked={item.packed}
          onChange={(event) => void setPacked(tripId, item.key, event.target.checked)}
          className="h-4 w-4 shrink-0 rounded border-slate-300 accent-indigo-600"
        />
        <span className="min-w-0">
          <span className={`text-sm ${item.packed ? 'text-slate-400 line-through' : 'text-slate-800'}`}>
            {item.name}
          </span>
          <span className="ml-1.5 text-xs text-slate-400">× {item.qty}</span>
          {item.required && <span className="ml-1.5 text-[10px] font-medium text-rose-500">必带</span>}
          {item.source === 'rule' && <span className="ml-1.5 chip bg-slate-100 text-[10px] text-slate-400">规则</span>}
        </span>
      </label>

      <div className="flex shrink-0 items-center gap-0.5">
        <button
          type="button"
          className="grid h-6 w-6 place-items-center rounded text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
          aria-label={`减少 ${item.name} 数量`}
          onClick={() => void setQty(tripId, item.key, item.qty - 1)}
        >
          −
        </button>
        <button
          type="button"
          className="grid h-6 w-6 place-items-center rounded text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
          aria-label={`增加 ${item.name} 数量`}
          onClick={() => void setQty(tripId, item.key, item.qty + 1)}
        >
          +
        </button>
        <button
          type="button"
          className="grid h-6 w-6 place-items-center rounded text-slate-300 transition hover:bg-rose-50 hover:text-rose-500"
          aria-label={`移除 ${item.name}`}
          onClick={() => void removePackingItem(tripId, item.key)}
        >
          ✕
        </button>
      </div>
    </li>
  );
}
