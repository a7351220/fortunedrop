import { InputTransactionData } from "@aptos-labs/wallet-adapter-react";

export type ClaimRedPacketArguments = {
  creator: string;
  redPacketId: string;
  password: string;
};

export const claimRedPacket = (args: ClaimRedPacketArguments): InputTransactionData => {
    const { creator, redPacketId, password } = args;
    return {
      data: {
        function: `${process.env.NEXT_PUBLIC_MODULE_ADDRESS}::red_packet::claim_red_packet`,
        functionArguments: [creator, redPacketId, Array.from(new TextEncoder().encode(password))],
      },
    };
  };