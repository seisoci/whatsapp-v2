import { AuthProvider } from '@/lib/auth-context';
import AuthGuard from '@/components/auth-guard';
import GlobalDrawer from '@/app/shared/drawer-views/container';
import GlobalModal from '@/app/shared/modal-views/container';
import { JotaiProvider, ThemeProvider } from '@/app/shared/theme-provider';
import { siteConfig } from '@/config/site.config';
import {
  inter,
  kalam,
  lexendDeca,
  outfit,
  patrickHand,
  plusJakartaSans,
  publicSans,
} from '@/app/fonts';
import cn from '@core/utils/class-names';
import NextProgress from '@core/components/next-progress';
import { Toaster } from 'react-hot-toast';

import 'swiper/css';
import 'swiper/css/navigation';
import '@/app/globals.css';

export const metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001'),
  title: siteConfig.title,
  description: siteConfig.description,
  icons: {
    icon: [
      { url: '/favicon.ico' },
      { url: '/icon.png', sizes: '192x192', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-icon.png', sizes: '180x180', type: 'image/png' },
    ],
    shortcut: '/favicon.ico',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      dir="ltr"
      suppressHydrationWarning
    >
      <body
        // to prevent any warning that is caused by third party extensions like Grammarly
        suppressHydrationWarning
        className={cn(
          inter.variable,
          lexendDeca.variable,
          publicSans.variable,
          kalam.variable,
          patrickHand.variable,
          outfit.variable,
          plusJakartaSans.variable,
          'font-inter'
        )}
      >
        <AuthProvider>
          <ThemeProvider>
            <NextProgress />
            <Toaster
              position="top-right"
              toastOptions={{
                duration: 4000,
              }}
            />
            <AuthGuard>
              <JotaiProvider>
                {children}
                <GlobalDrawer />
                <GlobalModal />
              </JotaiProvider>
            </AuthGuard>
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
