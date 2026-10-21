import { BRAND } from '@/lib/brand';
import type { Metadata } from 'next';
import { Bricolage_Grotesque, Cormorant_Garamond, Hanken_Grotesk } from 'next/font/google';
import './globals.css';
import Providers from '@/components/Providers';
import { GoogleAnalytics } from '@next/third-parties/google';

const display = Bricolage_Grotesque({ subsets: ['latin'], variable: '--font-display' });
const body = Hanken_Grotesk({ subsets: ['latin'], variable: '--font-body' });
const brand = Cormorant_Garamond({ subsets: ['latin'], weight: ['600', '700'], variable: '--font-brand' });

export const metadata: Metadata = {
  title: `${BRAND.name} – Pakistan’s clothing marketplace`,
  description: 'Shop kurtas, lawn, waistcoats, kids wear and more from verified Pakistani clothing shops. Cash on delivery nationwide.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable} ${brand.variable}`}>
      <body
      ><Providers>
        {children}
         <GoogleAnalytics gaId="G-VFY4X4CG7R" />
        </Providers></body>
    </html>
  );
}
