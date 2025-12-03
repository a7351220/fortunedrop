"use client";

import { createContext, useContext, ReactNode, useEffect, useState } from "react";
import { usePrivy, useWallets } from "@privy-io/react-auth";
import { useSignRawHash } from "@privy-io/react-auth/extended-chains";
import { Aptos, AptosConfig, Ed25519PublicKey, Ed25519Signature, AccountAuthenticatorEd25519, generateSigningMessageForTransaction } from "@aptos-labs/ts-sdk";
import { toHex } from "viem";

interface MovementWallet {
  address: string | null;
  publicKey: string | null;
  connected: boolean;
  isLoading: boolean;
  allWallets: any[];
  selectedWallet: any | null;
  selectWallet: (address: string) => void;
  signAndSubmitTransaction: (transaction: any) => Promise<{ hash: string }>;
  disconnect: () => void;
}

const MovementWalletContext = createContext<MovementWallet>({
  address: null,
  publicKey: null,
  connected: false,
  isLoading: true,
  allWallets: [],
  selectedWallet: null,
  selectWallet: () => {},
  signAndSubmitTransaction: async () => ({ hash: "" }),
  disconnect: () => {},
});

export function useMovementWallet() {
  return useContext(MovementWalletContext);
}

export function MovementPrivyWalletProvider({ children }: { children: ReactNode }) {
  const { ready, authenticated, user, logout } = usePrivy();
  const { wallets } = useWallets();
  const { signRawHash } = useSignRawHash();
  const [selectedWalletAddress, setSelectedWalletAddress] = useState<string | null>(null);

  // Setup Aptos client for Movement
  const fullnodeUrl = process.env.NEXT_PUBLIC_FULLNODE_URL || "https://testnet.bardock.movementnetwork.xyz/v1";
  const aptos = new Aptos(new AptosConfig({ fullnode: fullnodeUrl }));

  // Debug: log user's linked accounts
  console.log('[Provider] User info:', {
    ready,
    authenticated,
    userId: user?.id,
    linkedAccounts: user?.linkedAccounts?.length || 0,
    linkedAccountsDetails: user?.linkedAccounts?.map(acc => ({
      type: acc.type,
      address: (acc as any).address,
      chainType: (acc as any).chainType,
      chain_type: (acc as any).chain_type,
      walletClient: (acc as any).walletClient,
      walletClientType: (acc as any).walletClientType
    }))
  });

  // Get all wallets from both useWallets() and user.linkedAccounts
  let allAvailableWallets: any[] = [];
  
  // From useWallets() hook
  const walletsFromHook = wallets.filter((w) => {
    const chainType = w.chainType || (w as any).chain_type;
    const walletClientType = (w as any).walletClientType;
    return (chainType === "aptos" || chainType === "movement") || walletClientType === "privy";
  });

  // From user.linkedAccounts (embedded wallets)
  const embeddedWallets = (user?.linkedAccounts || [])
    .filter(acc => {
      const isWallet = acc.type === 'wallet';
      const chainType = (acc as any).chainType || (acc as any).chain_type;
      const walletClientType = (acc as any).walletClientType;
      return isWallet && ((chainType === "aptos" || chainType === "movement") || walletClientType === "privy");
    });

  allAvailableWallets = [...walletsFromHook, ...embeddedWallets];

  // Remove duplicates by address
  const uniqueWallets = allAvailableWallets.reduce((acc, wallet) => {
    const address = wallet.address || (wallet as any).address;
    if (!acc.find((w: any) => (w.address || (w as any).address) === address)) {
      acc.push(wallet);
    }
    return acc;
  }, [] as any[]);

  console.log('[Provider] Wallet summary:', {
    walletsFromHook: walletsFromHook.length,
    embeddedWallets: embeddedWallets.length,
    uniqueWallets: uniqueWallets.length,
    details: uniqueWallets.map(w => ({
      address: w.address || (w as any).address,
      chainType: w.chainType || (w as any).chainType,
      walletClientType: (w as any).walletClientType
    }))
  });

  // Auto-select wallet: prefer selected, then latest
  let currentWallet = null;
  if (uniqueWallets.length > 0) {
    if (selectedWalletAddress) {
      currentWallet = uniqueWallets.find(w => (w.address || (w as any).address) === selectedWalletAddress) || uniqueWallets[uniqueWallets.length - 1];
    } else {
      currentWallet = uniqueWallets[uniqueWallets.length - 1];
    }
  }

  const selectWallet = (address: string) => {
    setSelectedWalletAddress(address);
    if (typeof window !== 'undefined') {
      localStorage.setItem('privy_selected_wallet', address);
    }
  };

  // Load selected wallet from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined' && !selectedWalletAddress && uniqueWallets.length > 0) {
      const stored = localStorage.getItem('privy_selected_wallet');
      if (stored && uniqueWallets.find(w => (w.address || (w as any).address) === stored)) {
        setSelectedWalletAddress(stored);
      }
    }
  }, [uniqueWallets.length, selectedWalletAddress]);

  const signAndSubmitTransaction = async (payload: any) => {
    if (!currentWallet || !authenticated) {
      throw new Error("錢包未連接");
    }

    const walletAddress = currentWallet.address || (currentWallet as any).address;
    const publicKey = (currentWallet as any).public_key || (currentWallet as any).publicKey;

    if (!publicKey) {
      throw new Error("無法取得錢包公鑰");
    }

    try {
      console.log('[Provider] Building transaction for:', walletAddress);
      
      // 1. Build the raw transaction
      const rawTxn = await aptos.transaction.build.simple({
        sender: walletAddress,
        data: payload.data,
        options: payload.options,
      });

      // 2. Generate signing message hash
      const message = generateSigningMessageForTransaction(rawTxn);
      const messageHex = toHex(message);

      console.log('[Provider] Signing hash with Privy embedded wallet...');
      
      // 3. Sign the hash using Privy's signRawHash
      const signatureResponse = await signRawHash({
        address: walletAddress,
        chainType: "aptos",
        hash: messageHex,
      });

      const signature = signatureResponse.signature;

      console.log('[Provider] Signature received');
      console.log('[Provider] Public key (raw):', publicKey);
      console.log('[Provider] Public key length:', publicKey.replace('0x', '').length);

      // 4. Parse public key - Privy may include a prefix byte
      let cleanPublicKey = publicKey.replace('0x', '');
      
      // If public key is 66 chars (33 bytes), remove the first byte (prefix)
      if (cleanPublicKey.length === 66) {
        cleanPublicKey = cleanPublicKey.slice(2); // Remove first byte
        console.log('[Provider] Removed prefix byte from public key');
      }
      
      // Ed25519 public key should be 64 hex chars (32 bytes)
      if (cleanPublicKey.length !== 64) {
        throw new Error(`Invalid public key length: ${cleanPublicKey.length} (expected 64)`);
      }

      console.log('[Provider] Clean public key:', cleanPublicKey);

      // 5. Create authenticator and submit
      const senderAuthenticator = new AccountAuthenticatorEd25519(
        new Ed25519PublicKey(cleanPublicKey),
        new Ed25519Signature(signature.replace('0x', ''))
      );

      console.log('[Provider] Submitting transaction...');

      const committedTxn = await aptos.transaction.submit.simple({
        transaction: rawTxn,
        senderAuthenticator,
      });

      console.log('[Provider] Transaction submitted:', committedTxn.hash);

      // 6. Wait for transaction
      const executedTransaction = await aptos.waitForTransaction({
        transactionHash: committedTxn.hash,
      });

      console.log('[Provider] Transaction confirmed!');

      return { hash: executedTransaction.hash };
    } catch (error) {
      console.error("[Provider] Transaction failed:", error);
      throw error;
    }
  };

  const disconnect = async () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('privy_movement_wallet');
      localStorage.removeItem('privy_selected_wallet');
    }
    try {
      await logout();
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      if (typeof window !== 'undefined') {
        window.location.href = '/';
      }
    }
  };

  const walletAddress = currentWallet ? (currentWallet.address || (currentWallet as any).address) : null;
  const walletPublicKey = currentWallet ? ((currentWallet as any).public_key || (currentWallet as any).publicKey) : null;

  const value: MovementWallet = {
    address: walletAddress,
    publicKey: walletPublicKey,
    connected: !!currentWallet && authenticated,
    isLoading: !ready,
    allWallets: uniqueWallets,
    selectedWallet: currentWallet,
    selectWallet,
    signAndSubmitTransaction,
    disconnect,
  };

  return (
    <MovementWalletContext.Provider value={value}>
      {children}
    </MovementWalletContext.Provider>
  );
}


