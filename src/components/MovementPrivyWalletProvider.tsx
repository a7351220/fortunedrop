"use client";

import { createContext, useContext, ReactNode, useEffect, useState, useMemo, useCallback } from "react";
import { usePrivy, useWallets } from "@privy-io/react-auth";
import { useSignRawHash } from "@privy-io/react-auth/extended-chains";
import { Aptos, AptosConfig, Ed25519PublicKey, Ed25519Signature, AccountAuthenticatorEd25519, generateSigningMessageForTransaction } from "@aptos-labs/ts-sdk";
import { toHex } from "viem";

// Create Aptos client singleton outside component to avoid recreation
const fullnodeUrl = process.env.NEXT_PUBLIC_FULLNODE_URL || "https://testnet.bardock.movementnetwork.xyz/v1";
const aptos = new Aptos(new AptosConfig({ fullnode: fullnodeUrl }));

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

  // Helper to check if account is a wallet
  const isWalletAccount = (acc: any): acc is { type: 'wallet', address: string, chainType?: string, chain_type?: string, walletClientType?: string } => {
    return acc.type === 'wallet' && typeof acc.address === 'string';
  };

  // Memoize unique wallets to avoid recalculation on every render
  const uniqueWallets = useMemo(() => {
    // Get all wallets from both useWallets() and user.linkedAccounts
    // Note: ConnectedWallet from useWallets() doesn't have chainType, only 'type'
    // So we can't filter by chain type here, we get all wallets from hook
    const walletsFromHook = wallets.map(w => ({
      ...w,
      // Add a flag to identify source
      _source: 'hook' as const
    }));

    // From user.linkedAccounts (embedded wallets) - with proper type guard
    // WalletWithMetadata has chainType field
    const embeddedWallets = (user?.linkedAccounts || [])
      .filter(isWalletAccount)
      .filter(acc => {
        const wallet = acc as any;
        const chainType = wallet.chainType;
        const walletClientType = wallet.walletClientType;
        // Filter for Aptos/Movement wallets or Privy embedded wallets
        return (chainType === "aptos" || chainType === "movement") || walletClientType === "privy";
      })
      .map(w => ({
        ...w,
        _source: 'linkedAccount' as const
      }));

    const allWallets = [...walletsFromHook, ...embeddedWallets];

    // Remove duplicates by address
    return allWallets.reduce((acc, wallet) => {
      const address = 'address' in wallet ? wallet.address : null;
      if (address && !acc.find((w: any) => {
        const wAddr = 'address' in w ? w.address : null;
        return wAddr === address;
      })) {
        acc.push(wallet);
      }
      return acc;
    }, [] as any[]);
  }, [wallets, user?.linkedAccounts]);

  // Helper to get wallet address safely
  const getWalletAddress = (wallet: any): string | null => {
    return 'address' in wallet ? wallet.address : null;
  };

  // Memoize current wallet selection
  const currentWallet = useMemo(() => {
    if (uniqueWallets.length === 0) return null;
    
    if (selectedWalletAddress) {
      const found = uniqueWallets.find(w => getWalletAddress(w) === selectedWalletAddress);
      return found || uniqueWallets[uniqueWallets.length - 1];
    }
    
    return uniqueWallets[uniqueWallets.length - 1];
  }, [uniqueWallets, selectedWalletAddress]);

  // Memoize selectWallet callback
  const selectWallet = useCallback((address: string) => {
    setSelectedWalletAddress(address);
    if (typeof window !== 'undefined') {
      localStorage.setItem('privy_selected_wallet', address);
    }
  }, []);

  // Load selected wallet from localStorage on mount
  useEffect(() => {
    if (typeof window === 'undefined' || selectedWalletAddress || uniqueWallets.length === 0) return;
    
    const stored = localStorage.getItem('privy_selected_wallet');
    if (stored && uniqueWallets.some(w => getWalletAddress(w) === stored)) {
      setSelectedWalletAddress(stored);
    }
  }, [uniqueWallets, selectedWalletAddress]);

  const signAndSubmitTransaction = useCallback(async (payload: any) => {
    if (!currentWallet || !authenticated) {
      throw new Error("錢包未連接");
    }

    const walletAddress = getWalletAddress(currentWallet);
    if (!walletAddress) {
      throw new Error("無法取得錢包地址");
    }

    const publicKey = (currentWallet as any).public_key || (currentWallet as any).publicKey;

    if (!publicKey) {
      throw new Error("無法取得錢包公鑰");
    }

    try {
      // 1. Build the raw transaction
      const rawTxn = await aptos.transaction.build.simple({
        sender: walletAddress,
        data: payload.data,
        options: payload.options,
      });

      // 2. Generate signing message hash
      const message = generateSigningMessageForTransaction(rawTxn);
      const messageHex = toHex(message);
      
      // 3. Sign the hash using Privy's signRawHash
      const signatureResponse = await signRawHash({
        address: walletAddress,
        chainType: "aptos",
        hash: messageHex,
      });

      const signature = signatureResponse.signature;

      // 4. Parse public key - Privy may include a prefix byte
      let cleanPublicKey = publicKey.replace('0x', '');
      
      // If public key is 66 chars (33 bytes), remove the first byte (prefix)
      if (cleanPublicKey.length === 66) {
        cleanPublicKey = cleanPublicKey.slice(2);
      }
      
      // Ed25519 public key should be 64 hex chars (32 bytes)
      if (cleanPublicKey.length !== 64) {
        throw new Error(`Invalid public key length: ${cleanPublicKey.length} (expected 64)`);
      }

      // 5. Create authenticator and submit
      const senderAuthenticator = new AccountAuthenticatorEd25519(
        new Ed25519PublicKey(cleanPublicKey),
        new Ed25519Signature(signature.replace('0x', ''))
      );

      const committedTxn = await aptos.transaction.submit.simple({
        transaction: rawTxn,
        senderAuthenticator,
      });

      // 6. Wait for transaction
      const executedTransaction = await aptos.waitForTransaction({
        transactionHash: committedTxn.hash,
      });

      return { hash: executedTransaction.hash };
    } catch (error) {
      if (process.env.NODE_ENV !== 'production') {
        console.error("[Provider] Transaction failed:", error);
      }
      throw error;
    }
  }, [currentWallet, authenticated, signRawHash]);

  const disconnect = useCallback(async () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('privy_movement_wallet');
      localStorage.removeItem('privy_selected_wallet');
    }
    try {
      await logout();
    } catch (error) {
      if (process.env.NODE_ENV !== 'production') {
        console.error("Logout error:", error);
      }
    } finally {
      if (typeof window !== 'undefined') {
        window.location.href = '/';
      }
    }
  }, [logout]);

  // Memoize context value to avoid unnecessary re-renders
  const value = useMemo<MovementWallet>(() => {
    const walletAddress = currentWallet ? getWalletAddress(currentWallet) : null;
    const walletPublicKey = currentWallet ? ((currentWallet as any).public_key || (currentWallet as any).publicKey) : null;

    return {
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
  }, [currentWallet, authenticated, ready, uniqueWallets, selectWallet, signAndSubmitTransaction, disconnect]);

  return (
    <MovementWalletContext.Provider value={value}>
      {children}
    </MovementWalletContext.Provider>
  );
}


