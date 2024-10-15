"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/Header";
import { RedPacket } from "@/components/RedPacket";
import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { motion, AnimatePresence } from "framer-motion";

function App() {
  const { connected } = useWallet();
  const [isCreating, setIsCreating] = useState(false);
  const router = useRouter();

  const handleCreateSuccess = () => {
    router.push('/my-red-packets');
  };

  return (
    <div className="min-h-screen bg-red-800 flex flex-col bg-repeat">
      <Header />
      <div className="flex-grow flex items-center justify-center p-4 relative">
        <div className={`absolute inset-0 bg-[url('/images/red-packet-bg.png')] bg-cover bg-center transition-all duration-500 ${isCreating ? 'filter blur-sm' : ''}`}></div>
        <div className="absolute inset-0 bg-[url('/images/paper-texture.png')] opacity-30 mix-blend-overlay"></div>
        
        <div className="relative z-10 w-full max-w-md mx-auto">
          <AnimatePresence mode="wait">
            {!isCreating ? (
              <motion.button
                key="create-button"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="w-full bg-gradient-to-b from-yellow-500 to-yellow-600 text-red-800 font-bold py-6 px-8 rounded-lg shadow-lg
                           hover:from-yellow-400 hover:to-yellow-500 transition-all duration-300
                           border-4 border-red-800 text-2xl md:text-3xl lg:text-4xl relative overflow-hidden"
                onClick={() => setIsCreating(true)}
                style={{ 
                  fontFamily: "'Noto Serif TC', serif",
                  fontWeight: 700,
                  textShadow: '2px 2px 4px rgba(0,0,0,0.3)'
                }}
              >
                <div className="absolute inset-0 bg-[url('/images/wood-texture.png')] opacity-30 mix-blend-overlay"></div>
                <div className="relative z-10">創建紅包</div>
                <div className="absolute top-0 left-0 w-full h-2 bg-red-800"></div>
                <div className="absolute bottom-0 left-0 w-full h-2 bg-red-800"></div>
                <div className="absolute top-0 left-0 w-2 h-full bg-red-800"></div>
                <div className="absolute top-0 right-0 w-2 h-full bg-red-800"></div>
              </motion.button>
            ) : (
              <motion.div
                key="create-form"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="bg-gradient-to-br from-red-600 to-red-700 rounded-3xl p-6 md:p-8 shadow-[0_10px_20px_rgba(0,0,0,0.3)] 
                           w-full relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-[url('/images/paper-texture.png')] opacity-30 mix-blend-overlay"></div>
                <div className="relative z-30">
                  <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-yellow-100 text-center mb-6 md:mb-8 
                                 text-shadow-sm shadow-black/50" 
                      style={{ 
                        fontFamily: "'Noto Serif TC', serif",
                        fontWeight: 700,
                        textShadow: '2px 2px 4px rgba(0,0,0,0.3)'
                      }}>
                    創建紅包
                  </h2>
                  {connected ? (
                    <RedPacket onClose={() => setIsCreating(false)} onCreateSuccess={handleCreateSuccess} />
                  ) : (
                    <div className="text-center text-yellow-100">
                      <p className="mb-4" style={{ 
                        fontFamily: "'Noto Serif TC', serif",
                        fontWeight: 400
                      }}>
                        請連接錢包或創建錢包
                      </p>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

export default App;
