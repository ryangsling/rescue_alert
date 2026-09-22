import type { Metadata } from "next";
import { Inter, Noto_Sans_Bengali } from "next/font/google";
import type { PropsWithChildren } from "react";
import "./globals.css";
import { ThemeVars } from "./theme-vars";
import { AppLocaleProvider } from "./locale-provider";

// next/font self-hosts at build time - no runtime request to Google,
// matching DESIGN.md section 6.1's "do not depend on downloading
// fonts during first launch."
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const notoSansBengali = Noto_Sans_Bengali({
  variable: "--font-noto-bengali",
  subsets: ["bengali"],
});

export const metadata: Metadata = {
  title: "Rescue Alert",
  description: "Community animal rescue coordination for Bangladesh",
};

export default function RootLayout({ children }: PropsWithChildren) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${notoSansBengali.variable} h-full`}
    >
      <head>
        <ThemeVars />
      </head>
      <body className="min-h-full font-sans antialiased">
        <AppLocaleProvider>{children}</AppLocaleProvider>
      </body>
    </html>
  );
}
