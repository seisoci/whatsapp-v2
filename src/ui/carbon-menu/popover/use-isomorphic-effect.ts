import { useEffect, useLayoutEffect } from 'react';

// useIsomorphicEffect removes it by replacing useLayoutEffect with useEffect during ssr
export const useIsomorphicEffect =
  typeof document !== 'undefined' ? useLayoutEffect : useEffect;
