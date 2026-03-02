import { CONFIG } from '../src/config';
import { WebSocketService } from '../src/services/WebSocketService';


let latestWs!: MockWebSocket;

class MockWebSocket {
  static readonly CONNECTING = 0;
  static readonly OPEN = 1;
  static readonly CLOSING = 2;
  static readonly CLOSED = 3;

  readonly CONNECTING = 0;
  readonly OPEN = 1;
  readonly CLOSING = 2;
  readonly CLOSED = 3;

  readyState: number = MockWebSocket.CONNECTING;

  onopen: ((e: Event) => void) | null = null;
  onmessage: ((e: MessageEvent) => void) | null = null;
  onerror: ((e: Event) => void) | null = null;
  onclose: ((e: CloseEvent) => void) | null = null;

  close = jest.fn(() => {
    this.readyState = MockWebSocket.CLOSED;
  });

  constructor(public readonly url: string) {
    latestWs = this;
  }

  simulateOpen(): void {
    this.readyState = MockWebSocket.OPEN;
    this.onopen?.(new Event('open'));
  }

  simulateMessage(data: unknown): void {
    this.onmessage?.(new MessageEvent('message', { data: JSON.stringify(data) }));
  }

  simulateRawMessage(raw: string): void {
    this.onmessage?.(new MessageEvent('message', { data: raw }));
  }

  simulateError(): void {
    this.onerror?.(new Event('error'));
  }

  simulateClose(): void {
    this.readyState = MockWebSocket.CLOSED;
    this.onclose?.({} as CloseEvent);
  }
}

(global as unknown as { WebSocket: typeof MockWebSocket }).WebSocket = MockWebSocket;


jest.useFakeTimers();
jest.spyOn(Math, 'random').mockReturnValue(0);

const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => undefined);

afterAll(() => {
  warnSpy.mockRestore();
  jest.restoreAllMocks();
  jest.useRealTimers();
});


