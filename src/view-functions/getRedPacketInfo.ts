import { aptosClient } from "@/utils/aptosClient";

export const getRedPacketInfo = async (redPacketId: number) => {
  const result = await aptosClient().view<[string, number, number, number, number]>({
    payload: {
      function: `${process.env.NEXT_PUBLIC_MODULE_ADDRESS}::red_packet::get_red_packet_info`,
      typeArguments: [],
      functionArguments: [redPacketId],
    },
  });

  return {
    creator: result[0],
    totalAmount: result[1],
    remainingAmount: result[2],
    recipientCount: result[3],
    remainingCount: result[4],
  };
};

export const getLatestRedPacketId = async (): Promise<number> => {
  const result = await aptosClient().view<[number]>({
    payload: {
      function: `${process.env.NEXT_PUBLIC_MODULE_ADDRESS}::red_packet::get_latest_red_packet_id`,
      typeArguments: [],
      functionArguments: [],
    },
  });

  return result[0];
};