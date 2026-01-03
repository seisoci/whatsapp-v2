'use client';
import { atom, useAtom } from 'jotai';

const isomorphicDirectionAtom = atom(
  typeof window !== 'undefined' ? localStorage.getItem('iso-direction') : 'ltr'
);

const isomorphicDirectionAtomWithPersistence = atom(
  (get) => get(isomorphicDirectionAtom),
  (get, set, newStorage: any) => {
    set(isomorphicDirectionAtom, newStorage);
    localStorage.setItem('iso-direction', newStorage);
  }
);

export function useDirection() {
  const [direction, setDirection] = useAtom(
    isomorphicDirectionAtomWithPersistence
  );

  return {
    direction: direction === null ? 'ltr' : direction,
    setDirection,
  };
}
