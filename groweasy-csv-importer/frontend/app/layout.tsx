import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'GrowEasy CSV Importer',
  description: 'AI-powered CRM lead importer — any CSV shape, mapped automatically.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="bg-base bg-grid bg-fixed min-h-screen">{children}</body>
    </html>
  );
}
