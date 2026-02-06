import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Kimi Agent - AI Chat with Code Execution',
  description: 'A powerful AI agent powered by Kimi K2.5 with code execution sandbox',
  keywords: ['AI', 'Chat', 'Kimi', 'Code Execution', 'Sandbox', 'K2.5'],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} antialiased`}>
        {children}
      </body>
    </html>
  );
}
