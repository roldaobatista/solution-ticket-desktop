'use client';

import { cn } from '@/lib/utils';
import { ReactNode, useState } from 'react';

interface TabsProps {
  tabs: { label: string; value: string; content: ReactNode }[];
  defaultValue?: string;
  className?: string;
}

export function Tabs({ tabs, defaultValue, className }: TabsProps) {
  const [active, setActive] = useState(defaultValue || tabs[0]?.value);

  return (
    <div className={cn('w-full', className)}>
      <div className="flex gap-1 border-b border-slate-200 mb-4">
        {tabs.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setActive(tab.value)}
            className={cn(
              'px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px',
              active === tab.value
                ? 'text-slate-800 border-slate-800'
                : 'text-slate-500 border-transparent hover:text-slate-700 hover:border-slate-300',
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div>{tabs.find((t) => t.value === active)?.content}</div>
    </div>
  );
}
