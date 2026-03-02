import { renderHook, act } from '@testing-library/react-native';
import { useOrders } from '../../src/hooks/useOrders';
import { fetchOrders } from '../../src/api/orders';
import { ordersCache } from '../../src/services/cache';
import { useOrdersStore } from '../../src/store/ordersStore';
import { Order } from '../../src/types';

jest.mock('../../src/api/orders', () => ({ fetchOrders: jest.fn() }));
jest.mock('../../src/services/cache', () => ({
  ordersCache: { load: jest.fn(), save: jest.fn() },
}));

const mockedFetchOrders = fetchOrders as jest.MockedFunction<typeof fetchOrders>;
const mockedLoad = ordersCache.load as jest.MockedFunction<typeof ordersCache.load>;
const mockedSave = ordersCache.save as jest.MockedFunction<typeof ordersCache.save>;

const ORDERS: Order[] = [
  { id: '1', customer: 'Alice', status: 'pending', amount: 100 },
];

const CACHED: Order[] = [
  { id: '0', customer: 'Cached', status: 'pending', amount: 50 },
];


beforeEach(() => {
  jest.clearAllMocks();
  useOrdersStore.setState({ orders: [], isLoading: false, error: null });
  mockedSave.mockResolvedValue(undefined);
});

describe('useOrders', () => {
  it('fetches fresh orders and stores them', async () => {
    mockedLoad.mockResolvedValue(null);
    mockedFetchOrders.mockResolvedValue(ORDERS);

    const { result } = renderHook(() => useOrders());
    await act(() => result.current.loadOrders());

    expect(result.current.orders).toEqual(ORDERS);
    expect(result.current.error).toBeNull();
  });

  it('shows cached data while fetching, then replaces with fresh data', async () => {
    mockedLoad.mockResolvedValue(CACHED);

    let resolveFresh!: (orders: Order[]) => void;
    mockedFetchOrders.mockReturnValue(new Promise((r) => { resolveFresh = r; }));

    const { result } = renderHook(() => useOrders());

    let loadPromise!: Promise<void>;
    act(() => { loadPromise = result.current.loadOrders(); });

    await act(async () => {});
    expect(result.current.orders).toEqual(CACHED);

    await act(async () => {
      resolveFresh(ORDERS);
      await loadPromise;
    });
    expect(result.current.orders).toEqual(ORDERS);
  });

  it('sets an error when fetch fails and there is no cached data', async () => {
    mockedLoad.mockResolvedValue(null);
    mockedFetchOrders.mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() => useOrders());
    await act(() => result.current.loadOrders());

    expect(result.current.error).toBe('Network error');
    expect(result.current.orders).toHaveLength(0);
  });

  it('silences the error when cached data is already displayed', async () => {
    mockedLoad.mockResolvedValue(CACHED);
    mockedFetchOrders.mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() => useOrders());
    await act(() => result.current.loadOrders());

    expect(result.current.error).toBeNull();
    expect(result.current.orders).toEqual(CACHED);
  });

  it('saves fresh data to cache after a successful fetch', async () => {
    mockedLoad.mockResolvedValue(null);
    mockedFetchOrders.mockResolvedValue(ORDERS);

    const { result } = renderHook(() => useOrders());
    await act(() => result.current.loadOrders());

    expect(mockedSave).toHaveBeenCalledWith(ORDERS);
  });
});
