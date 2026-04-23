import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { AppProviders } from "@/components/providers/app-providers";
import "./globals.css";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Koinonia",
  description: "Base pastoral do Koinonia pronta para evoluir pelas próximas ondas.",
  applicationName: "Koinonia",
  manifest: "/manifest.json",
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-BR"
      suppressHydrationWarning
      className={`${inter.variable} h-full`}
    >
      <body className="min-h-full font-sans text-stone-900">
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
