import { useState, type FormEvent } from 'react';
import type { Activity, ActivityType } from '../../types';
import { ACTIVITY_TYPE_LABELS } from '../../types';
import type { ActivityInput } from '../../db/actions';

interface ActivityFormProps {
  initial?: Activity;
  dayCount: number;
  defaultDay: number;
  onSubmit: (input: ActivityInput) => Promise<void> | void;
  onCancel: () => void;
}

const TYPES: ActivityType[] = ['sight', 'food', 'transport', 'stay', 'shopping', 'other'];

export default function ActivityForm({
  initial,
  dayCount,
  defaultDay,
  onSubmit,
  onCancel,
}: ActivityFormProps) {
  const [title, setTitle] = useState(initial?.title ?? '');
  const [dayIndex, setDayIndex] = useState(Math.min(initial?.dayIndex ?? defaultDay, dayCount));
  const [startTime, setStartTime] = useState(initial?.startTime ?? '');
  const [durationMin, setDurationMin] = useState(initial?.durationMin ? String(initial.durationMin) : '');
  const [location, setLocation] = useState(initial?.location ?? '');
  const [type, setType] = useState<ActivityType>(initial?.type ?? 'sight');
  const [tags, setTags] = useState((initial?.tags ?? []).join(', '));
  const [budget, setBudget] = useState(initial?.budget ? String(initial.budget) : '');
  const [notes, setNotes] = useState(initial?.notes ?? '');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!title.trim()) {
      setError('活动名称不能为空');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await onSubmit({
        dayIndex,
        title,
        startTime: startTime || undefined,
        durationMin: durationMin ? Number(durationMin) : undefined,
        location,
        type,
        tags: tags
          .split(/[,，、\s]+/)
          .map((tag) => tag.trim())
          .filter(Boolean),
        budget: budget ? Number(budget) : undefined,
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
        <label className="label" htmlFor="activity-title">
          活动名称
        </label>
        <input
          id="activity-title"
          className="input"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="例如：清水寺"
          autoFocus
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label" htmlFor="activity-day">
            第几天
          </label>
          <select
            id="activity-day"
            className="input"
            value={dayIndex}
            onChange={(event) => setDayIndex(Number(event.target.value))}
          >
            {Array.from({ length: dayCount }, (_, index) => (
              <option key={index + 1} value={index + 1}>
                Day {index + 1}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label" htmlFor="activity-type">
            类型
          </label>
          <select
            id="activity-type"
            className="input"
            value={type}
            onChange={(event) => setType(event.target.value as ActivityType)}
          >
            {TYPES.map((item) => (
              <option key={item} value={item}>
                {ACTIVITY_TYPE_LABELS[item]}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label" htmlFor="activity-start">
            开始时间
          </label>
          <input
            id="activity-start"
            type="time"
            className="input"
            value={startTime}
            onChange={(event) => setStartTime(event.target.value)}
          />
        </div>
        <div>
          <label className="label" htmlFor="activity-duration">
            时长（分钟）
          </label>
          <input
            id="activity-duration"
            type="number"
            min={0}
            step={5}
            className="input"
            value={durationMin}
            onChange={(event) => setDurationMin(event.target.value)}
            placeholder="默认 60"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label" htmlFor="activity-location">
            地点（可选）
          </label>
          <input
            id="activity-location"
            className="input"
            value={location}
            onChange={(event) => setLocation(event.target.value)}
            placeholder="东山区"
          />
        </div>
        <div>
          <label className="label" htmlFor="activity-budget">
            预算（元）
          </label>
          <input
            id="activity-budget"
            type="number"
            min={0}
            className="input"
            value={budget}
            onChange={(event) => setBudget(event.target.value)}
            placeholder="300"
          />
        </div>
      </div>

      <div>
        <label className="label" htmlFor="activity-tags">
          标签（逗号分隔，驱动打包规则）
        </label>
        <input
          id="activity-tags"
          className="input"
          value={tags}
          onChange={(event) => setTags(event.target.value)}
          placeholder="hiking, rain, beach, overseas"
        />
        <p className="mt-1 text-[11px] text-slate-400">例如 hiking 会触发登山鞋、登山杖、能量棒。</p>
      </div>

      <div>
        <label className="label" htmlFor="activity-notes">
          备注
        </label>
        <textarea
          id="activity-notes"
          className="input min-h-[64px] resize-y"
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
        />
      </div>

      {error && <p className="text-sm text-rose-600">{error}</p>}

      <div className="flex justify-end gap-2 pt-1">
        <button type="button" className="btn-outline" onClick={onCancel}>
          取消
        </button>
        <button type="submit" className="btn-primary" disabled={saving}>
          {saving ? '保存中…' : '保存活动'}
        </button>
      </div>
    </form>
  );
}
