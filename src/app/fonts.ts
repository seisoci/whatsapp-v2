import { Inter, Kalam, Lexend_Deca, Patrick_Hand, Public_Sans } from 'next/font/google';

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
