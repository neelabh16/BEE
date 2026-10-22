const API_BASE = '/api/v1';

class ApiError extends Error {
  constructor(message, status, data) {
    super(message);
    this.status = status;
    this.data = data;
  }
}

async function request(endpoint, options = {}) {
  const { body, method = 'GET', headers: customHeaders = {}, ...rest } = options;

  const headers = {
    ...customHeaders,
  };

  const config = {
    method,
    headers,
    credentials: 'include',
    ...rest,
  };

  if (body && !(body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
    config.body = JSON.stringify(body);
  } else if (body instanceof FormData) {
    config.body = body;
  }

  config.headers = headers;

  try {
    const response = await fetch(`${API_BASE}${endpoint}`, config);
    
    // Handle no-content responses
    if (response.status === 204) {
      return { success: true, data: null };
    }

    const data = await response.json();

    if (!response.ok) {
      throw new ApiError(
        data.message || 'Something went wrong',
        response.status,
        data
      );
    }

    return data;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    if (error.name === 'AbortError') throw error;
    throw new ApiError(
      'Network error. Please check your connection.',
      0,
      null
    );
  }
}

const api = {
  get: (endpoint, options) => request(endpoint, { ...options, method: 'GET' }),
  post: (endpoint, body, options) => request(endpoint, { ...options, method: 'POST', body }),
  put: (endpoint, body, options) => request(endpoint, { ...options, method: 'PUT', body }),
  patch: (endpoint, body, options) => request(endpoint, { ...options, method: 'PATCH', body }),
  delete: (endpoint, options) => request(endpoint, { ...options, method: 'DELETE' }),
};

export default api;
export { ApiError };
