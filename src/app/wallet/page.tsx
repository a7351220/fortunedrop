"use client";

import { useState, useEffect } from "react";
import { useMovementWallet } from "@/components/MovementPrivyWalletProvider";
import { usePrivy } from "@privy-io/react-auth";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { WalletSelector } from "@/components/WalletSelector";
import { aptosClient } from "@/utils/aptosClient";
import { motion } from "framer-motion";
import { toast } from "@/components/ui/use-toast";

export default function WalletPage() {
  const { address, allWallets, connected, disconnect, selectWallet, isLoading } = useMovementWallet();
  const { user, authenticated, ready } = usePrivy();
  const [balance, setBalance] = useState<string | null>(null);

  console.log('[Wallet Page] Current state:', {
    address,
    allWalletsCount: allWallets.length,
    connected,
    authenticated,
    ready,
    isLoading
  });

  useEffect(() => {
    async function fetchBalance() {
      if (address) {
        try {
          const resources = await aptosClient().getAccountResources({
            accountAddress: address,
          });
          const accountResource = resources.find(
            (r) => r.type === "0x1::coin::CoinStore<0x1::aptos_coin::AptosCoin>"
          );
          if (accountResource) {
            const balanceValue = (accountResource.data as any).coin.value;
            setBalance((Number(balanceValue) / 100000000).toFixed(8));
          } else {
            setBalance("0");
          }
        } catch (error) {
          console.error("Failed to fetch balance:", error);
          setBalance("無法取得");
        }
      }
    }

    fetchBalance();
  }, [address]);

  const handleCopyAddress = () => {
    if (address) {
      navigator.clipboard.writeText(address);
      toast({
        title: "已複製",
        description: "地址已複製到剪貼簿",
      });
    }
  };

  // Show loading while Privy is initializing
  if (!ready || isLoading) {
    return (
      <div className="min-h-screen bg-red-800 flex flex-col">
        <Header />
        <div className="flex-grow flex items-center justify-center p-4">
          <div className="text-center text-yellow-100 bg-red-800 bg-opacity-70 p-8 rounded-3xl">
            <h2 className="text-3xl font-bold mb-4" style={{ fontFamily: "'Noto Serif TC', serif" }}>
              載入中...
            </h2>
          </div>
        </div>
      </div>
    );
  }

  // If we have an address (from any source), allow access
  if (!address) {
    // Check if user is authenticated but no wallet
    if (authenticated) {
      return (
        <div className="min-h-screen bg-red-800 flex flex-col">
          <Header />
          <div className="flex-grow flex items-center justify-center p-4">
            <div className="text-center text-yellow-100 bg-red-800 bg-opacity-70 p-8 rounded-3xl">
              <h2 className="text-3xl font-bold mb-4" style={{ fontFamily: "'Noto Serif TC', serif" }}>
                請先創建 Movement 錢包
              </h2>
            </div>
          </div>
        </div>
      );
    }
    
    // Not authenticated and no wallet
    return (
      <div className="min-h-screen bg-red-800 flex flex-col">
        <Header />
        <div className="flex-grow flex items-center justify-center p-4">
          <div className="text-center text-yellow-100 bg-red-800 bg-opacity-70 p-8 rounded-3xl">
            <h2 className="text-3xl font-bold mb-4" style={{ fontFamily: "'Noto Serif TC', serif" }}>
              請先登入 Privy
            </h2>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-red-800 flex flex-col bg-repeat">
      <Header />
      <div className="flex-grow flex items-center justify-center p-4 relative">
        <div className="absolute inset-0 bg-[url('/images/wooden-table.jpg')] bg-cover bg-center filter blur-sm"></div>
        <div className="absolute inset-0 bg-[url('/images/paper-texture.png')] opacity-30 mix-blend-overlay"></div>

        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="relative z-10 w-full max-w-2xl mx-auto"
        >
          <div className="bg-gradient-to-br from-red-600 to-red-700 p-8 rounded-3xl shadow-lg relative overflow-hidden">
            <div className="absolute inset-0 bg-[url('/images/paper-texture.png')] opacity-30 mix-blend-overlay rounded-3xl"></div>
              <div className="relative z-10">
              <div className="flex items-center justify-between mb-8">
                <h1 className="text-4xl font-bold text-yellow-100" 
                    style={{ fontFamily: "'Noto Serif TC', serif", textShadow: '2px 2px 4px rgba(0,0,0,0.5)' }}>
                  我的錢包
                </h1>
                {allWallets.length > 1 && (
                  <WalletSelector 
                    allWallets={allWallets}
                    selectedAddress={address || null} 
                    onSelectWallet={selectWallet}
                  />
                )}
              </div>

              <div className="space-y-6">
                {/* Authentication Status */}
                {!authenticated && (
                  <div className="bg-yellow-600 bg-opacity-80 p-4 rounded-lg mb-4">
                    <p className="text-red-900 text-sm font-bold mb-2" style={{ fontFamily: "'Noto Serif TC', serif" }}>
                      ⚠️ 登入狀態已過期
                    </p>
                    <p className="text-red-900 text-xs" style={{ fontFamily: "'Noto Serif TC', serif" }}>
                      無法匯出私鑰或進行交易。請點擊下方「登出錢包」後重新登入。
                    </p>
                  </div>
                )}

                {/* User Info */}
                {user && (
                  <div className="bg-red-800 bg-opacity-50 p-4 rounded-lg">
                    <p className="text-yellow-100 text-sm mb-2" style={{ fontFamily: "'Noto Serif TC', serif" }}>
                      用戶 ID
                    </p>
                    <p className="text-yellow-100 font-mono text-xs break-all">
                      {user.id}
                    </p>
                  </div>
                )}

                {/* Wallet Address */}
                <div className="bg-red-800 bg-opacity-50 p-4 rounded-lg">
                  <p className="text-yellow-100 text-sm mb-2" style={{ fontFamily: "'Noto Serif TC', serif" }}>
                    Movement 錢包地址
                  </p>
                  <div className="flex items-center gap-2">
                    <p className="text-yellow-100 font-mono text-xs break-all flex-1">
                      {address}
                    </p>
                    <Button
                      onClick={handleCopyAddress}
                      className="bg-yellow-400 hover:bg-yellow-300 text-red-700 text-xs px-3 py-1"
                      style={{ fontFamily: "'Noto Serif TC', serif" }}
                    >
                      複製
                    </Button>
                  </div>
                </div>

                {/* Balance */}
                <div className="bg-red-800 bg-opacity-50 p-4 rounded-lg">
                  <p className="text-yellow-100 text-sm mb-2" style={{ fontFamily: "'Noto Serif TC', serif" }}>
                    餘額
                  </p>
                  <p className="text-yellow-100 text-2xl font-bold" style={{ fontFamily: "'Noto Serif TC', serif" }}>
                    {balance !== null ? `${balance} APT` : "載入中..."}
                  </p>
                </div>

                {/* Wallet Security Info */}
                <div className="bg-red-800 bg-opacity-50 p-4 rounded-lg">
                  <p className="text-yellow-100 text-sm mb-4" style={{ fontFamily: "'Noto Serif TC', serif" }}>
                    錢包安全
                  </p>
                  <div className="space-y-3">
                    <div className="bg-green-600 bg-opacity-20 p-3 rounded border border-green-400/30">
                      <p className="text-green-200 text-xs mb-2 font-bold" style={{ fontFamily: "'Noto Serif TC', serif" }}>
                        ✓ 你的錢包已安全儲存
                      </p>
                      <p className="text-yellow-100 text-xs leading-relaxed" style={{ fontFamily: "'Noto Serif TC', serif" }}>
                        Movement 錢包由 Privy 安全管理，使用業界標準的加密技術保護。你可以隨時使用相同帳號登入來存取你的錢包。
                      </p>
                    </div>
                    <div className="bg-yellow-600 bg-opacity-20 p-3 rounded">
                      <p className="text-yellow-200 text-xs mb-2" style={{ fontFamily: "'Noto Serif TC', serif" }}>
                        ⚠️ 關於私鑰匯出
                      </p>
                      <p className="text-yellow-100 text-xs leading-relaxed mb-2" style={{ fontFamily: "'Noto Serif TC', serif" }}>
                        由於技術限制，Movement/Aptos 錢包目前無法直接透過網頁匯出私鑰。
                      </p>
                      <p className="text-yellow-100 text-xs leading-relaxed" style={{ fontFamily: "'Noto Serif TC', serif" }}>
                        如需備份錢包，請確保你能隨時登入此 Privy 帳號。建議啟用雙重驗證(MFA)以提高安全性。
                      </p>
                    </div>
                  </div>
                </div>

                {/* Disconnect */}
                <div className="pt-4">
                  <Button
                    onClick={disconnect}
                    className="w-full bg-red-900 hover:bg-red-800 text-yellow-100 font-bold py-3"
                    style={{ fontFamily: "'Noto Serif TC', serif" }}
                  >
                    登出錢包
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

