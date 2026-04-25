'use client';

import { cn } from '@/lib/utils';
import { ReactNode, useState } from 'react';

interface TooltipProps {
  children: ReactNode;
  content: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
}

export function Tooltip({ children, content, position = 'top' }: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);

  const positions = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
  };

  return (
    <div
      className="relative inline-flex"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      {children}
      {isVisible && (
        <div
          className={cn(
            'absolute z-50 px-2.5 py-1.5 text-xs text-white bg-slate-800 rounded-md shadow-lg whitespace-nowrap',
            positions[position],
          )}
        >
          {content}
          <div
            className="absolute w-2 h-2 bg-slate-800 rotate-45"
            style={{
              ...(position === 'top' && { bottom: -4, left: '50%', marginLeft: -4 }),
              ...(position === 'bottom' && { top: -4, left: '50%', marginLeft: -4 }),
              ...(position === 'left' && { right: -4, top: '50%', marginTop: -4 }),
              ...(position === 'right' && { left: -4, top: '50%', marginTop: -4 }),
            }}
          />
        </div>
      )}
    </div>
  );
}
