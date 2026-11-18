import type { ReactNode } from 'react';

interface EmptyStateProps {
  icon: string;
  title: string;
  description: string;
  action?: ReactNode;
}

export default function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="card flex flex-col items-center gap-3 px-6 py-12 text-center">
      <span className="text-4xl" aria-hidden>
        {icon}
      </span>
      <h2 className="text-base font-semibold text-slate-800">{title}</h2>
      <p className="max-w-sm text-sm leading-relaxed text-slate-500">{description}</p>
      {action}
    </div>
  );
}
