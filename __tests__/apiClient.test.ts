import { ApiError, apiClient } from '../src/api/client';
import { CONFIG } from '../src/config';


const mockFetch = jest.fn();
(global as unknown as { fetch: typeof mockFetch }).fetch = mockFetch;

function mockResponse(ok: boolean, status: number, statusText: string, body: unknown) {
  return Promise.resolve({
    ok,
    status,
    statusText,
    json: jest.fn().mockResolvedValue(body),
  });
}

afterEach(() => {
  mockFetch.mockReset();
});


describe('apiClient.get', () => {
  it('calls fetch with the correct full URL and no request body or headers', async () => {
    mockFetch.mockReturnValue(mockResponse(true, 200, 'OK', []));

    await apiClient.get('/orders');

    expect(mockFetch).toHaveBeenCalledWith(
      `${CONFIG.HTTP_BASE_URL}/orders`,
      undefined,
    );
  });

  it('returns the parsed JSON body on a 2xx response', async () => {
    const orders = [{ id: '1', customer: 'Alice', status: 'pending', amount: 10 }];
    mockFetch.mockReturnValue(mockResponse(true, 200, 'OK', orders));

    const result = await apiClient.get('/orders');

    expect(result).toEqual(orders);
  });

  it('throws ApiError with correct status on a 4xx response', async () => {
    mockFetch.mockReturnValue(mockResponse(false, 404, 'Not Found', {}));

    await expect(apiClient.get('/orders')).rejects.toMatchObject({
      name: 'ApiError',
      status: 404,
      message: 'HTTP 404: Not Found',
    });
  });

  it('throws ApiError with correct status on a 5xx response', async () => {
    mockFetch.mockReturnValue(mockResponse(false, 500, 'Internal Server Error', {}));

    await expect(apiClient.get('/orders')).rejects.toMatchObject({
      name: 'ApiError',
      status: 500,
    });
  });

  it('propagates a network error (fetch itself throws)', async () => {
    const networkError = new Error('Network request failed');
    mockFetch.mockRejectedValue(networkError);

    await expect(apiClient.get('/orders')).rejects.toThrow('Network request failed');
  });
});


describe('apiClient.post', () => {
  it('calls fetch with POST method, Content-Type header, and serialised body', async () => {
    mockFetch.mockReturnValue(mockResponse(true, 201, 'Created', {}));
    const body = { customer: 'Alice', amount: 42, status: 'pending' };

    await apiClient.post('/orders', body);

    const [url, init] = mockFetch.mock.calls[0];
    expect(url).toBe(`${CONFIG.HTTP_BASE_URL}/orders`);
    expect(init.method).toBe('POST');
    expect(init.headers).toEqual({ 'Content-Type': 'application/json' });
    expect(JSON.parse(init.body)).toEqual(body);
  });

  it('returns the parsed JSON body on a 2xx response', async () => {
    const created = { id: '5', customer: 'Alice', status: 'pending', amount: 42 };
    mockFetch.mockReturnValue(mockResponse(true, 201, 'Created', created));

    const result = await apiClient.post('/orders', { customer: 'Alice', amount: 42 });

    expect(result).toEqual(created);
  });

  it('throws ApiError on a 4xx response', async () => {
    mockFetch.mockReturnValue(mockResponse(false, 400, 'Bad Request', {}));

    await expect(apiClient.post('/orders', {})).rejects.toMatchObject({
      name: 'ApiError',
      status: 400,
    });
  });

  it('propagates a network error', async () => {
    mockFetch.mockRejectedValue(new Error('Network request failed'));

    await expect(apiClient.post('/orders', {})).rejects.toThrow('Network request failed');
  });
});


describe('apiClient.patch', () => {
  it('calls fetch with PATCH method, Content-Type header, and serialised body', async () => {
    mockFetch.mockReturnValue(mockResponse(true, 200, 'OK', {}));
    const body = { status: 'completed' };

    await apiClient.patch('/orders/1', body);

    const [url, init] = mockFetch.mock.calls[0];
    expect(url).toBe(`${CONFIG.HTTP_BASE_URL}/orders/1`);
    expect(init.method).toBe('PATCH');
    expect(init.headers).toEqual({ 'Content-Type': 'application/json' });
    expect(JSON.parse(init.body)).toEqual(body);
  });

  it('returns the parsed JSON body on a 2xx response', async () => {
    const updated = { id: '1', customer: 'John', status: 'completed', amount: 120 };
    mockFetch.mockReturnValue(mockResponse(true, 200, 'OK', updated));

    const result = await apiClient.patch('/orders/1', { status: 'completed' });

    expect(result).toEqual(updated);
  });

  it('throws ApiError on a 4xx response', async () => {
    mockFetch.mockReturnValue(mockResponse(false, 404, 'Not Found', {}));

    await expect(apiClient.patch('/orders/999', { status: 'completed' })).rejects.toMatchObject({
      name: 'ApiError',
      status: 404,
    });
  });

  it('propagates a network error', async () => {
    mockFetch.mockRejectedValue(new Error('Network request failed'));

    await expect(apiClient.patch('/orders/1', {})).rejects.toThrow('Network request failed');
  });
});


