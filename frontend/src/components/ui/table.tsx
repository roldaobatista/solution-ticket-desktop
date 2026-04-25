'use client';

import { cn } from '@/lib/utils';
import { ReactNode } from 'react';

interface TableProps {
  children: ReactNode;
  className?: string;
}

export function Table({ children, className }: TableProps) {
  return (
    <div className="overflow-x-auto rounded-lg border border-slate-200">
      <table className={cn('w-full border-collapse', className)}>{children}</table>
    </div>
  );
}

interface TableHeadProps {
  children: ReactNode;
}

export function TableHead({ children }: TableHeadProps) {
  return <thead className="bg-slate-50">{children}</thead>;
}

interface TableBodyProps {
  children: ReactNode;
}

export function TableBody({ children }: TableBodyProps) {
  return <tbody className="divide-y divide-slate-100">{children}</tbody>;
}

interface TableRowProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
}

export function TableRow({ children, className, onClick }: TableRowProps) {
  return (
    <tr
      onClick={onClick}
      className={cn('transition-colors hover:bg-slate-50', onClick && 'cursor-pointer', className)}
    >
      {children}
    </tr>
  );
}

interface TableHeaderProps {
  children?: ReactNode;
  className?: string;
}

export function TableHeader({ children, className }: TableHeaderProps) {
  return (
    <th
      className={cn(
        'px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider',
        className,
      )}
    >
      {children}
    </th>
  );
}

interface TableCellProps {
  children: ReactNode;
  className?: string;
  colSpan?: number;
  title?: string;
}

export function TableCell({ children, className, colSpan, title }: TableCellProps) {
  return (
    <td
      colSpan={colSpan}
      title={title}
      className={cn('px-4 py-3 text-sm text-slate-700', className)}
    >
      {children}
    </td>
  );
}
