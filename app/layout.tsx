import type { Metadata } from "next";
import { Figtree, Pacifico } from "next/font/google";
import "./globals.css";
import Providers from "@/providers/providers";
import { APP_NAME } from "@/constants/values";

const figtree = Figtree({
  variable: "--font-figtree",
  subsets: ["latin"],
});

const pacifico = Pacifico({
  variable: "--font-pacifico",
  weight: "400",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: `${APP_NAME} – Professional Invoicing, Made Simple`,
  description:
    "Create professional invoices, send via link, track views, and get paid with mobile money. Built for Africa.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="apple-mobile-web-app-title" content="Ankaara" />
      </head>
      <body className={`${figtree.variable} ${pacifico.variable} antialiased`}>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              !(function() {
                try {
                  const stored = localStorage.getItem('preferences-store');
                  let theme = 'light';
                  let language = 'sw';
                  
                  if (stored) {
                    const preferences = JSON.parse(stored);
                    if (preferences && preferences.state) {
                      theme = preferences.state.theme || 'light';
                      language = preferences.state.language || 'sw';
                    }
                  }
                  
                  // Apply theme immediately (only light/dark; legacy "system" treated as light)
                  const resolvedTheme = (theme === 'light' || theme === 'dark') ? theme : 'light';
                  document.documentElement.classList.toggle('dark', resolvedTheme === 'dark');
                  
                  // Apply language immediately
                  if (language) {
                    document.documentElement.lang = language;
                  }
                  
                  // Mark as initialized to show content
                  document.documentElement.setAttribute('data-theme-initialized', 'true');
                } catch (e) {
                  // Fallback to light theme on error
                  document.documentElement.classList.toggle('dark', false);
                  document.documentElement.lang = 'sw';
                  document.documentElement.setAttribute('data-theme-initialized', 'true');
                }
              })();
            `,
          }}
        />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
