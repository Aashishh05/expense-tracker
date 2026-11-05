import { useCallback, useEffect, useRef, useState } from 'react';
import { listTransactions } from '@/api/transactions';
import type { TransactionFilters } from '@/api/transactions';
import type { Pagination, Transaction } from '@/types';
import { apiMessage } from '@/utils/format';

export function useTransactions(filters: TransactionFilters) {
  const [data, setData] = useState<Transaction[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  const filtersRef = useRef(filters);
  filtersRef.current = filters;
  const key = JSON.stringify(filters);

  useEffect(() => {
    let active = true;
    setLoading(true);
    listTransactions(filtersRef.current)
      .then((res) => {
        if (!active) return;
        setData(res.data);
        setPagination(res.pagination);
        setError(null);
      })
      .catch((err) => {
        if (!active) return;
        setError(apiMessage(err, 'Could not load transactions'));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [key, tick]);

  const refetch = useCallback(() => setTick((t) => t + 1), []);

  return { data, pagination, loading, error, refetch };
}
