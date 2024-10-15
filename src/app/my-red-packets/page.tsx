"use client";

import { useState, useEffect } from 'react';
import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { Header } from "@/components/Header";
import { getRedPacketInfo } from "@/view-functions/getRedPacketInfo";
import { aptosClient } from "@/utils/aptosClient";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import Image from 'next/image';

interface RedPacket {
  id: number;
  totalAmount: number;
  remainingAmount: number;
  recipientCount: number;
  remainingCount: number;
}

export default function MyRedPacketsPage() {
  const { account } = useWallet();
  const [redPackets, setRedPackets] = useState<RedPacket[]>([]);
  const [selectedPacket, setSelectedPacket] = useState<RedPacket | null>(null);

  useEffect(() => {
    if (account) {
      fetchMyRedPackets(account.address);
    }
  }, [account]);

  const fetchMyRedPackets = async (address: string) => {
    try {
      const result = await aptosClient().view({
        payload: {
          function: `${process.env.NEXT_PUBLIC_MODULE_ADDRESS}::red_packet::get_creator_red_packets`,
          typeArguments: [],
          functionArguments: [address],
        },
      });

      const redPacketIds = result[0] as number[];
      const fetchedRedPackets: RedPacket[] = await Promise.all(
        redPacketIds.map(async (id) => {
          const info = await getRedPacketInfo(id);
          return {
            id,
            totalAmount: info.totalAmount,
            remainingAmount: info.remainingAmount,
            recipientCount: info.recipientCount,
            remainingCount: info.remainingCount
          };
        })
      );
      setRedPackets(fetchedRedPackets);
    } catch (error) {
    }
  };

  return (
    <div className="min-h-screen bg-red-800 flex flex-col  bg-repeat">
      <Header />
      <div className="flex-grow flex items-center justify-center p-4 relative">
        <div className="absolute inset-0 bg-[url('/images/wooden-table.jpg')] bg-cover bg-center filter blur-sm"></div>
        <div className="absolute inset-0 bg-[url('/images/paper-texture.png')] opacity-30 mix-blend-overlay"></div>
        
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="relative z-10 w-full max-w-4xl mx-auto p-6 md:p-8"
        >   
          <div className="relative z-20">
            <h1 className="text-3xl md:text-4xl font-bold mb-6 text-yellow-100 text-center text-shadow-sm" 
                style={{ fontFamily: "'Noto Serif TC', serif" }}>我的紅包</h1>
            <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {redPackets.map((redPacket) => (
                <motion.div
                  key={redPacket.id}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="cursor-pointer"
                  onClick={() => setSelectedPacket(redPacket)}
                >
                  <Image
                    src="/images/red-packet-icon.png"
                    alt={`紅包 #${redPacket.id}`}
                    width={100}
                    height={100}
                    className="mx-auto"
                  />
                  <p className="text-center text-yellow-100 mt-2" style={{ fontFamily: "'Noto Serif TC', serif" }}>
                    紅包 #{redPacket.id}
                  </p>
                </motion.div>
              ))}
            </div>

            {redPackets.length === 0 && (
              <p className="text-center text-yellow-100 text-xl" style={{ fontFamily: "'Noto Serif TC', serif" }}>
                您還沒有創建任何紅包
              </p>
            )}
          </div>
        </motion.div>

        <AnimatePresence>
          {selectedPacket && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 flex items-center justify-center z-50"
              onClick={() => setSelectedPacket(null)}
            >
              <motion.div 
                initial={{ y: "100%", opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: "100%", opacity: 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                className="bg-gradient-to-br from-red-600 to-red-700 p-6 rounded-3xl shadow-lg w-64 mx-4 relative"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="absolute inset-0 bg-[url('/images/paper-texture.png')] opacity-30 mix-blend-overlay rounded-3xl"></div>
                <div className="relative z-10 text-center">
                  <h2 className="text-2xl font-bold text-yellow-100 mb-4" style={{ fontFamily: "'Noto Serif TC', serif" }}>
                    紅包 #{selectedPacket.id}
                  </h2>
                  <p className="text-yellow-100" style={{ fontFamily: "'Noto Serif TC', serif" }}>總金額: {selectedPacket.totalAmount / 100000000} APT</p>
                  <p className="text-yellow-100" style={{ fontFamily: "'Noto Serif TC', serif" }}>剩餘金額: {selectedPacket.remainingAmount / 100000000} APT</p>
                  <p className="text-yellow-100" style={{ fontFamily: "'Noto Serif TC', serif" }}>領取情況: {selectedPacket.remainingCount} / {selectedPacket.recipientCount}</p>
                  <p className="text-yellow-100 mt-4" style={{ fontFamily: "'Noto Serif TC', serif" }}>
                    <a href={`${window.location.origin}/redpacket/${selectedPacket.id}`} 
                       className="text-yellow-300 hover:text-yellow-200 underline">
                      查看紅包連結
                    </a>
                  </p>
                  <div className="mt-6">
                    <Button 
                      onClick={() => setSelectedPacket(null)}
                      className={`
                        w-1/2 font-bold rounded-full shadow-md transform hover:scale-105 transition-all duration-300
                        focus:ring-2 focus:ring-yellow-400/50 focus:outline-none
                        text-sm md:text-base py-2 relative overflow-hidden
                        bg-gradient-to-r from-yellow-400 to-yellow-300 text-red-700 hover:from-yellow-300 hover:to-yellow-200 shadow-red-900/30
                      `}
                      style={{ 
                        fontFamily: "'Noto Serif TC', serif",
                        background: 'linear-gradient(to right, #fbbf24, #fcd34d)'
                      }}
                    >
                      <div className="absolute inset-0 bg-[url('/images/wood-texture.png')] opacity-30 mix-blend-overlay"></div>
                      <span className="relative z-10">關閉</span>
                    </Button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}