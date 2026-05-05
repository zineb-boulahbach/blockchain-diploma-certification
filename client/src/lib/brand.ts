/** Nom légal affiché comme sur les maquettes EMSI. */
export const INSTITUTION_LEGAL_NAME =
  'École Marocaine des Sciences de l’Ingénieur (EMSI)';

export function chainDisplayName(chainId: bigint | number | null | undefined): string {
  const id = chainId == null ? 0 : Number(chainId);
  if (id === 11155111) return 'Ethereum (Sepolia)';
  if (id === 1) return 'Ethereum (Mainnet)';
  if (id === 1337 || id === 5777) return 'Réseau local (Ganache)';
  return `Chain ID ${id}`;
}
