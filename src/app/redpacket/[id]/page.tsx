"use client";

import { useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { useMovementWallet } from "@/components/MovementPrivyWalletProvider";
import { Header } from "@/components/Header";
import { getRedPacketInfo } from "@/view-functions/getRedPacketInfo";
import { motion, AnimatePresence } from "framer-motion";
import { claimRedPacket } from "@/entry-functions/claimRedPacket";
import { toast } from "@/components/ui/use-toast";
import { aptosClient } from "@/utils/aptosClient";
import { Button } from "@/components/ui/button";

export default function RedPacketPage() {
  const params = useParams();
  const router = useRouter();
  const id = typeof params.id === 'string' ? params.id : Array.isArray(params.id) ? params.id[0] : null;
  const { connected, address, signAndSubmitTransaction } = useMovementWallet();
  const [password, setPassword] = useState("");
  const [showSuccessEffect, setShowSuccessEffect] = useState(false);
  const [isClaiming, setIsClaiming] = useState(false);

  // 驗證 ID 是否有效
  const redPacketId = useMemo(() => {
    if (!id) return null;
    const parsed = parseInt(id);
    if (isNaN(parsed) || parsed < 0) return null;
    return parsed;
  }, [id]);

  // 使用 React Query 緩存查詢結果，避免重複請求
  const { data: redPacketInfo, isLoading, error, refetch } = useQuery({
    queryKey: ['redPacket', redPacketId],
    queryFn: () => {
      if (!redPacketId) throw new Error('Invalid red packet ID');
      return getRedPacketInfo(redPacketId);
    },
    enabled: !!redPacketId, // 只有當 ID 有效時才查詢
    staleTime: 30000, // 30 秒內視為新鮮數據，不會重新請求
    gcTime: 300000, // 5 分鐘後清除緩存
    retry: 2, // 失敗時重試 2 次
  });

  const handleClaimRedPacket = async () => {
    if (!address || !redPacketId || !password || !redPacketInfo) return;

    setIsClaiming(true);
    try {
      const transaction = claimRedPacket({
        creator: redPacketInfo.creator,
        redPacketId: redPacketId.toString(),
        password,
      });
      const pendingTransaction = await signAndSubmitTransaction(transaction);
      await aptosClient().waitForTransaction({ transactionHash: pendingTransaction.hash });
      
      // 清除緩存，強制重新獲取最新數據
      refetch();
      
      setShowSuccessEffect(true);
      
      setTimeout(() => {
        router.push('/');
      }, 3000);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "錯誤",
        description: "領取紅包失敗: " + (error instanceof Error ? error.message : String(error)),
      });
    } finally {
      setIsClaiming(false);
    }
  };

  const luckyPhrases = [
    "福如東海，壽比南山",
    "財源廣進，萬事如意",
    "吉祥如意，福壽安康",
    "鴻運當頭，事事順心",
    "五福臨門，百事亨通",
    "金玉滿堂，富貴榮華",
    "龍馬精神，步步高升",
    "福祿雙全，喜氣洋洋",
  ];

  // 使用 useMemo 避免每次渲染都重新計算
  const randomPhrase = useMemo(() => {
    return luckyPhrases[Math.floor(Math.random() * luckyPhrases.length)];
  }, []);

  // 處理無效 ID
  if (id && !redPacketId) {
    return (
      <div className="min-h-screen bg-red-800 flex flex-col bg-repeat">
        <Header />
        <div className="flex-grow flex items-center justify-center p-4 relative">
          <div className="absolute inset-0 bg-[url('/images/wooden-table.jpg')] bg-cover bg-center filter blur-sm"></div>
          <div className="text-center text-yellow-100 bg-red-800 bg-opacity-70 p-8 rounded-3xl">
            <h2 className="text-3xl font-bold mb-4" style={{ fontFamily: "'Noto Serif TC', serif" }}>
              無效的紅包 ID
            </h2>
            <p className="text-lg" style={{ fontFamily: "'Noto Serif TC', serif" }}>
              請檢查連結是否正確
            </p>
          </div>
        </div>
      </div>
    );
  }

  // 處理載入中狀態
  if (isLoading) {
    return (
      <div className="min-h-screen bg-red-800 flex flex-col bg-repeat">
        <Header />
        <div className="flex-grow flex items-center justify-center p-4 relative">
          <div className="absolute inset-0 bg-[url('/images/wooden-table.jpg')] bg-cover bg-center filter blur-sm"></div>
          <div className="text-center text-yellow-100 bg-red-800 bg-opacity-70 p-8 rounded-3xl">
            <h2 className="text-3xl font-bold mb-4" style={{ fontFamily: "'Noto Serif TC', serif" }}>
              載入中...
            </h2>
            <p className="text-lg" style={{ fontFamily: "'Noto Serif TC', serif" }}>
              正在獲取紅包資訊
            </p>
          </div>
        </div>
      </div>
    );
  }

  // 處理錯誤狀態（紅包不存在等）
  if (error || !redPacketInfo) {
    return (
      <div className="min-h-screen bg-red-800 flex flex-col bg-repeat">
        <Header />
        <div className="flex-grow flex items-center justify-center p-4 relative">
          <div className="absolute inset-0 bg-[url('/images/wooden-table.jpg')] bg-cover bg-center filter blur-sm"></div>
          <div className="text-center text-yellow-100 bg-red-800 bg-opacity-70 p-8 rounded-3xl">
            <h2 className="text-3xl font-bold mb-4" style={{ fontFamily: "'Noto Serif TC', serif" }}>
              紅包不存在
            </h2>
            <p className="text-lg mb-4" style={{ fontFamily: "'Noto Serif TC', serif" }}>
              此紅包可能已被領完或不存在
            </p>
            <Button
              onClick={() => router.push('/')}
              className="bg-yellow-400 hover:bg-yellow-300 text-red-700 font-bold"
              style={{ fontFamily: "'Noto Serif TC', serif" }}
            >
              返回首頁
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // 檢查紅包是否還有剩餘
  const isFullyClaimed = redPacketInfo.remainingCount === 0 || redPacketInfo.remainingAmount === 0;

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
          className="relative z-10 w-full max-w-lg mx-auto"
        >   
          {!connected ? (
            <div className="text-center text-yellow-100 bg-red-800 bg-opacity-70 p-8 rounded-3xl">
              <h2 className="text-3xl font-bold" style={{ fontFamily: "'Noto Serif TC', serif", textShadow: '2px 2px 4px rgba(0,0,0,0.5)' }}>
                請連接錢包以領取紅包
              </h2>
            </div>
          ) : isFullyClaimed ? (
            <div className="text-center text-yellow-100 bg-red-800 bg-opacity-70 p-8 rounded-3xl">
              <h2 className="text-3xl font-bold mb-4" style={{ fontFamily: "'Noto Serif TC', serif" }}>
                紅包已被領完
              </h2>
              <p className="text-lg mb-4" style={{ fontFamily: "'Noto Serif TC', serif" }}>
                此紅包的所有金額已被領取
              </p>
              <Button
                onClick={() => router.push('/')}
                className="bg-yellow-400 hover:bg-yellow-300 text-red-700 font-bold"
                style={{ fontFamily: "'Noto Serif TC', serif" }}
              >
                返回首頁
              </Button>
            </div>
          ) : (
            <motion.div 
              className="bg-gradient-to-br from-red-600 to-red-700 p-8 rounded-3xl shadow-lg w-full mx-auto relative overflow-hidden"
              style={{ boxShadow: '0 0 50px rgba(255, 215, 0, 0.3)' }}
            >
              <div className="absolute inset-0 bg-[url('/images/paper-texture.png')] opacity-30 mix-blend-overlay rounded-3xl"></div>
              <div className="relative z-10 text-center">
                <h2 className="text-4xl font-bold text-yellow-100 mb-6" style={{ fontFamily: "'Noto Serif TC', serif", textShadow: '2px 2px 4px rgba(0,0,0,0.5)' }}>
                  領取紅包
                </h2>
                <div className="mb-8 p-4 border-2 border-yellow-300 rounded-lg bg-red-800 bg-opacity-50">
                  <p className="text-2xl text-yellow-100 leading-relaxed" style={{ fontFamily: "'Noto Serif TC', serif", textShadow: '1px 1px 2px rgba(0,0,0,0.5)' }}>
                    {randomPhrase}
                  </p>
                </div>
                <input
                  type="password"
                  placeholder="輸入密碼領取"
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-transparent border-b-2 border-yellow-300 text-yellow-100 placeholder-yellow-200/70
                             focus:outline-none focus:border-yellow-400 transition-colors duration-300
                             text-xl py-2 mb-8"
                  style={{ fontFamily: "'Noto Serif TC', serif" }}
                />
                <Button 
                  onClick={handleClaimRedPacket} 
                  disabled={!password || isClaiming}
                  className={`
                    w-full font-bold rounded-full shadow-md transform hover:scale-105 transition-all duration-300
                    focus:ring-2 focus:ring-yellow-400/50 focus:outline-none
                    text-lg md:text-xl py-3 relative overflow-hidden
                    ${!password || isClaiming ? 'opacity-70 cursor-not-allowed' : 'hover:from-yellow-300 hover:to-yellow-200 shadow-red-900/30'}
                    bg-gradient-to-r from-yellow-400 to-yellow-300 text-red-700
                  `}
                  style={{ 
                    fontFamily: "'Noto Serif TC', serif",
                  }}
                >
                  <div className="absolute inset-0 bg-[url('/images/wood-texture.png')] opacity-30 mix-blend-overlay"></div>
                  <span className="relative z-10">{isClaiming ? '領取中...' : '領取紅包'}</span>
                </Button>
              </div>
            </motion.div>
          )}
        </motion.div>
      </div>
      <AnimatePresence>
        {showSuccessEffect && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50"
          >
            <div className="text-center">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="text-6xl mb-4"
              >
                🧧
              </motion.div>
              <h2 className="text-4xl font-bold text-yellow-100 mb-4" style={{ fontFamily: "'Noto Serif TC', serif" }}>
                恭喜發財！
              </h2>
              <p className="text-xl text-yellow-100" style={{ fontFamily: "'Noto Serif TC', serif" }}>
                紅包領取成功
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}