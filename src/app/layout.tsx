import type { Metadata } from "next";
import type { ReactNode } from "react";

import { ReactQueryProvider } from "@/components/ReactQueryProvider";
import { PrivyAuthProvider } from "@/components/PrivyAuthProvider";
import { MovementPrivyWalletProvider } from "@/components/MovementPrivyWalletProvider";
import { Toaster } from "@/components/ui/toaster";

import "./globals.css";

const globalStyles = `
  body {
    background-repeat: repeat;
  }
  .text-shadow-sm {
    text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.3);
  }
`;

export const metadata: Metadata = {
  title: "紅包拿來",
  description: "Create and claim red packets on Aptos blockchain",
  icons: [
    {
      rel: 'icon',
      type: 'image/png',
      sizes: '32x32',
      url: '/images/red-packet-icon.png',
    },
  ],
};

export default function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Noto+Serif+TC:wght@400;700&display=swap" rel="stylesheet" />
        <style>{globalStyles}</style>
      </head>
      <body>
        <PrivyAuthProvider>
          <MovementPrivyWalletProvider>
            <ReactQueryProvider>
              <div id="root">{children}</div>
              <Toaster />
            </ReactQueryProvider>
          </MovementPrivyWalletProvider>
        </PrivyAuthProvider>
      </body>
    </html>
  );
}
