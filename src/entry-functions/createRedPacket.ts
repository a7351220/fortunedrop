import { InputTransactionData } from "@aptos-labs/wallet-adapter-react";
import { sha3_256 } from "js-sha3";

export type CreateRedPacketArguments = {
  totalAmount: number;
  recipientCount: number;
  password: string;
};

export const createRedPacket = (args: CreateRedPacketArguments): InputTransactionData => {
    const { totalAmount, recipientCount, password } = args;
    const passwordHash = new Uint8Array(sha3_256.arrayBuffer(password));
    return {
      data: {
        function: `${process.env.NEXT_PUBLIC_MODULE_ADDRESS}::red_packet::create_red_packet`,
        functionArguments: [totalAmount, recipientCount, Array.from(passwordHash)],
      },
    };
  };