'use client';

import Image, { ImageProps } from 'next/image';
import { useModal } from '@/app/shared/modal-views/use-modal';
import { Button, Title } from 'rizzui';
import cn from '@core/utils/class-names';
import EmailTemplateForm from '@/app/shared/email-templates/email-template-form';

interface TemplateWidgetProps {
  src: ImageProps['src'];
  name: string;
  title: string;
  className?: string;
}

export default function TemplateWidget({
  src,
  name,
  title,
  className,
}: TemplateWidgetProps) {
  const { openModal } = useModal();
  return (
    <div className="relative rounded-md">
      <div className="mb-6 flex items-center justify-between">
        <Title as="h3">{title}</Title>
      </div>
      <figure
        title={title}
        className={cn(
          'relative h-[575px] overflow-hidden rounded-md drop-shadow-xl',
          className
        )}
      >
        <Image
          src={src}
          alt={title}
          className="mx-auto rounded-md object-contain"
        />
      </figure>

      <Button
        className="mt-6"
        onClick={() =>
          openModal({
            view: <EmailTemplateForm template={name} />,
          })
        }
      >
        Test this email
      </Button>
    </div>
  );
}

//     <Button className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 transform">
