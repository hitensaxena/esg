import { Metadata, Viewport } from 'next';

export const metadata: Metadata = {
  title: "ESG Dashboard",
  description: "Environmental, Social, and Governance Dashboard",
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'),
  openGraph: {
    title: "ESG Dashboard",
    description: "Environmental, Social, and Governance Dashboard",
    url: "/",
    siteName: "ESG Dashboard",
    locale: "en_US",
    type: "website",
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};
