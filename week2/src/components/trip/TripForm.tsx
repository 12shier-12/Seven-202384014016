import { useState, type FormEvent } from 'react';
import type { Trip } from '../../types';
import { addDays, todayYMD } from '../../core/date';
import type { TripInput } from '../../db/actions';

const EMOJIS = ['🧳', '⛩️', '🐼', '🏔️', '🏖️', '🚲', '🍜', '🎿', '🗼', '🌊'];

interface TripFormProps {
  initial?: Trip;
  submitLabel: string;
  onSubmit: (input: TripInput) => Promise<void> | void;
  onCancel: () => void;
}

export default function TripForm({ initial, submitLabel, onSubmit, onCancel }: TripFormProps) {
  const today = todayYMD();
  const [name, setName] = useState(initial?.name ?? '');
  const [destination, setDestination] = useState(initial?.destination ?? '');
  const [startDate, setStartDate] = useState(initial?.startDate ?? today);
  const [endDate, setEndDate] = useState(initial?.endDate ?? addDays(today, 2) ?? today);
  const [travelers, setTravelers] = useState(String(initial?.travelers ?? 1));
  const [budget, setBudget] = useState(initial?.budget ? String(initial.budget) : '');
  const [tempMin, setTempMin] = useState(initial?.expectedTemp ? String(initial.expectedTemp.min) : '');
  const [tempMax, setTempMax] = useState(initial?.expectedTemp ? String(initial.expectedTemp.max) : '');
  const [coverEmoji, setCoverEmoji] = useState(initial?.coverEmoji ?? '🧳');
  const [notes, setNotes] = useState(initial?.notes ?? '');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const handleStart = (value: string) => {
    setStartDate(value);
    if (endDate < value) setEndDate(value);
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!name.trim()) {
      setError('给行程起个名字吧');
      return;
    }
    if (!startDate) {
      setError('请选择出发日期');
      return;
    }

    const min = tempMin.trim() === '' ? undefined : Number(tempMin);
    const max = tempMax.trim() === '' ? undefined : Number(tempMax);

    setSaving(true);
    setError('');
    try {
      await onSubmit({
        name,
        destination,
        startDate,
        endDate: endDate < startDate ? startDate : endDate,
        travelers: Number(travelers) || 1,
        budget: budget.trim() === '' ? undefined : Number(budget),
        expectedTemp:
          min === undefined && max === undefined
            ? undefined
            : {
                min: Number.isFinite(min) ? (min as number) : (max as number),
                max: Number.isFinite(max) ? (max as number) : (min as number),
              },
        coverEmoji,
        notes,
      });
    } catch (err) {
      setError((err as Error).message || '保存失败');
      setSaving(false);
    }
  };

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div>
        <span className="label">封面</span>
        <div className="flex flex-wrap gap-1.5">
          {EMOJIS.map((emoji) => (
            <button
              key={emoji}
              type="button"
              onClick={() => setCoverEmoji(emoji)}
              className={`grid h-9 w-9 place-items-center rounded-lg text-lg transition ${
                coverEmoji === emoji ? 'bg-indigo-50 ring-2 ring-indigo-400' : 'bg-slate-50 hover:bg-slate-100'
              }`}
              aria-label={`选择封面 ${emoji}`}
            >
              {emoji}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="label" htmlFor="trip-name">
          行程名称
        </label>
        <input
          id="trip-name"
          className="input"
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="例如：京都七日 · 樱花前的古都"
          autoFocus
        />
      </div>

      <div>
        <label className="label" htmlFor="trip-destination">
          目的地
        </label>
        <input
          id="trip-destination"
          className="input"
          value={destination}
          onChange={(event) => setDestination(event.target.value)}
          placeholder="例如：日本 · 京都"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label" htmlFor="trip-start">
            出发日期
          </label>
          <input
            id="trip-start"
            type="date"
            className="input"
            value={startDate}
            onChange={(event) => handleStart(event.target.value)}
          />
        </div>
        <div>
          <label className="label" htmlFor="trip-end">
            返程日期
          </label>
          <input
            id="trip-end"
            type="date"
            className="input"
            min={startDate}
            value={endDate}
            onChange={(event) => setEndDate(event.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label" htmlFor="trip-travelers">
            同行人数
          </label>
          <input
            id="trip-travelers"
            type="number"
            min={1}
            className="input"
            value={travelers}
            onChange={(event) => setTravelers(event.target.value)}
          />
        </div>
        <div>
          <label className="label" htmlFor="trip-budget">
            预算（元，可选）
          </label>
          <input
            id="trip-budget"
            type="number"
            min={0}
            className="input"
            value={budget}
            onChange={(event) => setBudget(event.target.value)}
            placeholder="10000"
          />
        </div>
      </div>

      <div>
        <span className="label">预期气温（℃）· 决定要不要带厚衣服</span>
        <div className="flex items-center gap-2">
          <input
            type="number"
            className="input"
            value={tempMin}
            onChange={(event) => setTempMin(event.target.value)}
            placeholder="最低 3"
            aria-label="最低气温"
          />
          <span className="text-slate-400">~</span>
          <input
            type="number"
            className="input"
            value={tempMax}
            onChange={(event) => setTempMax(event.target.value)}
            placeholder="最高 12"
            aria-label="最高气温"
          />
        </div>
        <p className="mt-1 text-[11px] text-slate-400">留空则按出发月份的常见气温估算。</p>
      </div>

      <div>
        <label className="label" htmlFor="trip-notes">
          备注
        </label>
        <textarea
          id="trip-notes"
          className="input min-h-[72px] resize-y"
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          placeholder="住宿、交通、同行人的特殊需求…"
        />
      </div>

      {error && <p className="text-sm text-rose-600">{error}</p>}

      <div className="flex justify-end gap-2 pt-1">
        <button type="button" className="btn-outline" onClick={onCancel}>
          取消
        </button>
        <button type="submit" className="btn-primary" disabled={saving}>
          {saving ? '保存中…' : submitLabel}
        </button>
      </div>
    </form>
  );
}
