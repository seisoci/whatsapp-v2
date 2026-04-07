import {
  Inter,
  Kalam,
  Lexend_Deca,
  Outfit,
  Patrick_Hand,
  Plus_Jakarta_Sans,
  Public_Sans,
} from 'next/font/google';

export const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const lexendDeca = Lexend_Deca({
  subsets: ['latin'],
  variable: '--font-lexend',
});

export const publicSans = Public_Sans({
  subsets: ['latin'],
  variable: '--font-public-sans',
});

export const kalam = Kalam({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-kalam',
});

export const patrickHand = Patrick_Hand({
  subsets: ['latin'],
  weight: '400',
  variable: '--font-patrick-hand',
});

export const outfit = Outfit({
  subsets: ['latin'],
  weight: ['700', '800'],
  variable: '--font-outfit',
});

export const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '700'],
  variable: '--font-plus-jakarta-sans',
});
