'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { routes } from '@/config/routes';

type NavigationKey = keyof typeof navigations;

const navigations = {
  '1': '/',








};

const allowedNumKeys = Object.keys(navigations);

export function useBoronKbdShortcuts() {
  const router = useRouter();
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (
        (event.metaKey || event.ctrlKey) &&
        allowedNumKeys.includes(event.key)
      ) {
        event.preventDefault();
        router.push(navigations[event.key as NavigationKey]);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);
}
