"use client";

import { useCallback, useState } from "react";
import { usePrivy, useWallets } from "@privy-io/react-auth";
import { useCreateWallet } from "@privy-io/react-auth/extended-chains";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export function PrivyWalletButton() {
  const { ready, authenticated, login } = usePrivy();
  const { wallets } = useWallets();
  const { createWallet } = useCreateWallet();
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check for Movement/Aptos wallet
  // Note: ConnectedWallet from useWallets() doesn't have chainType
  // We rely on the MovementPrivyWalletProvider to filter wallets correctly
  // Here we just check if there are any Privy embedded wallets
  const movementWallet = wallets.find((w) => {
    const wallet = w as any;
    // Check if it's a Privy embedded wallet
    return wallet.walletClientType === 'privy' || wallet.walletClientType === 'privy-v2';
  });

  const handleClick = useCallback(async () => {
    if (!ready) return;
    
    if (!authenticated) {
      await login();
      return;
    }

    // If already has Movement wallet, do nothing
    if (movementWallet) return;

    setIsCreating(true);
    setError(null);
    try {
      const result = await createWallet({ chainType: "movement" });
      
      // Store in localStorage for persistence
      if (typeof window !== 'undefined') {
        localStorage.setItem('privy_movement_wallet', JSON.stringify(result.wallet));
      }

      // Wait a bit for Privy to sync, then reload page to refresh wallets
      setTimeout(() => {
        window.location.reload();
      }, 500);
    } catch (err) {
      if (process.env.NODE_ENV !== 'production') {
        console.error("[PrivyWalletButton] Failed to create wallet:", err);
      }
      const errorMessage = err instanceof Error ? err.message : String(err);
      if (errorMessage.includes("maximum limit") || errorMessage.includes("already exists")) {
        setError("已有錢包存在，請重新整理頁面。");
        // Auto-reload after 2 seconds
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      } else {
        setError("創建錢包失敗: " + errorMessage);
      }
      setIsCreating(false);
    }
  }, [ready, authenticated, login, createWallet, movementWallet]);

  // If has wallet, show wallet info
  if (movementWallet) {
    return (
      <div className="text-center text-yellow-100">
        <p className="mb-2 text-sm" style={{ fontFamily: "'Noto Serif TC', serif" }}>
          Movement 錢包已連接
        </p>
        <p className="font-mono text-xs break-all mb-4">
          {movementWallet.address}
        </p>
        <Link href="/wallet">
          <Button 
            className="bg-yellow-400 hover:bg-yellow-300 text-red-700 font-bold"
            style={{ fontFamily: "'Noto Serif TC', serif" }}
          >
            管理錢包
          </Button>
        </Link>
      </div>
    );
  }

  // Show login/create button
  const label = !authenticated
    ? "登入 Privy"
    : isCreating
    ? "創建中..."
    : "創建 Movement 錢包";

  return (
    <div className="flex flex-col items-center gap-2">
      <Button 
        type="button" 
        onClick={handleClick} 
        disabled={!ready || isCreating}
        className="bg-yellow-400 hover:bg-yellow-300 text-red-700 font-bold"
        style={{ fontFamily: "'Noto Serif TC', serif" }}
      >
        {label}
      </Button>
      {error && (
        <p className="text-yellow-200 text-xs text-center max-w-xs" style={{ fontFamily: "'Noto Serif TC', serif" }}>
          {error}
        </p>
      )}
    </div>
  );
}
