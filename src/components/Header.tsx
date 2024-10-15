import { WalletSelector } from "./WalletSelector";
import Link from 'next/link';
import Image from 'next/image';
export function Header() {
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
          <WalletSelector />
        </div>
      </div>
    </header>
  );
}
