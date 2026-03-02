import { useEffect, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import { CONFIG } from '../config';
import { WebSocketService } from '../services/WebSocketService';
import { useOrdersStore } from '../store/ordersStore';


export function useWebSocket(onReconnect?: () => void) {
  const processWebSocketEvent = useOrdersStore((s) => s.processWebSocketEvent);
  const setConnectionStatus = useOrdersStore((s) => s.setConnectionStatus);

  const serviceRef = useRef<WebSocketService | null>(null);

  useEffect(() => {
    const service = new WebSocketService(
      CONFIG.WS_URL,
      processWebSocketEvent,
      setConnectionStatus,
    );
    serviceRef.current = service;
    service.connect();

    const handleAppStateChange = (nextState: AppStateStatus) => {
      if (nextState === 'active') {
        service.connect();
        onReconnect?.();
      } else if (nextState === 'background' || nextState === 'inactive') {
        service.disconnect();
      }
    };

    const appStateSubscription = AppState.addEventListener(
      'change',
      handleAppStateChange,
    );

    let isInitialNetInfoEvent = true;
    const unsubscribeNetInfo = NetInfo.addEventListener((state) => {
      if (isInitialNetInfoEvent) {
        isInitialNetInfoEvent = false;
        return;
      }
      if (state.isConnected && state.isInternetReachable) {
        service.connect();
        onReconnect?.();
      } else {
        setConnectionStatus('disconnected');
      }
    });

    return () => {
      service.disconnect();
      appStateSubscription.remove();
      unsubscribeNetInfo();
    };
  }, []);
}
