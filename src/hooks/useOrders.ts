import { useCallback } from 'react';
import { fetchOrders } from '../api/orders';
import { ordersCache } from '../services/cache';
import { useOrdersStore } from '../store/ordersStore';

export function useOrders() {
  const orders = useOrdersStore((s) => s.orders);
  const isLoading = useOrdersStore((s) => s.isLoading);
  const error = useOrdersStore((s) => s.error);
  const setOrders = useOrdersStore((s) => s.setOrders);
  const setLoading = useOrdersStore((s) => s.setLoading);
  const setError = useOrdersStore((s) => s.setError);

  const loadOrders = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const cached = await ordersCache.load();
      if (cached) {
        setOrders(cached);
      }

      const fresh = await fetchOrders();
      setOrders(fresh);

      await ordersCache.save(fresh);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to load orders.';

      if (useOrdersStore.getState().orders.length === 0) {
        setError(message);
      }
    } finally {
      setLoading(false);
    }
  }, [setOrders, setLoading, setError]);

  return { orders, isLoading, error, loadOrders };
}
