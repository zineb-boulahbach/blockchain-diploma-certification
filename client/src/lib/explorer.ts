/** Public block explorer base URL for EVM transactions. */
export function txExplorerUrl(chainId: bigint | number | undefined, txHash: string): string {
  const id = Number(chainId ?? 0);
  if (id === 11155111) return `https://sepolia.etherscan.io/tx/${txHash}`;
  if (id === 1) return `https://etherscan.io/tx/${txHash}`;
  return `https://etherscan.io/tx/${txHash}`;
}

export function contractExplorerUrl(
  chainId: bigint | number | undefined,
  contractAddress: string
): string {
  const id = Number(chainId ?? 0);
  const addr = contractAddress;
  if (id === 11155111) return `https://sepolia.etherscan.io/address/${addr}`;
  if (id === 1) return `https://etherscan.io/address/${addr}`;
  return `https://etherscan.io/address/${addr}`;
}