describe('WebSocketService', () => {
  let onMessage: jest.Mock;
  let onStatusChange: jest.Mock;
  let service: WebSocketService;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.clearAllTimers();
    onMessage = jest.fn();
    onStatusChange = jest.fn();
    service = new WebSocketService(CONFIG.WS_URL, onMessage, onStatusChange);
  });

  afterEach(() => {
    service.disconnect();
    jest.clearAllTimers();
  });


  describe('connect()', () => {
    it('creates a WebSocket pointed at the configured URL', () => {
      service.connect();
      expect(latestWs.url).toBe(CONFIG.WS_URL);
    });

    it('does not create a duplicate connection when the socket is already OPEN', () => {
      service.connect();
      const firstWs = latestWs;
      latestWs.simulateOpen();

      service.connect(); 
      expect(latestWs).toBe(firstWs);
    });

    it('creates a new connection when the previous socket is not OPEN', () => {
      service.connect();
      const firstWs = latestWs;

      service.connect();

      expect(latestWs).not.toBe(firstWs);
    });
  });


  describe('onopen', () => {
    it('emits "connected" status and resets reconnect counter', () => {
      service.connect();
      latestWs.simulateOpen();

      expect(onStatusChange).toHaveBeenCalledWith('connected');
    });

    it('resets reconnectAttempts so next disconnect starts fresh', () => {
      service.connect();
      latestWs.simulateClose(); 
      jest.runAllTimers();       

      latestWs.simulateOpen(); 
      expect(onStatusChange).toHaveBeenCalledWith('connected');

      latestWs.simulateClose();
      expect(onStatusChange).toHaveBeenCalledWith('reconnecting');
    });
  });


  describe('onmessage', () => {
    const event = {
      type: 'NEW_ORDER' as const,
      eventId: 'evt-1',
      payload: { id: '1', customer: 'Alice', status: 'pending' as const, amount: 10 },
    };

    it('parses valid JSON and forwards to the message handler', () => {
      service.connect();
      latestWs.simulateMessage(event);

      expect(onMessage).toHaveBeenCalledWith(event);
    });

    it('swallows invalid JSON without throwing', () => {
      service.connect();

      expect(() => latestWs.simulateRawMessage('not-json{{')).not.toThrow();
      expect(onMessage).not.toHaveBeenCalled();
      expect(warnSpy).toHaveBeenCalled();
    });
  });


  describe('onerror', () => {
    it('logs a warning and does not throw', () => {
      service.connect();

      expect(() => latestWs.simulateError()).not.toThrow();
      expect(warnSpy).toHaveBeenCalled();
    });
  });


  describe('onclose → reconnection', () => {
    it('emits "reconnecting" when the socket closes and shouldReconnect is true', () => {
      service.connect();
      latestWs.simulateClose();

      expect(onStatusChange).toHaveBeenCalledWith('reconnecting');
    });

    it('creates a new WebSocket after the backoff delay elapses', () => {
      service.connect();
      const firstWs = latestWs;
      latestWs.simulateClose();

      jest.runAllTimers(); 

      expect(latestWs).not.toBe(firstWs);
    });

    it('reconnected socket emits "connected" when it opens', () => {
      service.connect();
      latestWs.simulateClose();
      jest.runAllTimers();
      latestWs.simulateOpen();

      const calls = onStatusChange.mock.calls.map(([s]) => s);
      expect(calls).toContain('connected');
    });

    it('does NOT reconnect when shouldReconnect is false (disconnect was called)', () => {
      service.connect();
      latestWs.simulateOpen();
      service.disconnect(); 

      const wsAtDisconnect = latestWs;
      jest.runAllTimers();

      expect(latestWs).toBe(wsAtDisconnect); 
      expect(onStatusChange).toHaveBeenLastCalledWith('disconnected');
    });

    it('cancels a pending reconnect timer when disconnect() is called during backoff', () => {
      service.connect();
      latestWs.simulateOpen();
      latestWs.simulateClose();

      expect(onStatusChange).toHaveBeenCalledWith('reconnecting');

      const wsBeforeDisconnect = latestWs;
      service.disconnect();

      jest.runAllTimers(); 

      expect(latestWs).toBe(wsBeforeDisconnect); 
      expect(onStatusChange).toHaveBeenLastCalledWith('disconnected');
    });
  });


  describe('reconnection strategy', () => {
    function exhaustCycles(n: number): void {
      for (let i = 0; i < n; i++) {
        latestWs.simulateClose();
        jest.runAllTimers();
      }
    }

    it('never stops reconnecting — no attempt cap', () => {
      service.connect();

      exhaustCycles(50);

      const statuses = onStatusChange.mock.calls.map(([s]) => s);
      expect(statuses).not.toContain('disconnected');
    });

    it('uses a 60 s delay after WS_PHASE2_AFTER_ATTEMPTS failures (phase 2)', () => {
      service.connect();

      exhaustCycles(CONFIG.WS_PHASE2_AFTER_ATTEMPTS);

      latestWs.simulateClose();
      const wsAfterClose = latestWs;

      jest.advanceTimersByTime(60_000 - 1);
      expect(latestWs).toBe(wsAfterClose);

      jest.advanceTimersByTime(1);
      expect(latestWs).not.toBe(wsAfterClose); 
    });

    it('uses a 5 min delay after WS_PHASE3_AFTER_ATTEMPTS failures (phase 3)', () => {
      service.connect();

      exhaustCycles(CONFIG.WS_PHASE3_AFTER_ATTEMPTS);

      latestWs.simulateClose();
      const wsAfterClose = latestWs;

      jest.advanceTimersByTime(5 * 60_000 - 1);
      expect(latestWs).toBe(wsAfterClose);

      jest.advanceTimersByTime(1);
      expect(latestWs).not.toBe(wsAfterClose);
    });

    it('uses a 10 min delay after WS_PHASE4_AFTER_ATTEMPTS failures (phase 4)', () => {
      service.connect();

      exhaustCycles(CONFIG.WS_PHASE4_AFTER_ATTEMPTS);

      latestWs.simulateClose();
      const wsAfterClose = latestWs;

      jest.advanceTimersByTime(10 * 60_000 - 1);
      expect(latestWs).toBe(wsAfterClose);

      jest.advanceTimersByTime(1);
      expect(latestWs).not.toBe(wsAfterClose);
    });

    it('resets to phase-1 timing after a successful reconnect', () => {
      service.connect();

      exhaustCycles(CONFIG.WS_PHASE2_AFTER_ATTEMPTS);

      latestWs.simulateClose();
      jest.runAllTimers();
      latestWs.simulateOpen();

      latestWs.simulateClose();
      const wsAfterReset = latestWs;
      jest.advanceTimersByTime(0);
      expect(latestWs).not.toBe(wsAfterReset); 
    });
  });


  describe('disconnect()', () => {
    it('closes the underlying socket when one is active', () => {
      service.connect();
      latestWs.simulateOpen();

      service.disconnect();

      expect(latestWs.close).toHaveBeenCalledTimes(1);
    });

    it('emits "disconnected" even when there is no active socket', () => {
      expect(() => service.disconnect()).not.toThrow();
      expect(onStatusChange).toHaveBeenCalledWith('disconnected');
    });

    it('nullifies ws.onclose before closing so the handler cannot trigger a reconnect', () => {
      service.connect();
      latestWs.simulateOpen();

      service.disconnect();

      expect(latestWs.onclose).toBeNull();
    });
  });


  describe('createConnection() error path', () => {
    it('schedules a reconnect if the WebSocket constructor throws', () => {
      const originalWs = (global as unknown as { WebSocket: unknown }).WebSocket;

      const throwingWs = jest.fn().mockImplementation(() => {
        throw new Error('Connection refused');
      });
      (throwingWs as unknown as { OPEN: number }).OPEN = MockWebSocket.OPEN;
      (global as unknown as { WebSocket: unknown }).WebSocket = throwingWs;

      service.connect();

      expect(onStatusChange).toHaveBeenCalledWith('reconnecting');
      expect(warnSpy).toHaveBeenCalled();

      (global as unknown as { WebSocket: unknown }).WebSocket = originalWs;
    });
  });
});
