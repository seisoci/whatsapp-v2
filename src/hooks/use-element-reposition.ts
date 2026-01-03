'use client';

import React from 'react';
import { useHorizontalScrollAvailability } from '../hooks/use-horizontal-scroll-availability';

export function useElementRePosition({ ref, activeTab }: any) {
  const { isLeft: isScrollableToLeft, isRight: isScrollableToRight } =
    useHorizontalScrollAvailability({
      ref,
    });
  React.useEffect(() => {
    function handleScrollLeft() {
      if (ref.current && activeTab + 1) {
        const tabElement = ref.current.children[activeTab] as HTMLElement;
        const containerWidth = ref.current.offsetWidth;
        const tabWidth = tabElement.offsetWidth;
        const tabOffsetLeft = tabElement.offsetLeft;
        const currentScrollLeft = ref.current.scrollLeft;

        let newScrollLeft = currentScrollLeft;

        if (tabWidth + tabOffsetLeft > currentScrollLeft + containerWidth) {
          newScrollLeft = tabOffsetLeft + tabWidth - containerWidth;
        } else if (tabOffsetLeft < currentScrollLeft) {
          newScrollLeft = tabOffsetLeft;
        }

        ref.current.scrollTo({
          left: newScrollLeft,
          behavior: 'smooth',
        });
      }
    }
    handleScrollLeft();

    window.addEventListener('resize', handleScrollLeft);
    return () => {
      window.removeEventListener('resize', handleScrollLeft);
    };

  }, [activeTab]);
  return { isScrollableToLeft, isScrollableToRight };
}
