import { useState } from "react";
import { useMovementWallet } from "@/components/MovementPrivyWalletProvider";
import { toast } from "@/components/ui/use-toast";
import { aptosClient } from "@/utils/aptosClient";
import { Button } from "@/components/ui/button";
import { createRedPacket } from "@/entry-functions/createRedPacket";
import { getLatestRedPacketId } from "@/view-functions/getRedPacketInfo";
import { motion, AnimatePresence } from "framer-motion";
import { QRCodeSVG } from "qrcode.react";

const APT_TO_OCTA = 100000000; // 1 APT = 10^8 Octa

interface RedPacketProps {
  onClose?: () => void;
  onCreateSuccess?: () => void;
}

export function RedPacket({ onClose, onCreateSuccess }: RedPacketProps) {
  const { address, signAndSubmitTransaction } = useMovementWallet();

  const [totalAmount, setTotalAmount] = useState<number>();
  const [recipientCount, setRecipientCount] = useState<number>();
  const [password, setPassword] = useState<string>("");
  const [redPacketLink, setRedPacketLink] = useState<string>("");

  const [showSuccessNotification, setShowSuccessNotification] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const handleCreateRedPacket = async () => {
    if (!address || !totalAmount || !recipientCount || !password) return;

    try {
      const totalAmountOcta = Math.floor(totalAmount * APT_TO_OCTA);
      const transaction = createRedPacket({
        totalAmount: totalAmountOcta,
        recipientCount,
        password,
      });
      const pendingTransaction = await signAndSubmitTransaction(transaction);
      await aptosClient().waitForTransaction({ transactionHash: pendingTransaction.hash });
      
      const latestRedPacketId = await getLatestRedPacketId();
      const link = `${window.location.origin}/redpacket/${latestRedPacketId}`;
      setRedPacketLink(link);

      localStorage.setItem('lastCreatorAddress', address);

      setShowSuccessNotification(true);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "錯誤",
        description: "創建紅包失敗: " + (error instanceof Error ? error.message : String(error)),
      });
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(redPacketLink).then(() => {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    });
  };

  return (
    <>
      <div className="flex justify-between items-start">
        <div className="text-yellow-100 flex-1 mr-4">
          <div className="mb-6 bg-cover p-4 rounded-lg shadow-inner">
            <input
              type="number"
              step="0.01"
              min="0"
              placeholder="MOVE"
              onChange={(e) => {
                const value = e.target.value;
                setTotalAmount(value === '' ? undefined : Math.max(0, Number(value)));
              }}
              onKeyDown={(e) => {
                if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
                  e.preventDefault();
                  const currentValue = totalAmount || 0;
                  const step = e.key === 'ArrowUp' ? 0.01 : -0.01;
                  setTotalAmount(Math.max(0, Number((currentValue + step).toFixed(2))));
                }
              }}
              value={totalAmount === undefined ? '' : totalAmount}
              className="w-full bg-transparent border-b-2 border-yellow-300 text-yellow-100 placeholder-yellow-200/70
                         focus:outline-none focus:border-yellow-400 transition-colors duration-300
                         text-sm md:text-base py-2"
                         style={{ fontFamily: "'Noto Serif TC', serif" }}
            />
          </div>
          <div className="mb-6 bg-cover p-4 rounded-lg shadow-inner">
            <input
              type="number"
              min="1"
              placeholder="幾個人"
              onChange={(e) => {
                const value = e.target.value;
                setRecipientCount(value === '' ? undefined : Math.max(1, Number(value)));
              }}
              onKeyDown={(e) => {
                if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
                  e.preventDefault();
                  const currentValue = recipientCount || 1;
                  const step = e.key === 'ArrowUp' ? 1 : -1;
                  setRecipientCount(Math.max(1, currentValue + step));
                }
              }}
              value={recipientCount === undefined ? '' : recipientCount}
              className="w-full bg-transparent border-b-2 border-yellow-300 text-yellow-100 placeholder-yellow-200/70
                         focus:outline-none focus:border-yellow-400 transition-colors duration-300
                         text-sm md:text-base py-2"
                         style={{ fontFamily: "'Noto Serif TC', serif" }}
            />
          </div>
          <div className="mb-6 bg-cover p-4 rounded-lg shadow-inner">
            <input
              type="password"
              placeholder="密碼"
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-transparent border-b-2 border-yellow-300 text-yellow-100 placeholder-yellow-200/70
                         focus:outline-none focus:border-yellow-400 transition-colors duration-300
                         text-sm md:text-base py-2"
                         style={{ fontFamily: "'Noto Serif TC', serif" }}
            />
          </div>
          <Button 
            onClick={handleCreateRedPacket} 
            disabled={!address || !totalAmount || !recipientCount || !password}
            className={`
              w-full font-bold rounded-full shadow-md transform hover:scale-105 transition-all duration-300
              focus:ring-2 focus:ring-yellow-400/50 focus:outline-none
              text-lg md:text-xl py-3 relative overflow-hidden
              ${!address || !totalAmount || !recipientCount || !password 
                ? 'opacity-70 cursor-not-allowed' 
                : 'hover:from-yellow-300 hover:to-yellow-200 shadow-red-900/30'}
              bg-gradient-to-r from-yellow-400 to-yellow-300 text-red-700
            `}
            style={{ 
              fontFamily: "'Noto Serif TC', serif",
              fontSize: '1rem',
              fontWeight: 700
            }}
          >
            <div className="absolute inset-0 bg-[url('/images/wood-texture.png')] opacity-30 mix-blend-overlay"></div>
            <span className="relative z-10">創建紅包</span>
          </Button>
        </div>
      </div>
      <AnimatePresence>
        {showSuccessNotification && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50"
            onClick={() => setShowSuccessNotification(false)}
          >
            <motion.div 
              initial={{ y: "100%", opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: "100%", opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="bg-gradient-to-br from-red-600 to-red-700 p-6 rounded-3xl shadow-lg w-full max-w-md mx-4 relative max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="absolute inset-0 bg-[url('/images/paper-texture.png')] opacity-30 mix-blend-overlay rounded-3xl"></div>
              <div className="relative z-10 text-center">
                <h2 className="text-2xl font-bold text-yellow-100 mb-3" style={{ 
              fontFamily: "'Noto Serif TC', serif",
              fontWeight: 700
            }}>
                  🧧 紅包創建成功！
                </h2>
                <p className="text-lg text-yellow-100 mb-3" style={{ 
              fontFamily: "'Noto Serif TC', serif",
              fontWeight: 600
            }}>
                  掃描或分享鏈接：
                </p>
                {/* QR Code */}
                <div className="flex justify-center mb-4">
                  <div className="bg-gradient-to-br from-yellow-400 to-yellow-500 p-3 rounded-xl shadow-lg border-4 border-red-700">
                    <QRCodeSVG 
                      value={redPacketLink}
                      size={160}
                      level="H"
                      includeMargin={false}
                      bgColor="#FEF3C7"
                      fgColor="#991B1B"
                    />
                  </div>
                </div>
                
                {/* Link and Copy Button */}
                <div className="flex flex-col items-center gap-2 mb-3">
                  <input 
                    type="text" 
                    value={redPacketLink} 
                    readOnly 
                    className="w-full p-2 bg-red-700/50 text-yellow-100 rounded-lg border-2 border-yellow-400
                               text-center text-xs break-all"
                    style={{ fontFamily: "'Noto Serif TC', serif" }}
                  />
                  <button
                    onClick={handleCopyLink}
                    className="w-full bg-yellow-400 text-red-700 py-2 px-4 rounded-lg hover:bg-yellow-300 
                               transition-colors duration-300 font-bold shadow-md"
                    style={{ 
                        fontFamily: "'Noto Serif TC', serif",
                        fontSize: '1rem',
                        fontWeight: 700
                      }}
                  >
                    {copiedLink ? "✓ 已複製" : "📋 複製連結"}
                  </button>
                </div>
                <button 
                  onClick={() => {
                    setShowSuccessNotification(false);
                    if (onCreateSuccess) onCreateSuccess();
                    if (onClose) onClose();
                  }}
                  className="w-full mt-2 bg-gradient-to-r from-yellow-400 to-yellow-300 text-red-700 
                             hover:from-yellow-300 hover:to-yellow-200 font-bold rounded-lg
                             shadow-md shadow-red-900/30 transform hover:scale-105 transition-all duration-300
                             focus:ring-2 focus:ring-yellow-400/50 focus:outline-none py-2 px-6"
                             style={{ 
                                fontFamily: "'Noto Serif TC', serif",
                                fontSize: '1rem',
                                fontWeight: 700
                              }}
                >
                  關閉
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
