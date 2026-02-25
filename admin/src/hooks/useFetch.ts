import { useState, useEffect, useRef, useCallback } from "react";

interface UseFetchResult<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useFetch<T>(fetchFn: () => Promise<T>): UseFetchResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [refetchToggle, setRefetchToggle] = useState(false);

  // Use ref to always have access to latest fetchFn without triggering re-fetches
  const fetchFnRef = useRef(fetchFn);
  fetchFnRef.current = fetchFn;

  useEffect(() => {
    let isMounted = true; // Prevent state updates if component unmounts

    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);
        const result = await fetchFnRef.current();
        if (isMounted) {
          setData(result);
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : "An error occurred");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadData();

    return () => {
      isMounted = false; // Cleanup function
    };
  }, [refetchToggle]);

  const refetch = useCallback(() => setRefetchToggle((prev) => !prev), []);

  return { data, loading, error, refetch };
}
