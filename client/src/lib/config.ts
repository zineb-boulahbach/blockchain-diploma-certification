const env = import.meta.env;

export const CONTRACT_ADDRESS = (env.VITE_CONTRACT_ADDRESS ?? '') as string;
export const RPC_URL = (env.VITE_RPC_URL ?? '') as string;
/** If set, UI warns when wallet chain differs (e.g. 11155111 Sepolia, 1337 Ganache) */
export const EXPECTED_CHAIN_ID = env.VITE_EXPECTED_CHAIN_ID
  ? Number(env.VITE_EXPECTED_CHAIN_ID)
  : undefined;
export const LOGS_FROM_BLOCK = env.VITE_LOGS_FROM_BLOCK
  ? Number(env.VITE_LOGS_FROM_BLOCK)
  : 0;

export function isConfigured(): boolean {
  return Boolean(CONTRACT_ADDRESS && CONTRACT_ADDRESS.startsWith('0x'));
}
