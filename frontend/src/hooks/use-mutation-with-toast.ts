'use client';

import { useMutation, UseMutationOptions, UseMutationResult } from '@tanstack/react-query';
import { useToast } from './use-toast';

export function useMutationWithToast<TData, TError, TVariables, TContext>(
  options: UseMutationOptions<TData, TError, TVariables, TContext> & {
    successMessage?: string | ((data: TData) => string);
    errorMessage?: string | ((error: TError) => string);
  },
): UseMutationResult<TData, TError, TVariables, TContext> {
  const toast = useToast();
  const { successMessage, errorMessage, ...rest } = options;

  return useMutation({
    ...rest,
    onSuccess: (data, variables, context) => {
      if (successMessage) {
        const msg = typeof successMessage === 'function' ? successMessage(data) : successMessage;
        toast.success(msg);
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (rest as any).onSuccess?.(data, variables, context);
    },
    onError: (error, variables, context) => {
      if (errorMessage) {
        const msg = typeof errorMessage === 'function' ? errorMessage(error) : errorMessage;
        toast.error(msg);
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (rest as any).onError?.(error, variables, context);
    },
  } as UseMutationOptions<TData, TError, TVariables, TContext>);
}
