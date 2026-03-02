import AsyncStorage from '@react-native-async-storage/async-storage';
import { Order } from '../types';

const CACHE_KEY = '@order_monitor/orders/v1';


export const ordersCache = {

  async save(orders: Order[]): Promise<void> {
    try {
      await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(orders));
    } catch (err) {
      console.warn('[ordersCache] Failed to save cache:', err);
    }
  },


  async load(): Promise<Order[] | null> {
    try {
      const raw = await AsyncStorage.getItem(CACHE_KEY);
      if (raw === null) return null;
      return JSON.parse(raw) as Order[];
    } catch (err) {
      console.warn('[ordersCache] Failed to load cache:', err);
      return null;
    }
  },

  async clear(): Promise<void> {
    try {
      await AsyncStorage.removeItem(CACHE_KEY);
    } catch (err) {
      console.warn('[ordersCache] Failed to clear cache:', err);
    }
  },
};
