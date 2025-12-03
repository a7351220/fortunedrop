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
  // IMPORTANT: Privy creates Movement wallets with chainType: "aptos"
  const movementWallet = wallets.find((w) => {
    const chainType = w.chainType || (w as any).chain_type;
    return chainType === "movement" || chainType === "aptos";
  });

  console.log('[PrivyWalletButton] State:', {
    ready,
    authenticated,
    totalWallets: wallets.length,
    allWallets: wallets.map(w => ({
      address: w.address,
      chainType: w.chainType,
      chain_type: (w as any).chain_type,
      walletClientType: (w as any).walletClientType,
      connectorType: (w as any).connectorType
    })),
    hasMovementWallet: !!movementWallet,
    movementWallet: movementWallet ? {
      address: movementWallet.address,
      chainType: movementWallet.chainType,
      chain_type: (movementWallet as any).chain_type,
      walletClientType: (movementWallet as any).walletClientType
    } : null
  });

  const handleClick = useCallback(async () => {
    if (!ready) return;
    
    if (!authenticated) {
      console.log('[PrivyWalletButton] Logging in...');
      await login();
      return;
    }

    // If already has Movement wallet, do nothing
    if (movementWallet) {
      console.log('[PrivyWalletButton] Already has wallet');
      return;
    }

    setIsCreating(true);
    setError(null);
    try {
      console.log('[PrivyWalletButton] Creating Movement wallet...');
      const result = await createWallet({ chainType: "movement" });
      console.log('[PrivyWalletButton] Wallet created:', {
        address: result.wallet.address,
        chain_type: result.wallet.chain_type,
        public_key: (result.wallet as any).public_key
      });
      
      // Store in localStorage for persistence
      if (typeof window !== 'undefined') {
        localStorage.setItem('privy_movement_wallet', JSON.stringify(result.wallet));
      }

      // Wait a bit for Privy to sync, then reload page to refresh wallets
      console.log('[PrivyWalletButton] Wallet created successfully, reloading page...');
      setTimeout(() => {
        window.location.reload();
      }, 500);
    } catch (err) {
      console.error("[PrivyWalletButton] Failed to create wallet:", err);
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
