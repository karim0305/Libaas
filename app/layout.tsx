import type { Metadata } from 'next';
import { Bricolage_Grotesque, Hanken_Grotesk } from 'next/font/google';
import './globals.css';
import Providers from '@/components/Providers';

const display = Bricolage_Grotesque({ subsets: ['latin'], variable: '--font-display' });
const body = Hanken_Grotesk({ subsets: ['latin'], variable: '--font-body' });

export const metadata: Metadata = {
  title: 'Libaas – Pakistan’s clothing marketplace',
  description: 'Shop kurtas, lawn, waistcoats, kids wear and more from verified Pakistani clothing shops. Cash on delivery nationwide.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable}`}>
      <body><Providers>{children}</Providers></body>
    </html>
  );
}
