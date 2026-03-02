import { renderHook, act } from '@testing-library/react-native';
import { AppState, AppStateStatus } from 'react-native';
import { useWebSocket } from '../../src/hooks/useWebSocket';
import { useOrdersStore } from '../../src/store/ordersStore';


const mockConnect = jest.fn();
const mockDisconnect = jest.fn();

jest.mock('../../src/services/WebSocketService', () => ({
  WebSocketService: jest.fn(() => ({ connect: mockConnect, disconnect: mockDisconnect })),
}));

jest.mock('@react-native-community/netinfo', () => ({
  __esModule: true,
  default: { addEventListener: jest.fn() },
}));


let capturedAppStateCallback: ((state: AppStateStatus) => void) | null = null;
let capturedNetInfoCallback: ((state: { isConnected: boolean; isInternetReachable: boolean }) => void) | null = null;
let mockAppStateRemove: jest.Mock;
let mockNetInfoUnsub: jest.Mock;

beforeEach(() => {
  jest.clearAllMocks();
  capturedAppStateCallback = null;
  capturedNetInfoCallback = null;
  mockAppStateRemove = jest.fn();
  mockNetInfoUnsub = jest.fn();

  useOrdersStore.setState({ connectionStatus: 'disconnected' });

  jest.spyOn(AppState, 'addEventListener').mockImplementation((_event, handler) => {
    capturedAppStateCallback = handler as (state: AppStateStatus) => void;
    return { remove: mockAppStateRemove };
  });

  const NetInfo = require('@react-native-community/netinfo').default;
  NetInfo.addEventListener.mockImplementation((cb: typeof capturedNetInfoCallback) => {
    capturedNetInfoCallback = cb;
    return mockNetInfoUnsub;
  });
});

afterEach(() => {
  jest.restoreAllMocks();
});


describe('useWebSocket', () => {
  it('connects on mount and disconnects on unmount', () => {
    const { unmount } = renderHook(() => useWebSocket());

    expect(mockConnect).toHaveBeenCalledTimes(1);

    unmount();

    expect(mockDisconnect).toHaveBeenCalledTimes(1);
  });

  it('removes AppState and NetInfo subscriptions on unmount', () => {
    const { unmount } = renderHook(() => useWebSocket());
    unmount();

    expect(mockAppStateRemove).toHaveBeenCalled();
    expect(mockNetInfoUnsub).toHaveBeenCalled();
  });

  it('disconnects when the app goes to background', () => {
    renderHook(() => useWebSocket());

    act(() => { capturedAppStateCallback!('background'); });

    expect(mockDisconnect).toHaveBeenCalledTimes(1);
  });

  it('disconnects when the app becomes inactive', () => {
    renderHook(() => useWebSocket());

    act(() => { capturedAppStateCallback!('inactive'); });

    expect(mockDisconnect).toHaveBeenCalledTimes(1);
  });

  it('reconnects when the app returns to the foreground', () => {
    renderHook(() => useWebSocket());

    act(() => { capturedAppStateCallback!('active'); });

    expect(mockConnect).toHaveBeenCalledTimes(2);
  });

  it('calls onReconnect when the app returns to the foreground', () => {
    const onReconnect = jest.fn();
    renderHook(() => useWebSocket(onReconnect));

    act(() => { capturedAppStateCallback!('active'); });

    expect(onReconnect).toHaveBeenCalledTimes(1);
  });

  it('ignores the very first NetInfo event so mount does not cause a double-load', () => {
    const onReconnect = jest.fn();
    renderHook(() => useWebSocket(onReconnect));

    act(() => {
      capturedNetInfoCallback!({ isConnected: true, isInternetReachable: true });
    });

    expect(onReconnect).not.toHaveBeenCalled();
    expect(mockConnect).toHaveBeenCalledTimes(1);
  });

  it('calls onReconnect and reconnects when the network is restored', () => {
    const onReconnect = jest.fn();
    renderHook(() => useWebSocket(onReconnect));

    act(() => { capturedNetInfoCallback!({ isConnected: true, isInternetReachable: true }); });

    act(() => { capturedNetInfoCallback!({ isConnected: true, isInternetReachable: true }); });

    expect(onReconnect).toHaveBeenCalledTimes(1);
    expect(mockConnect).toHaveBeenCalledTimes(2);
  });

  it('sets connectionStatus to disconnected when the network is lost', () => {
    renderHook(() => useWebSocket());

    act(() => { capturedNetInfoCallback!({ isConnected: true, isInternetReachable: true }); });

    act(() => { capturedNetInfoCallback!({ isConnected: false, isInternetReachable: false }); });

    expect(useOrdersStore.getState().connectionStatus).toBe('disconnected');
  });
});
