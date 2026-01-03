import Image from 'next/image';

interface IconProps extends React.ComponentPropsWithoutRef<'div'> {
  iconOnly?: boolean;
}

export default function Logo({ iconOnly = false, className, ...props }: IconProps) {
  return (
    <div className={className} {...props}>
      <Image
        src={iconOnly ? '/logo-itn.svg' : '/logo-itn-with-name.svg'}
        alt="ITN Logo"
        width={iconOnly ? 48 : 120}
        height={iconOnly ? 48 : 34}
        priority
      />
    </div>
  );
}
