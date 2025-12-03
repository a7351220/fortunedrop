import { NETWORK } from "@/constants";
import { Aptos, AptosConfig } from "@aptos-labs/ts-sdk";

const fullnodeUrl = process.env.NEXT_PUBLIC_FULLNODE_URL;

const aptosConfig = fullnodeUrl
  ? new AptosConfig({ fullnode: fullnodeUrl })
  : new AptosConfig({ network: NETWORK });

const aptos = new Aptos(aptosConfig);

// Reuse same Aptos instance to utilize cookie based sticky routing
export function aptosClient() {
  return aptos;
}
