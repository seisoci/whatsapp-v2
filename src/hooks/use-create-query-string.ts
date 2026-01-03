'use client';

import { useCallback } from 'react';
import { useSearchParams } from 'next/navigation';

export function useCreateQueryString() {
  const searchParams = useSearchParams();

  // example https://nextjs.org/docs/app/api-reference/functions/use-search-params#updating-searchparams

  const createQueryString = useCallback(
    (name: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set(name, value);

      return params.toString();
    },
    [searchParams]
  );

  return { createQueryString };
}
