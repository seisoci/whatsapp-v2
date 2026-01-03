import { Metadata } from 'next';
import logoImg from '@public/logo.svg';
import { LAYOUT_OPTIONS } from '@/config/enums';
import logoIconImg from '@public/logo-short.svg';
import { OpenGraph } from 'next/dist/lib/metadata/types/opengraph-types';

enum MODE {
  DARK = 'dark',
  LIGHT = 'light',
}

export const siteConfig = {
  title: 'SmartITN',
  description: `SmartITN - Smart IT Network Management System. Streamline your network infrastructure management with our feature-rich, responsive, and highly customizable solution.`,
  logo: logoImg,
  icon: logoIconImg,
  mode: MODE.LIGHT,
  layout: LAYOUT_OPTIONS.HYDROGEN,
};

export const metaObject = (
  title?: string,
  openGraph?: OpenGraph,
  description: string = siteConfig.description
): Metadata => {
  return {
    title: title ? `${title} - SmartITN` : siteConfig.title,
    description,
    openGraph: openGraph ?? {
      title: title ? `${title} - SmartITN` : title,
      description,
      url: 'https://smartitn.com',
      siteName: 'SmartITN',
      images: {
        url: '/logo-itn.svg',
        width: 1200,
        height: 630,
      },
      locale: 'en_US',
      type: 'website',
    },
  };
};
