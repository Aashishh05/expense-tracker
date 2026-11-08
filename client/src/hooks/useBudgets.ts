import { useCallback, useEffect, useRef, useState } from 'react';
import { listBudgets } from '@/api/budgets';
import type { Budget, Pagination } from '@/types';
import { apiMessage } from '@/utils/format';

export interface BudgetsFilters {
  month?: string;
  page?: number;
  limit?: number;
}

export function useBudgets(filters: BudgetsFilters = {}) {
  const [data, setData] = useState<Budget[]>([]);
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
    listBudgets(filtersRef.current.month, filtersRef.current.page, filtersRef.current.limit)
      .then((res) => {
        if (!active) return;
        setData(res.data);
        setPagination(res.pagination);
        setError(null);
      })
      .catch((err) => {
        if (!active) return;
        setError(apiMessage(err, 'Could not load budgets'));
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