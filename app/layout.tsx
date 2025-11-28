import type { Metadata } from "next/types";
import { Inter, Poppins } from "next/font/google";
import NextTopLoader from "nextjs-toploader";
import "../styles/globals.css";
import { cn } from "@/lib/utils";
import { Providers } from "./providers";
import Script from "next/script";
import { SpeedInsights } from "@vercel/speed-insights/next";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap"
});

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-poppins",
  display: "swap"
});

export const metadata: Metadata = {
  title: "Orylis • Espace Client",
  description: "Espace client Orylis – Suivi de projet, tickets et ressources.",
  icons: {
    icon: "https://orylis.fr/wp-content/uploads/2025/09/cropped-Frame-454507530.png",
    shortcut: "https://orylis.fr/wp-content/uploads/2025/09/cropped-Frame-454507530.png",
    apple: "https://orylis.fr/wp-content/uploads/2025/09/cropped-Frame-454507530.png"
  }
};

import { Suspense } from "react";
import { ReferralTracker } from "@/components/referral/referral-tracker";

// ... existing imports ...

export default function RootLayout({ children }: { children: React.ReactNode }): JSX.Element {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body className={cn("min-h-screen w-full bg-background font-sans antialiased", inter.variable, poppins.variable)}>
        <NextTopLoader
          color="#43b2b9"
          height={3}
          showSpinner={false}
          easing="ease"
          speed={200}
          shadow="0 0 10px #43b2b9,0 0 5px #43b2b9"
        />
        <Suspense>
          <ReferralTracker />
        </Suspense>
        <div className="w-full max-w-full overflow-x-hidden">
          <Providers>{children}</Providers>
          <SpeedInsights />
        </div>
        {/* Meta Pixel Code */}
        <Script id="fb-pixel-base" strategy="afterInteractive">
          {`
            !function(f,b,e,v,n,t,s)
            {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
            n.callMethod.apply(n,arguments):n.queue.push(arguments)};
            if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
            n.queue=[];t=b.createElement(e);t.async=!0;
            t.src=v;s=b.getElementsByTagName(e)[0];
            s.parentNode.insertBefore(t,s)}(window, document,'script',
            'https://connect.facebook.net/en_US/fbevents.js');
            try { fbq('init', '1185205103095750'); fbq('track', 'PageView'); } catch(e) {}
          `}
        </Script>
        <noscript>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            height="1"
            width="1"
            style={{ display: "none" }}
            src="https://www.facebook.com/tr?id=1185205103095750&ev=PageView&noscript=1"
            alt=""
          />
        </noscript>
      </body>
    </html>
  );
}

