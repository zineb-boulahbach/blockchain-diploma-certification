import { useCallback, useEffect, useMemo, useState } from 'react';
import { getReadContractFlexible } from '../lib/contract';
import { isConfigured } from '../lib/config';
import { useWeb3 } from '../context/Web3Context';

export function useAdminAccess() {
  const { account, status } = useWeb3();
  const [owner, setOwner] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!isConfigured()) {
      setOwner(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const c = await getReadContractFlexible();
      const o = (await c.owner()) as string;
      setOwner(o.toLowerCase());
    } catch {
      setOwner(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    if (status === 'connected' && account) void refresh();
  }, [status, account, refresh]);

  const isAdmin = useMemo(() => {
    if (!owner || !account) return false;
    return owner === account.toLowerCase();
  }, [owner, account]);

  return { owner, isAdmin, loading, refresh };
}
