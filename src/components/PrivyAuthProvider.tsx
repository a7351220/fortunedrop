"use client";

import type { PropsWithChildren } from "react";
import { PrivyProvider } from "@privy-io/react-auth";

const PRIVY_APP_ID = process.env.NEXT_PUBLIC_PRIVY_APP_ID;

export function PrivyAuthProvider({ children }: PropsWithChildren) {
  if (!PRIVY_APP_ID) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("NEXT_PUBLIC_PRIVY_APP_ID is not set; Privy will be disabled.");
    }
    return <>{children}</>;
  }

  return (
    <PrivyProvider
      appId={PRIVY_APP_ID}
      config={{
        embeddedWallets: {
          // Create embedded wallet on login to ensure it's available
          createOnLogin: "users-without-wallets",
          // Require manual approval for transactions
          requireUserPasswordOnCreate: false,
        },
        // Enable Aptos/Movement support
        supportedChains: [
          {
            id: 250, // Movement Testnet Chain ID
            name: "Movement Testnet",
            network: "bardock-testnet",
            nativeCurrency: {
              name: "Movement",
              symbol: "MOVE",
              decimals: 8,
            },
            rpcUrls: {
              default: {
                http: ["https://testnet.bardock.movementnetwork.xyz/v1"],
              },
              public: {
                http: ["https://testnet.bardock.movementnetwork.xyz/v1"],
              },
            },
            blockExplorers: {
              default: {
                name: "Movement Explorer",
                url: "https://explorer.movementnetwork.xyz",
              },
            },
          },
        ] as any,
      }}
    >
      {children}
    </PrivyProvider>
  );
}


