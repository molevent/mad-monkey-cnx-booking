import type { Metadata } from "next";
import { DM_Sans } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "@/components/theme-provider";
import { TooltipProvider } from "@/components/ui/tooltip";

const dmSans = DM_Sans({ subsets: ["latin"], weight: ["300", "400", "500", "600", "700"] });

const SITE_NAME = "Mad Monkey eBike Tours";
const SITE_DESCRIPTION = "Explore Chiang Mai on electric bikes. Guided eBike tours through mountains, temples, and hidden gems of Northern Thailand.";
const LOGO_URL = "/logo.png";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3001"),
  title: {
    default: `${SITE_NAME} | Chiang Mai`,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  keywords: [
    "eBike tours",
    "Chiang Mai",
    "electric bike",
    "cycling tours",
    "Thailand tours",
    "mountain biking",
    "Doi Suthep",
    "adventure tours",
    "Mad Monkey",
    "guided tours",
  ],
  authors: [{ name: SITE_NAME }],
  creator: SITE_NAME,
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: SITE_NAME,
    title: `${SITE_NAME} | Chiang Mai`,
    description: SITE_DESCRIPTION,
    images: [
      {
        url: LOGO_URL,
        width: 800,
        height: 600,
        alt: "Mad Monkey eBike Tours Logo",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE_NAME} | Chiang Mai`,
    description: SITE_DESCRIPTION,
    images: [LOGO_URL],
  },
  icons: {
    icon: LOGO_URL,
    apple: LOGO_URL,
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${dmSans.className} antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          <TooltipProvider delayDuration={300}>
            {children}
          </TooltipProvider>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
