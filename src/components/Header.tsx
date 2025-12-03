"use client";

import Link from 'next/link';
import Image from 'next/image';
import { useMovementWallet } from "./MovementPrivyWalletProvider";
import { Button } from "./ui/button";

export function Header() {
  const { address, connected } = useMovementWallet();

  return (
    <header className="bg-red-700 p-4 flex justify-between items-center relative overflow-hidden
                       border-b-4 border-yellow-400 shadow-lg">
      <div className="absolute inset-0 bg-[url('/images/paper-texture.png')] opacity-30"></div>
      <div className="relative z-10 flex justify-between items-center w-full">
      <div className="flex items-center">
        <Image src="/images/red-packet-icon.png" alt="Logo" width={40} height={40} className="mr-2" />
        <Link href="/" className="text-3xl font-bold text-yellow-100 text-shadow-sm hover:text-yellow-200 transition-colors" 
              style={{ fontFamily: "'Noto Serif TC', serif" }}>
          紅包拿來
        </Link>
      </div>
        <div className="flex items-center space-x-4">
          <Link href="/my-red-packets" className="text-yellow-100 hover:text-yellow-200 text-base"
                style={{ fontFamily: "'Noto Serif TC', serif" }}>
            我的紅包
          </Link>
          {connected && address && (
            <Link href="/wallet">
              <Button 
                className="bg-yellow-400 hover:bg-yellow-300 text-red-700 font-bold"
                style={{ fontFamily: "'Noto Serif TC', serif" }}
              >
                {address.slice(0, 6)}...{address.slice(-4)}
              </Button>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
