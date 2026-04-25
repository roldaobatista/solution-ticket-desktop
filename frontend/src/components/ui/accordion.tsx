'use client';

import { cn } from '@/lib/utils';
import { ChevronDown } from 'lucide-react';
import { ReactNode, useState } from 'react';

interface AccordionItem {
  title: string;
  content: ReactNode;
}

interface AccordionProps {
  items: AccordionItem[];
  className?: string;
}

export function Accordion({ items, className }: AccordionProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <div className={cn('border border-slate-200 rounded-lg divide-y divide-slate-200', className)}>
      {items.map((item, index) => {
        const isOpen = openIndex === index;
        return (
          <div key={index}>
            <button
              onClick={() => setOpenIndex(isOpen ? null : index)}
              className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-slate-50 transition-colors"
            >
              <span className="text-sm font-medium text-slate-800">{item.title}</span>
              <ChevronDown
                className={cn(
                  'w-4 h-4 text-slate-500 transition-transform',
                  isOpen && 'rotate-180',
                )}
              />
            </button>
            {isOpen && <div className="px-4 pb-3 text-sm text-slate-600">{item.content}</div>}
          </div>
        );
      })}
    </div>
  );
}
