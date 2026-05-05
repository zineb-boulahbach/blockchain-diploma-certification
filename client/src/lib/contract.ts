import {
  BrowserProvider,
  Contract,
  JsonRpcProvider,
  type EventLog,
  type Signer,
} from 'ethers';
import { DIPLOMA_REGISTRY_ABI } from './abi';
import { CONTRACT_ADDRESS, LOGS_FROM_BLOCK, RPC_URL } from './config';

export type OnChainDiploma = {
  diplomaHash: string;
  studentId: string;
  studentWallet: string;
  issuanceDate: bigint;
  isRevoked: boolean;
  ipfsCID: string;
  studentName: string;
  filiere: string;
  yearObtained: string;
  /** Transaction d’émission (événement DiplomaAdded), si connue. */
  issueTxHash?: string;
};

export function getReadContract(): Contract {
  if (!CONTRACT_ADDRESS) throw new Error('VITE_CONTRACT_ADDRESS manquant');
  let provider;
  if (typeof window !== 'undefined' && window.ethereum) {
    provider = new BrowserProvider(window.ethereum);
  } else if (RPC_URL) {
    provider = new JsonRpcProvider(RPC_URL);
  } else {
    throw new Error('Wallet ou VITE_RPC_URL requis pour lire la chaîne.');
  }
  return new Contract(CONTRACT_ADDRESS, DIPLOMA_REGISTRY_ABI, provider);
}

export async function getReadContractFlexible(): Promise<Contract> {
  if (!CONTRACT_ADDRESS) throw new Error('VITE_CONTRACT_ADDRESS manquant');
  if (typeof window !== 'undefined' && window.ethereum) {
    return new Contract(CONTRACT_ADDRESS, DIPLOMA_REGISTRY_ABI, new BrowserProvider(window.ethereum));
  }
  if (RPC_URL) {
    return new Contract(CONTRACT_ADDRESS, DIPLOMA_REGISTRY_ABI, new JsonRpcProvider(RPC_URL));
  }
  throw new Error('Connectez MetaMask ou configurez VITE_RPC_URL.');
}

export function getSignerContract(signer: Signer): Contract {
  if (!CONTRACT_ADDRESS) throw new Error('VITE_CONTRACT_ADDRESS manquant');
  return new Contract(CONTRACT_ADDRESS, DIPLOMA_REGISTRY_ABI, signer);
}

export async function fetchAllDiplomasFromEvents(contract: Contract): Promise<OnChainDiploma[]> {
  const filter = contract.filters.DiplomaAdded();
  const logs = await contract.queryFilter(filter, LOGS_FROM_BLOCK);
  const issueTxByDiploma = new Map<string, string>();
  const hashes = new Set<string>();
  for (const log of logs as EventLog[]) {
    const dh = log.args?.diplomaHash as string | undefined;
    if (!dh) continue;
    const key = String(dh);
    hashes.add(key);
    if (!issueTxByDiploma.has(key)) issueTxByDiploma.set(key, log.transactionHash);
  }
  const rows: OnChainDiploma[] = [];
  for (const h of hashes) {
    const d = await contract.getDiploma(h);
    rows.push({ ...parseOnChainDiploma(d), issueTxHash: issueTxByDiploma.get(h) });
  }
  return rows.sort((a, b) => Number(b.issuanceDate - a.issuanceDate));
}

export function parseOnChainDiploma(row: unknown): OnChainDiploma {
  const r = row as {
    diplomaHash?: string;
    studentId?: string;
    studentWallet?: string;
    issuanceDate?: bigint;
    isRevoked?: boolean;
    ipfsCID?: string;
    studentName?: string;
    filiere?: string;
    yearObtained?: string;
    0?: string;
    1?: string;
    2?: string;
    3?: bigint;
    4?: boolean;
    5?: string;
    6?: string;
    7?: string;
    8?: string;
  };
  const diplomaHash =
    r.diplomaHash ?? r[0] ?? '0x0000000000000000000000000000000000000000000000000000000000000000';
  const studentId = r.studentId ?? r[1] ?? '';
  const studentWallet =
    r.studentWallet ?? r[2] ?? '0x0000000000000000000000000000000000000000';
  const issuanceDate = r.issuanceDate ?? r[3] ?? 0n;
  const isRevoked = r.isRevoked ?? r[4] ?? false;
  const ipfsCID = r.ipfsCID ?? r[5] ?? '';
  const studentName = r.studentName ?? r[6] ?? '';
  const filiere = r.filiere ?? r[7] ?? '';
  const yearObtained = r.yearObtained ?? r[8] ?? '';
  return {
    diplomaHash,
    studentId,
    studentWallet,
    issuanceDate,
    isRevoked,
    ipfsCID,
    studentName,
    filiere,
    yearObtained,
  };
}
