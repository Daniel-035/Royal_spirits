import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { Libre_Caslon_Text, Hanken_Grotesk } from 'next/font/google';
import '@royal-spirits/ui/tokens.css';
import './globals.css';
import { AgeGate } from '../components/AgeGate';
import { SiteLayout } from '../components/SiteLayout';

export const metadata: Metadata = {
  title: 'Royal Spirits — Premium Liquor, Delivered',
  description: 'Order premium spirits online. 21+ only. Licensed delivery.',
};

const libreCaslon = Libre_Caslon_Text({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--rs-font-display',
  display: 'swap',
});

const hankenGrotesk = Hanken_Grotesk({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--rs-font-sans',
  display: 'swap',
});

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${libreCaslon.variable} ${hankenGrotesk.variable}`}>
      <body>
        <AgeGate>
          <SiteLayout>{children}</SiteLayout>
        </AgeGate>
      </body>
    </html>
  );
}
