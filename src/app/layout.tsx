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
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                var html = document.documentElement;
                var theme = localStorage.getItem('koinonia-theme');
                var hour = new Date().getHours();
                var isNight = hour >= 21 || hour < 6;
                var isDark = theme === 'dark' || (!theme && (isNight || window.matchMedia('(prefers-color-scheme: dark)').matches));
                if (isDark) {
                  html.classList.add('dark');
                } else {
                  html.classList.remove('dark');
                }
              })();
            `,
          }}
        />
      </head>
      <body className="min-h-full font-sans antialiased">
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
