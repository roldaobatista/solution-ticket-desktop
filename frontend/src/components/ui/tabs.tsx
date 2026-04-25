'use client';

import { cn } from '@/lib/utils';
import { ReactNode } from 'react';
import * as RadixTabs from '@radix-ui/react-tabs';

interface TabsProps {
  tabs: { label: string; value: string; content: ReactNode }[];
  defaultValue?: string;
  className?: string;
}

export function Tabs({ tabs, defaultValue, className }: TabsProps) {
  return (
    <RadixTabs.Root
      defaultValue={defaultValue || tabs[0]?.value}
      className={cn('w-full', className)}
    >
      <RadixTabs.List
        className="flex gap-1 border-b border-slate-200 mb-4"
        aria-label="Navegação por abas"
      >
        {tabs.map((tab) => (
          <RadixTabs.Trigger
            key={tab.value}
            value={tab.value}
            className={cn(
              'px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px',
              'data-[state=active]:text-slate-800 data-[state=active]:border-slate-800',
              'text-slate-500 border-transparent hover:text-slate-700 hover:border-slate-300',
              'focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:rounded-sm',
            )}
          >
            {tab.label}
          </RadixTabs.Trigger>
        ))}
      </RadixTabs.List>
      {tabs.map((tab) => (
        <RadixTabs.Content key={tab.value} value={tab.value}>
          {tab.content}
        </RadixTabs.Content>
      ))}
    </RadixTabs.Root>
  );
}
