import { useCallback, useEffect, useState } from 'react';
import { listCategories } from '@/api/categories';
import type { Category } from '@/types';
import { apiMessage } from '@/utils/format';

let cache: Category[] | null = null;
let inflight: Promise<Category[]> | null = null;

function load(force = false): Promise<Category[]> {
  if (!force && cache) return Promise.resolve(cache);
  if (inflight) return inflight;
  inflight = listCategories()
    .then((res) => {
      cache = res.data;
      inflight = null;
      return cache;
    })
    .catch((err) => {
      inflight = null;
      throw err;
    });
  return inflight;
}

/** Categories are shared by filters and forms — fetch once, reuse everywhere. */
export function useCategories() {
  const [categories, setCategories] = useState<Category[]>(cache ?? []);
  const [loading, setLoading] = useState(cache === null);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(() => {
    setLoading(true);
    load(true)
      .then((list) => setCategories(list))
      .catch((err) => setError(apiMessage(err, 'Could not load categories')))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load()
      .then((list) => setCategories(list))
      .catch((err) => setError(apiMessage(err, 'Could not load categories')))
      .finally(() => setLoading(false));
  }, []);

  return { categories, loading, error, refresh };
}
