import type { Metadata } from "next/types";
import { Inter, Poppins } from "next/font/google";
import NextTopLoader from "nextjs-toploader";
import "../styles/globals.css";
import { cn } from "@/lib/utils";
import { Providers } from "./providers";

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
  title: "Orylis Hub",
  description: "Espace client Orylis – Suivi de projet, tickets et ressources."
};

export default function RootLayout({ children }: { children: React.ReactNode }): JSX.Element {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body className={cn("min-h-screen bg-background font-sans antialiased", inter.variable, poppins.variable)}>
        <NextTopLoader
          color="#43b2b9"
          height={3}
          showSpinner={false}
          easing="ease"
          speed={200}
          shadow="0 0 10px #43b2b9,0 0 5px #43b2b9"
        />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

