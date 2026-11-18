import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/dexie';
import { resetAll, toggleRule } from '../db/actions';
import { describeRuleWhen } from '../utils/format';

export default function SettingsPage() {
  const rules = useLiveQuery(() => db.rules.toArray(), []);
  const tripCount = useLiveQuery(() => db.trips.count(), []);
  const activityCount = useLiveQuery(() => db.activities.count(), []);
  const [message, setMessage] = useState<{ type: 'ok' | 'error'; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  const enabledCount = (rules ?? []).filter((rule) => rule.enabled).length;

  const handleReset = async () => {
    if (!window.confirm('将清空本机全部数据并重新载入示例行程，确定继续？')) return;
    setBusy(true);
    try {
      await resetAll();
      setMessage({ type: 'ok', text: '已重置为示例数据' });
    } catch (error) {
      setMessage({ type: 'error', text: (error as Error).message });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-slate-900">设置</h1>
        <p className="mt-1 text-sm text-slate-500">规则与本地数据。所有内容只保存在这台设备。</p>
      </div>

      {message && (
        <div
          className={`rounded-xl border px-4 py-3 text-sm ${
            message.type === 'ok'
              ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
              : 'border-rose-200 bg-rose-50 text-rose-700'
          }`}
          role="status"
        >
          {message.text}
        </div>
      )}

      <section className="card overflow-hidden">
        <header className="flex items-center justify-between border-b border-slate-100 px-5 py-3">
          <div>
            <h2 className="text-sm font-semibold text-slate-900">打包规则</h2>
            <p className="mt-0.5 text-xs text-slate-500">命中条件的规则会生成清单条目，关闭后立即从清单移除</p>
          </div>
          <span className="chip bg-slate-100 text-slate-500">
            {enabledCount}/{rules?.length ?? 0} 启用
          </span>
        </header>

        <ul className="divide-y divide-slate-100">
          {(rules ?? []).map((rule) => (
            <li key={rule.id} className="flex items-start gap-4 px-5 py-3.5">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-sm font-medium text-slate-900">{rule.name}</h3>
                  <span className="chip bg-slate-100 text-[10px] text-slate-500">{describeRuleWhen(rule)}</span>
                </div>
                <p className="mt-1 text-xs leading-relaxed text-slate-500">
                  {rule.then.map((item) => `${item.name} × ${item.qtyExpr}`).join('、')}
                </p>
              </div>

              <button
                type="button"
                role="switch"
                aria-checked={rule.enabled}
                aria-label={`${rule.name} 开关`}
                onClick={() => void toggleRule(rule.id, !rule.enabled)}
                className={`relative mt-1 h-6 w-11 shrink-0 rounded-full transition ${
                  rule.enabled ? 'bg-indigo-600' : 'bg-slate-300'
                }`}
              >
                <span
                  className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${
                    rule.enabled ? 'left-[22px]' : 'left-0.5'
                  }`}
                />
              </button>
            </li>
          ))}
        </ul>
      </section>

      <section className="card p-5">
        <h2 className="text-sm font-semibold text-slate-900">数据</h2>
        <p className="mt-1 text-xs text-slate-500">
          当前 {tripCount ?? 0} 个行程、{activityCount ?? 0} 条活动，数据存在浏览器 IndexedDB。
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <button type="button" className="btn-danger" onClick={() => void handleReset()} disabled={busy}>
            重置为示例数据
          </button>
        </div>
        <p className="mt-3 text-[11px] leading-relaxed text-slate-400">
          下一步会支持 JSON 备份与恢复，方便换设备。
        </p>
      </section>

      <section className="card p-5 text-sm leading-relaxed text-slate-600">
        <h2 className="text-sm font-semibold text-slate-900">关于 Triply</h2>
        <p className="mt-2">
          离线优先的旅行行程与打包清单工具。清单由规则引擎按天数、人数、活动标签与气温生成，
          你的勾选和修改以「覆盖」形式保存，不会被规则覆盖。
        </p>
        <p className="mt-2 text-xs text-slate-400">v0.3.0 · React 18 + TypeScript + Vite + Dexie</p>
      </section>
    </div>
  );
}
