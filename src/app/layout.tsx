import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'CalenShare - Gérez votre temps. Ensemble.',
  description: 'Le premier calendrier partagé simple et intuitif conçu pour vous et vos proches. Synchronisation en temps réel, confidentialité absolue.',
  openGraph: {
    title: 'CalenShare',
    description: 'Le premier calendrier partagé simple et intuitif conçu pour vous et vos proches.',
    url: 'https://calenshare.app',
    siteName: 'CalenShare',
    images: [
      {
        url: 'https://images.unsplash.com/photo-1611224923853-80b023f02d71?q=80&w=1200&auto=format&fit=crop',
        width: 1200,
        height: 630,
        alt: 'CalenShare Preview',
      },
    ],
    locale: 'fr_FR',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className="dark" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased min-h-screen`}>
        {children}
      </body>
    </html>
  );
}

