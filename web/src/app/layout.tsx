'use client';

import { Inter, Outfit } from "next/font/google";
import "./globals.css";
import { useStore } from "@/store/useStore";
import { useEffect, useState } from "react";
import { AuthProvider } from "@/components/AuthProvider";

const inter = Inter({ subsets: ["latin"], variable: '--font-inter' });
const outfit = Outfit({ subsets: ["latin"], variable: '--font-outfit' });

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const theme = useStore((state) => state.theme);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <html lang="en" className={mounted ? theme : 'dark'}>
      <head>
        <title>TeamFlow | Modern Collaboration</title>
      </head>
      <body className={`${inter.variable} ${outfit.variable} font-sans antialiased min-h-screen`}>
        {mounted ? (
          <AuthProvider>
            {children}
          </AuthProvider>
        ) : (
          <div className="min-h-screen bg-[#09090b]"></div>
        )}
      </body>
    </html>
  );
}
