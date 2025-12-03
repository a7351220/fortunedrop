"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface WalletSelectorProps {
  allWallets: any[];
  selectedAddress: string | null;
  onSelectWallet: (address: string) => void;
}

export function WalletSelector({ allWallets, selectedAddress, onSelectWallet }: WalletSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);

  if (allWallets.length === 0) {
    return null;
  }

  if (allWallets.length === 1) {
    // Only one wallet, no need for selector
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className="bg-red-800 bg-opacity-50 border-yellow-400 text-yellow-100 hover:bg-red-700"
          style={{ fontFamily: "'Noto Serif TC', serif" }}
        >
          <span className="mr-2">💼</span>
          切換錢包 ({allWallets.length})
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-gradient-to-br from-red-600 to-red-700 border-yellow-400">
        <DialogHeader>
          <DialogTitle className="text-yellow-100 text-2xl" style={{ fontFamily: "'Noto Serif TC', serif" }}>
            選擇 Movement 錢包
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3 mt-4 max-h-96 overflow-y-auto">
          {allWallets.map((wallet, index) => {
            const walletAddress = wallet.address || (wallet as any).address;
            const isSelected = walletAddress === selectedAddress;
            const isLatest = index === allWallets.length - 1;
            
            return (
              <div
                key={walletAddress}
                onClick={() => {
                  onSelectWallet(walletAddress);
                  setIsOpen(false);
                }}
                className={`p-4 rounded-lg cursor-pointer transition-all ${
                  isSelected
                    ? "bg-yellow-400 text-red-700 border-2 border-yellow-300"
                    : "bg-red-800 bg-opacity-50 text-yellow-100 border border-yellow-400/30 hover:bg-red-700"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-bold" style={{ fontFamily: "'Noto Serif TC', serif" }}>
                    錢包 #{allWallets.length - index}
                    {isLatest && " (最新)"}
                  </p>
                  {isSelected && (
                    <span className="text-lg">✓</span>
                  )}
                </div>
                <p className="font-mono text-xs break-all opacity-80">
                  {walletAddress}
                </p>
              </div>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}


