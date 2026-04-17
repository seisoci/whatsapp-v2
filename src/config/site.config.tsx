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
  title: 'Omnichat V2',
  description: `Omnichat V2 - Advanced omnichannel chat platform. Streamline your customer communication with our feature-rich, responsive, and highly customizable solution.`,
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
    title: title ? `${title} - Omnichat V2` : siteConfig.title,
    description,
    openGraph: openGraph ?? {
      title: title ? `${title} - Omnichat V2` : title,
      description,
      url: 'https://omnichat.com',
      siteName: 'Omnichat V2',
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
