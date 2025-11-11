import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "../styles/globals.css";
import { cn } from "@/lib/utils";
import { Providers } from "./providers";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap"
});

export const metadata: Metadata = {
  title: "Orylis Hub",
  description: "Espace client Orylis – Suivi de projet, tickets et ressources."
};

export default function RootLayout({ children }: { children: React.ReactNode }): JSX.Element {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body className={cn("min-h-screen bg-background font-sans antialiased", inter.variable)}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

