'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Button, Title } from 'rizzui';
import cn from '@core/utils/class-names';
import { FcGoogle } from 'react-icons/fc';
import OrSeparation from '@/app/shared/auth-layout/or-separation';
import { siteConfig } from '@/config/site.config';
import { BsFacebook } from 'react-icons/bs';

export default function AuthWrapperFour({
  children,
  title,
  isSocialLoginActive = false,
  isSignIn = false,
  className = '',
}: {
  children: React.ReactNode;
  title: React.ReactNode;
  isSocialLoginActive?: boolean;
  isSignIn?: boolean;
  className?: string;
}) {
  return (
    <div className="flex min-h-screen w-full flex-col justify-between">
      {/* <AuthHeader /> */}

      <div className="flex w-full flex-col justify-center px-5">
        <div
          className={cn(
            'mx-auto w-full max-w-md py-12 md:max-w-lg lg:max-w-xl 2xl:pb-8 2xl:pt-2',
            className
          )}
        >
          <div className="flex flex-col items-center">
            <Link href={'/'} className="mb-2 inline-block lg:mb-0">
              <Image
                src="/logo-itn-with-name.svg"
                alt={siteConfig.title}
                width={200}
                height={70}
                priority
              />
            </Link>
            <Title
              as="h2"
              className="mb-7 text-center text-[28px] font-bold leading-snug md:text-3xl md:!leading-normal lg:mb-10 lg:text-4xl"
            >
              {title}
            </Title>
          </div>
          {isSocialLoginActive && (
            <>
              <div className="flex flex-col gap-4 pb-6 md:flex-row md:gap-6 xl:pb-7">
                <Button variant="outline" className="h-11 w-full">
                  <FcGoogle className="me-2 h-4 w-4 shrink-0" />
                  <span className="truncate">Signin with Google</span>
                </Button>
                <Button variant="outline" className="h-11 w-full">
                  <BsFacebook className="me-2 h-4 w-4 shrink-0 md:h-5 md:w-5" />
                  <span className="truncate">Signin with Facebook</span>
                </Button>
              </div>
              <OrSeparation
                title={`Or, Sign ${isSignIn ? 'in' : 'up'} with your email`}
                isCenter
                className="mb-5 2xl:mb-7"
              />
            </>
          )}

          {children}
        </div>
      </div>

      <AuthFooter />
    </div>
  );
}

function AuthHeader() {
  return (
    <header className="flex items-center justify-between p-4 lg:px-16 lg:py-6 2xl:px-24">
      <Link href={'/'}>
        <Image
          src="/logo-itn-with-name.svg"
          alt={siteConfig.title}
          width={130}
          height={34}
          priority
        />
      </Link>
    </header>
  );
}

const footerMenu = [
  {
    name: 'Help',
    href: '/',
  },
  {
    name: 'Privacy',
    href: '/',
  },
  {
    name: 'Terms',
    href: '/',
  },
];

function AuthFooter() {
  return (
    <footer className="flex flex-col-reverse items-center justify-between px-4 py-5 lg:flex-row lg:px-16 lg:py-6 2xl:px-24 2xl:py-10">
      <div className="text-center leading-relaxed text-gray-500 lg:text-start">
        © Copyright 2025. {' '}
        <Link
          href="https://redq.io/"
          className="font-medium transition-colors hover:text-primary"
        >
          ITN TRANS NETWORK
        </Link>
        , all rights reserved.
      </div>
      <div className="-mx-2.5 flex items-center justify-end pb-3 font-medium text-gray-700 lg:w-1/2 lg:pb-0">
        {/* {footerMenu.map((item) => (
          <Link
            key={item.name}
            href={item.href}
            className="px-2.5 py-1.5 transition-colors hover:text-primary"
          >
            {item.name}
          </Link>
        ))} */}
      </div>
    </footer>
  );
}
