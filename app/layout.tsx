import { Nunito } from 'next/font/google';

import './globals.css';
import { Providers } from '@/shared/components/shared/providers';
import { themeInitScript } from '@/shared/components/shared/theme-provider';

const nunito = Nunito({
  subsets: ['cyrillic'],
  variable: '--font-nunito',
  weight: ['400', '500', '600', '700', '800', '900'],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link data-rh="true" rel="icon" href="/logo.png" />
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className={`${nunito.className} ${nunito.variable}`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
