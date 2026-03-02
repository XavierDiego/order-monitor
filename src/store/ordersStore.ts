import { create } from 'zustand';
import { ConnectionStatus, Order, WebSocketEvent } from '../types';
import { applyOrderEvent } from '../utils/orderMerger';


interface OrdersState {
  orders: Order[];
  connectionStatus: ConnectionStatus;
  isLoading: boolean;
  error: string | null;
  processedEventIds: Set<string>;
}


interface OrdersActions {
  setOrders: (orders: Order[]) => void;
  setConnectionStatus: (status: ConnectionStatus) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;

  processWebSocketEvent: (event: WebSocketEvent) => void;
}


export const useOrdersStore = create<OrdersState & OrdersActions>((set) => ({
  orders: [],
  connectionStatus: 'disconnected',
  isLoading: false,
  error: null,
  processedEventIds: new Set<string>(),

  setOrders: (orders) => set({ orders }),

  setConnectionStatus: (connectionStatus) => set({ connectionStatus }),

  setLoading: (isLoading) => set({ isLoading }),

  setError: (error) => set({ error }),

  processWebSocketEvent: (event) =>
    set((state) => {
      if (state.processedEventIds.has(event.eventId)) {
        return state;
      }

      const processedEventIds = new Set(state.processedEventIds);
      processedEventIds.add(event.eventId);

      if (processedEventIds.size > 1_000) {
        const [first] = processedEventIds;
        processedEventIds.delete(first);
      }

      return {
        orders: applyOrderEvent(state.orders, event),
        processedEventIds,
      };
    }),
}));