describe('ApiError', () => {
  it('is an instance of Error', () => {
    const err = new ApiError(422, 'Unprocessable Entity');
    expect(err).toBeInstanceOf(Error);
  });

  it('sets name to "ApiError"', () => {
    const err = new ApiError(422, 'Unprocessable Entity');
    expect(err.name).toBe('ApiError');
  });

  it('exposes the HTTP status code', () => {
    const err = new ApiError(403, 'Forbidden');
    expect(err.status).toBe(403);
  });

  it('exposes the message', () => {
    const err = new ApiError(400, 'Bad Request');
    expect(err.message).toBe('Bad Request');
  });
});


import { fetchOrders, createOrder, updateOrderStatus } from '../src/api/orders';

describe('fetchOrders', () => {
  it('delegates to apiClient.get with the /orders path', async () => {
    const orders = [
      { id: '1', customer: 'John', status: 'pending', amount: 120.5 },
      { id: '2', customer: 'Jane', status: 'completed', amount: 89.9 },
    ];
    mockFetch.mockReturnValue(mockResponse(true, 200, 'OK', orders));

    const result = await fetchOrders();

    expect(result).toEqual(orders);
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/orders'),
      undefined,
    );
  });

  it('surfaces API errors from the underlying client', async () => {
    mockFetch.mockReturnValue(mockResponse(false, 503, 'Service Unavailable', {}));

    await expect(fetchOrders()).rejects.toMatchObject({
      name: 'ApiError',
      status: 503,
    });
  });
});


describe('createOrder', () => {
  it('POSTs to /orders with customer, amount, and status fixed to "pending"', async () => {
    const created = { id: '5', customer: 'Alice', status: 'pending', amount: 50 };
    mockFetch.mockReturnValue(mockResponse(true, 201, 'Created', created));

    const result = await createOrder({ customer: 'Alice', amount: 50 });

    expect(result).toEqual(created);
    const [url, init] = mockFetch.mock.calls[0];
    expect(url).toBe(`${CONFIG.HTTP_BASE_URL}/orders`);
    expect(init.method).toBe('POST');
    expect(JSON.parse(init.body)).toMatchObject({
      customer: 'Alice',
      amount: 50,
      status: 'pending',
    });
  });

  it('propagates errors from the API', async () => {
    mockFetch.mockReturnValue(mockResponse(false, 422, 'Unprocessable Entity', {}));

    await expect(createOrder({ customer: '', amount: -1 })).rejects.toMatchObject({
      name: 'ApiError',
      status: 422,
    });
  });
});


describe('updateOrderStatus', () => {
  it('PATCHes /orders/:id with only the new status in the body', async () => {
    const updated = { id: '3', customer: 'Bob', status: 'completed', amount: 235 };
    mockFetch.mockReturnValue(mockResponse(true, 200, 'OK', updated));

    const result = await updateOrderStatus('3', 'completed');

    expect(result).toEqual(updated);
    const [url, init] = mockFetch.mock.calls[0];
    expect(url).toBe(`${CONFIG.HTTP_BASE_URL}/orders/3`);
    expect(init.method).toBe('PATCH');
    expect(JSON.parse(init.body)).toEqual({ status: 'completed' });
  });

  it('works for every valid status value', async () => {
    const statuses = ['pending', 'processing', 'completed', 'cancelled'] as const;

    for (const status of statuses) {
      mockFetch.mockReturnValue(
        mockResponse(true, 200, 'OK', { id: '1', customer: 'X', status, amount: 1 }),
      );
      const result = await updateOrderStatus('1', status);
      expect(result.status).toBe(status);
      mockFetch.mockReset();
    }
  });

  it('propagates errors from the API', async () => {
    mockFetch.mockReturnValue(mockResponse(false, 404, 'Not Found', {}));

    await expect(updateOrderStatus('999', 'cancelled')).rejects.toMatchObject({
      name: 'ApiError',
      status: 404,
    });
  });
});
