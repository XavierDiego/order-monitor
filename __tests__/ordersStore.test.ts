import { useOrdersStore } from '../src/store/ordersStore';
import { Order, WebSocketEvent } from '../src/types';


const ORDER_1: Order = { id: '1', customer: 'John', status: 'pending', amount: 100 };
const ORDER_2: Order = { id: '2', customer: 'Jane', status: 'completed', amount: 200 };

function makeEvent(
  type: WebSocketEvent['type'],
  payload: WebSocketEvent['payload'],
  eventId = 'evt-1',
): WebSocketEvent {
  return { type, eventId, payload } as WebSocketEvent;
}


beforeEach(() => {
  useOrdersStore.setState({
    orders: [],
    connectionStatus: 'disconnected',
    isLoading: false,
    error: null,
    processedEventIds: new Set(),
  });
});


describe('setOrders', () => {
  it('replaces the orders list', () => {
    useOrdersStore.getState().setOrders([ORDER_1, ORDER_2]);
    expect(useOrdersStore.getState().orders).toEqual([ORDER_1, ORDER_2]);
  });

  it('clears the list when called with []', () => {
    useOrdersStore.getState().setOrders([ORDER_1]);
    useOrdersStore.getState().setOrders([]);
    expect(useOrdersStore.getState().orders).toHaveLength(0);
  });
});

describe('setConnectionStatus', () => {
  it.each([
    ['connected' as const],
    ['reconnecting' as const],
    ['disconnected' as const],
  ])('sets status to %s', (status) => {
    useOrdersStore.getState().setConnectionStatus(status);
    expect(useOrdersStore.getState().connectionStatus).toBe(status);
  });
});

describe('setLoading', () => {
  it('sets isLoading to true', () => {
    useOrdersStore.getState().setLoading(true);
    expect(useOrdersStore.getState().isLoading).toBe(true);
  });

  it('sets isLoading to false', () => {
    useOrdersStore.getState().setLoading(true);
    useOrdersStore.getState().setLoading(false);
    expect(useOrdersStore.getState().isLoading).toBe(false);
  });
});

describe('setError', () => {
  it('sets an error message', () => {
    useOrdersStore.getState().setError('Network error');
    expect(useOrdersStore.getState().error).toBe('Network error');
  });

  it('clears the error when called with null', () => {
    useOrdersStore.getState().setError('Some error');
    useOrdersStore.getState().setError(null);
    expect(useOrdersStore.getState().error).toBeNull();
  });
});


describe('processWebSocketEvent', () => {
  beforeEach(() => {
    useOrdersStore.getState().setOrders([ORDER_1, ORDER_2]);
  });


  it('adds a new order on NEW_ORDER', () => {
    const newOrder: Order = { id: '3', customer: 'Bob', status: 'pending', amount: 50 };
    useOrdersStore.getState().processWebSocketEvent(
      makeEvent('NEW_ORDER', newOrder, 'evt-new'),
    );
    const { orders } = useOrdersStore.getState();
    expect(orders[0]).toEqual(newOrder);
    expect(orders).toHaveLength(3);
  });

  it('updates an existing order on ORDER_UPDATED', () => {
    const updated = { ...ORDER_1, status: 'completed' as const };
    useOrdersStore.getState().processWebSocketEvent(
      makeEvent('ORDER_UPDATED', updated, 'evt-update'),
    );
    const found = useOrdersStore.getState().orders.find((o) => o.id === '1');
    expect(found?.status).toBe('completed');
  });

  it('removes an order on ORDER_CANCELLED', () => {
    useOrdersStore.getState().processWebSocketEvent(
      makeEvent('ORDER_CANCELLED', { id: '2' }, 'evt-cancel'),
    );
    const { orders } = useOrdersStore.getState();
    expect(orders).toHaveLength(1);
    expect(orders.find((o) => o.id === '2')).toBeUndefined();
  });


  it('ignores a duplicate event (same eventId)', () => {
    const newOrder: Order = { id: '3', customer: 'Bob', status: 'pending', amount: 50 };
    const event = makeEvent('NEW_ORDER', newOrder, 'evt-dup');

    useOrdersStore.getState().processWebSocketEvent(event);
    useOrdersStore.getState().processWebSocketEvent(event); 

    expect(useOrdersStore.getState().orders).toHaveLength(3);
  });

  it('records the eventId in processedEventIds after processing', () => {
    const event = makeEvent('NEW_ORDER', ORDER_1, 'evt-track');
    useOrdersStore.getState().processWebSocketEvent(event);
    expect(useOrdersStore.getState().processedEventIds.has('evt-track')).toBe(true);
  });

  it('processes two events with different eventIds independently', () => {
    const a: Order = { id: '3', customer: 'A', status: 'pending', amount: 1 };
    const b: Order = { id: '4', customer: 'B', status: 'pending', amount: 2 };

    useOrdersStore.getState().processWebSocketEvent(makeEvent('NEW_ORDER', a, 'evt-a'));
    useOrdersStore.getState().processWebSocketEvent(makeEvent('NEW_ORDER', b, 'evt-b'));

    expect(useOrdersStore.getState().orders).toHaveLength(4);
  });


  it('evicts the oldest eventId when the set exceeds 1 000 entries', () => {
    const bigSet = new Set(Array.from({ length: 1_000 }, (_, i) => `old-${i}`));
    useOrdersStore.setState({ processedEventIds: bigSet });

    const trigger: Order = { id: '99', customer: 'X', status: 'pending', amount: 0 };
    useOrdersStore.getState().processWebSocketEvent(
      makeEvent('NEW_ORDER', trigger, 'evt-trigger'),
    );

    const { processedEventIds } = useOrdersStore.getState();
    expect(processedEventIds.size).toBe(1_000); 
    expect(processedEventIds.has('old-0')).toBe(false); 
    expect(processedEventIds.has('evt-trigger')).toBe(true);
  });

  it('does NOT evict when the set is exactly 1 000 before adding', () => {
    const almostFull = new Set(Array.from({ length: 999 }, (_, i) => `id-${i}`));
    useOrdersStore.setState({ processedEventIds: almostFull });

    const order: Order = { id: '99', customer: 'Y', status: 'pending', amount: 0 };
    useOrdersStore.getState().processWebSocketEvent(
      makeEvent('NEW_ORDER', order, 'evt-999'),
    );

    expect(useOrdersStore.getState().processedEventIds.size).toBe(1_000);
    expect(useOrdersStore.getState().processedEventIds.has('id-0')).toBe(true);
  });


  it('returns the exact same state reference on a duplicate event (no-op)', () => {
    const event = makeEvent('NEW_ORDER', ORDER_1, 'evt-noop');
    useOrdersStore.getState().processWebSocketEvent(event);

    const stateBefore = useOrdersStore.getState();
    useOrdersStore.getState().processWebSocketEvent(event);
    const stateAfter = useOrdersStore.getState();

    expect(stateAfter.orders).toBe(stateBefore.orders);
    expect(stateAfter.processedEventIds).toBe(stateBefore.processedEventIds);
  });
});
