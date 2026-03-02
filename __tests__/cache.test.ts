import AsyncStorage from '@react-native-async-storage/async-storage';
import { ordersCache } from '../src/services/cache';
import { Order } from '../src/types';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);


const ORDERS: Order[] = [
  { id: '1', customer: 'Alice', status: 'pending', amount: 42 },
  { id: '2', customer: 'Bob', status: 'completed', amount: 99 },
];

const CACHE_KEY = '@order_monitor/orders/v1';


const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => undefined);

afterEach(async () => {
  await AsyncStorage.clear();
  warnSpy.mockClear();
});

afterAll(() => {
  warnSpy.mockRestore();
});


describe('ordersCache.save()', () => {
  it('persists the orders list as JSON under the versioned key', async () => {
    await ordersCache.save(ORDERS);

    const raw = await AsyncStorage.getItem(CACHE_KEY);
    expect(JSON.parse(raw!)).toEqual(ORDERS);
  });

  it('persists an empty array', async () => {
    await ordersCache.save([]);

    const raw = await AsyncStorage.getItem(CACHE_KEY);
    expect(JSON.parse(raw!)).toEqual([]);
  });

  it('does not throw when AsyncStorage.setItem rejects', async () => {
    jest
      .spyOn(AsyncStorage, 'setItem')
      .mockRejectedValueOnce(new Error('Storage full'));

    await expect(ordersCache.save(ORDERS)).resolves.toBeUndefined();
    expect(warnSpy).toHaveBeenCalled();
  });

  it('overwrites a previous cache entry', async () => {
    const updated: Order[] = [{ id: '3', customer: 'Carol', status: 'completed', amount: 7 }];
    await ordersCache.save(ORDERS);
    await ordersCache.save(updated);

    const raw = await AsyncStorage.getItem(CACHE_KEY);
    expect(JSON.parse(raw!)).toEqual(updated);
  });
});


describe('ordersCache.load()', () => {
  it('returns the parsed orders list when a cache entry exists', async () => {
    await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(ORDERS));

    const result = await ordersCache.load();

    expect(result).toEqual(ORDERS);
  });

  it('returns null when there is no cache entry', async () => {
    const result = await ordersCache.load();

    expect(result).toBeNull();
  });

  it('returns null and warns when the stored value is corrupted JSON', async () => {
    await AsyncStorage.setItem(CACHE_KEY, 'not-valid-json{{');

    const result = await ordersCache.load();

    expect(result).toBeNull();
    expect(warnSpy).toHaveBeenCalled();
  });

  it('returns null and warns when AsyncStorage.getItem rejects', async () => {
    jest
      .spyOn(AsyncStorage, 'getItem')
      .mockRejectedValueOnce(new Error('Disk read error'));

    const result = await ordersCache.load();

    expect(result).toBeNull();
    expect(warnSpy).toHaveBeenCalled();
  });
});


describe('ordersCache.clear()', () => {
  it('removes the cache entry from AsyncStorage', async () => {
    await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(ORDERS));

    await ordersCache.clear();

    const raw = await AsyncStorage.getItem(CACHE_KEY);
    expect(raw).toBeNull();
  });

  it('does not throw when the key does not exist', async () => {
    await expect(ordersCache.clear()).resolves.toBeUndefined();
  });

  it('does not throw when AsyncStorage.removeItem rejects', async () => {
    jest
      .spyOn(AsyncStorage, 'removeItem')
      .mockRejectedValueOnce(new Error('Write error'));

    await expect(ordersCache.clear()).resolves.toBeUndefined();
    expect(warnSpy).toHaveBeenCalled();
  });
});
