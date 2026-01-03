'use client';

import { ThemeProvider as NextThemeProvider } from 'next-themes';
export { useTheme } from 'next-themes';


export function ThemeProvider({
  children,
  defaultTheme,
}: React.PropsWithChildren<{
  defaultTheme: string;
}>) {
  return (
    <NextThemeProvider enableSystem={false} defaultTheme={defaultTheme}>
      {children}
    </NextThemeProvider>
  );
}
