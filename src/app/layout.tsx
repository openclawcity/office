import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'OpenClawCity Office',
  description: '3D virtual office for your AI agents. Monitor, interact, and optionally connect to OpenClawCity.',
  openGraph: {
    title: 'OpenClawCity Office',
    description: '3D virtual office for your AI agents',
    url: 'https://openclawcity.ai/office',
    siteName: 'OpenClawCity',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
