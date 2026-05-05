import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { BrowserProvider } from 'ethers';
type Status = 'idle' | 'connecting' | 'connected' | 'error';

type Web3State = {
  account: string | null;
  chainId: bigint | null;
  status: Status;
  error: string | null;
  connect: () => Promise<void>;
  disconnect: () => void;
};

const Web3Context = createContext<Web3State | null>(null);

export function Web3Provider({ children }: { children: ReactNode }) {
  const [account, setAccount] = useState<string | null>(null);
  const [chainId, setChainId] = useState<bigint | null>(null);
  const [status, setStatus] = useState<Status>('idle');
  const [error, setError] = useState<string | null>(null);

  const refreshChain = useCallback(async () => {
    if (!window.ethereum?.request) return;
    try {
      const hex = (await window.ethereum.request({
        method: 'eth_chainId',
      })) as string;
      setChainId(BigInt(hex));
    } catch {
      setChainId(null);
    }
  }, []);

  const connect = useCallback(async () => {
    setError(null);
    if (!window.ethereum) {
      setStatus('error');
      setError("Extension MetaMask non détectée.");
      return;
    }
    setStatus('connecting');
    try {
      const provider = new BrowserProvider(window.ethereum);
      await provider.send('eth_requestAccounts', []);
      const signer = await provider.getSigner();
      const addr = await signer.getAddress();
      const net = await provider.getNetwork();
      setAccount(addr);
      setChainId(net.chainId);
      setStatus('connected');
    } catch (e: unknown) {
      setStatus('error');
      setError(e instanceof Error ? e.message : 'Connexion impossible');
    }
  }, []);

  const disconnect = useCallback(() => {
    setAccount(null);
    setChainId(null);
    setStatus('idle');
    setError(null);
  }, []);

  useEffect(() => {
    if (!window.ethereum?.on) return undefined;
    const onAccounts = (accs: unknown) => {
      const list = accs as string[];
      if (!list?.length) disconnect();
      else setAccount(list[0]);
    };
    const onChain = async () => {
      await refreshChain();
    };
    window.ethereum.on('accountsChanged', onAccounts);
    window.ethereum.on('chainChanged', onChain);
    return () => {
      window.ethereum?.removeListener?.('accountsChanged', onAccounts);
      window.ethereum?.removeListener?.('chainChanged', onChain);
    };
  }, [disconnect, refreshChain]);

  const value = useMemo(
    (): Web3State => ({
      account,
      chainId,
      status,
      error,
      connect,
      disconnect,
    }),
    [account, chainId, connect, disconnect, error, status]
  );

  return <Web3Context.Provider value={value}>{children}</Web3Context.Provider>;
}

export function useWeb3() {
  const ctx = useContext(Web3Context);
  if (!ctx) throw new Error('useWeb3 must be inside Web3Provider');
  return ctx;
}
