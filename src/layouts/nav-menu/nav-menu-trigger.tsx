'use client';

import React, { Fragment } from 'react';
import { useNavMenu } from './nav-menu-context';
import cn from '@core/utils/class-names';
import { ItemTriggerRef, NavMenuTriggerProps } from './nav-menu-types';

export const NavMenuTrigger = React.forwardRef<
  HTMLButtonElement,
  NavMenuTriggerProps
>(({ triggerType = 'hover', className, children, ...props }, ref) => {
  const { index, ...restProps } = props as any;

  const { handleMouseEnter: trigger } = useNavMenu();
  const NavMenuButton: React.ElementType = 'li' as React.ElementType;

  function handleClick(e: React.MouseEvent<HTMLDivElement, MouseEvent>) {
    props.onClick && props.onClick(e);
    triggerType === 'click' && trigger(index as number, e.currentTarget);
  }

  function handleMouseEnter(e: React.MouseEvent<HTMLDivElement, MouseEvent>) {
    props.onMouseEnter && props.onMouseEnter(e);
    triggerType === 'hover' && trigger(index as number, e.currentTarget);
  }

  return (
    <NavMenuButton
      ref={ref}
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      className={cn('cursor-pointer', className)}
      {...restProps}
    >
      {children}
    </NavMenuButton>
  );
});

NavMenuTrigger.displayName = 'NavMenuTrigger';

type NavMenuTriggerWrapperProps = {
  items: (ItemTriggerRef | null | undefined)[];
  menuClassName?: string;
};

export function NavMenuTriggerWrapper({
  items,
  menuClassName,
}: NavMenuTriggerWrapperProps) {
  const wrapperRef = React.useRef<any>(null);
  const { set } = useNavMenu();

  React.useEffect(() => {
    set({
      itemWrapperLeft:
        wrapperRef.current.getBoundingClientRect().left + window.scrollX,
      itemWrapperRight:
        wrapperRef.current.getBoundingClientRect().right + window.scrollX,
    });
  }, []);

  return (
    <menu
      className={cn('nav-menu-trigger-wrapper flex gap-6', menuClassName)}
      ref={wrapperRef}
    >
      {items.map((item, index: number) => {
        return (
          <Fragment key={index}>
            {React.Children.map(item?.component, (child) => {
              if (React.isValidElement(child)) {
                return React.cloneElement(child, {
                  ...item?.props,
                  /*
                  REASON OF IGNORING TS ERROR:
...
                  */
                  index: index,
                } as any);
              }
              return null;
            })}
          </Fragment>
        );
      })}
    </menu>
  );
}
