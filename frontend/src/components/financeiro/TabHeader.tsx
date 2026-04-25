import type { ReactNode } from 'react';

export function TabHeader({ icon, label }: { icon: ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-2 text-xs text-slate-400 uppercase tracking-wide mb-2">
      {icon}
      {label}
    </div>
  );
}
