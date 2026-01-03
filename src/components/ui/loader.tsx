'use client';

import Image from 'next/image';
import cn from '@core/utils/class-names';

interface LoaderProps {
  variant?: 'spinner' | 'pulse';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  tag?: 'div' | 'span';
}

const sizeClasses = {
  sm: 'w-6 h-6',
  md: 'w-9 h-9',
  lg: 'w-12 h-12',
  xl: 'w-16 h-16',
};

export function Loader({
  variant = 'spinner',
  size = 'md',
  className,
  tag: Tag = 'div',
}: LoaderProps) {
  return (
    <>
      <style jsx global>{`
        @keyframes breathe-rotate {
          0% {
            transform: scale(1) rotate(0deg);
            opacity: 1;
          }
          50% {
            transform: scale(1.15) rotate(180deg);
            opacity: 0.7;
          }
          100% {
            transform: scale(1) rotate(360deg);
            opacity: 1;
          }
        }

        @keyframes breathe-pulse {
          0%, 100% {
            transform: scale(1);
            opacity: 1;
          }
          50% {
            transform: scale(1.1);
            opacity: 0.8;
          }
        }

        .custom-loader-spinner {
          animation: breathe-rotate 2s ease-in-out infinite;
        }

        .custom-loader-pulse {
          animation: breathe-pulse 2s ease-in-out infinite;
        }
      `}</style>

      <Tag className={cn('relative inline-flex items-center justify-center', className)}>
        {/* Logo with Animation */}
        <div className={cn(
          'relative',
          sizeClasses[size],
          variant === 'spinner' ? 'custom-loader-spinner' : 'custom-loader-pulse'
        )}>
          <Image
            src="/logo-itn.svg"
            alt="Loading"
            fill
            className="object-contain"
            priority
          />
        </div>
      </Tag>
    </>
  );
}

export default Loader;
