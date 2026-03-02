import { CONFIG } from '../config';
import { ConnectionStatus, WebSocketEvent } from '../types';

type MessageHandler = (event: WebSocketEvent) => void;
type StatusHandler = (status: ConnectionStatus) => void;

export class WebSocketService {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private shouldReconnect = false;

  private readonly url: string;
  private readonly onMessage: MessageHandler;
  private readonly onStatusChange: StatusHandler;

  constructor(url: string, onMessage: MessageHandler, onStatusChange: StatusHandler) {
    this.url = url;
    this.onMessage = onMessage;
    this.onStatusChange = onStatusChange;
  }

  connect(): void {
    if (this.ws?.readyState === WebSocket.OPEN) return;

    this.shouldReconnect = true;
    this.createConnection();
  }

  disconnect(): void {
    this.shouldReconnect = false;
    this.clearReconnectTimer();

    if (this.ws) {
      this.ws.onclose = null;
      this.ws.close();
      this.ws = null;
    }

    this.onStatusChange('disconnected');
  }

  private createConnection(): void {
    try {
      this.ws = new WebSocket(this.url);

      this.ws.onopen = () => {
        this.reconnectAttempts = 0;
        this.onStatusChange('connected');
      };

      this.ws.onmessage = ({ data }) => {
        try {
          const event = JSON.parse(data as string) as WebSocketEvent;
          this.onMessage(event);
        } catch {
          console.warn('[WebSocketService] Could not parse message:', data);
        }
      };

      this.ws.onerror = (e) => {
        console.warn('[WebSocketService] Socket error:', e);
      };

      this.ws.onclose = () => {
        this.ws = null;
        if (this.shouldReconnect) {
          this.scheduleReconnect();
        }
      };
    } catch (error) {
      console.warn('[WebSocketService] Failed to open socket:', error);
      if (this.shouldReconnect) {
        this.scheduleReconnect();
      }
    }
  }

  private scheduleReconnect(): void {
    this.onStatusChange('reconnecting');

    const delay = this.getBackoffDelay();
    this.clearReconnectTimer();

    this.reconnectTimer = setTimeout(() => {
      this.reconnectAttempts += 1;
      this.createConnection();
    }, delay);
  }

  private getBackoffDelay(): number {
    const {
      WS_BASE_DELAY_MS,
      WS_MAX_DELAY_MS,
      WS_PHASE2_AFTER_ATTEMPTS,
      WS_PHASE3_AFTER_ATTEMPTS,
      WS_PHASE4_AFTER_ATTEMPTS,
    } = CONFIG;

    if (this.reconnectAttempts >= WS_PHASE4_AFTER_ATTEMPTS) return 10 * 60_000; // 10 min
    if (this.reconnectAttempts >= WS_PHASE3_AFTER_ATTEMPTS) return  5 * 60_000; // 5 min
    if (this.reconnectAttempts >= WS_PHASE2_AFTER_ATTEMPTS) return      60_000; // 1 min

    const exponential = WS_BASE_DELAY_MS * Math.pow(2, this.reconnectAttempts);
    const capped = Math.min(exponential, WS_MAX_DELAY_MS);
    return Math.random() * capped;
  }

  private clearReconnectTimer(): void {
    if (this.reconnectTimer !== null) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }
}
