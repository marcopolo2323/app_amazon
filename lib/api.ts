import Constants from 'expo-constants';

// Safely get API URL with multiple fallbacks
const getApiUrl = () => {
  try {
    return (
      Constants.expoConfig?.extra?.EXPO_PUBLIC_API_URL ||
      Constants.manifest?.extra?.EXPO_PUBLIC_API_URL ||
      process.env.EXPO_PUBLIC_API_URL ||
      'https://amazon-group-app.onrender.com/api'
    );
  } catch (error) {
    console.error('Error getting API URL:', error);
    return 'https://amazon-group-app.onrender.com/api';
  }
};

const API_URL = getApiUrl();

interface ApiError {
  message: string;
  status?: number;
}

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const error: ApiError = {
          message: errorData.message || errorData.error || `HTTP ${response.status}`,
          status: response.status,
        };
        throw error;
      }

      return await response.json();
    } catch (error: any) {
      if (error.message && error.status) {
        throw error;
      }
      throw {
        message: error.message || 'Error de conexión',
        status: 0,
      } as ApiError;
    }
  }

  // Auth endpoints
  async login(email: string, password: string) {
    console.log('API URL:', this.baseUrl);
    console.log('Login endpoint:', `${this.baseUrl}/users/login`);
    return this.request('/users/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  async googleLogin(idToken: string) {
    return this.request('/users/oauth/google', {
      method: 'POST',
      body: JSON.stringify({ idToken }),
    });
  }

  async register(payload: any) {
    return this.request('/users/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async requestPasswordReset(email: string) {
    return this.request('/users/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  }

  async resetPasswordWithToken(email: string, token: string, password: string) {
    return this.request('/users/reset-password', {
      method: 'POST',
      body: JSON.stringify({ email, token, password }),
    });
  }

  // User endpoints
  async updateMe(token: string, updates: any) {
    return this.request('/users/me', {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(updates),
    });
  }

  // Services endpoints
  async listServices(token?: string) {
    return this.request('/services', {
      method: 'GET',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
  }

  async createService(token: string, payload: any) {
    return this.request('/services', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });
  }

  async updateService(token: string, serviceId: string, updates: any) {
    return this.request(`/services/${serviceId}`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(updates),
    });
  }

  async deleteService(token: string, serviceId: string) {
    return this.request(`/services/${serviceId}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  }

  // Reviews endpoints
  async listServiceReviews(serviceId: string, token?: string) {
    return this.request(`/services/${serviceId}/reviews`, {
      method: 'GET',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
  }

  async createReview(token: string, payload: any) {
    return this.request('/reviews', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });
  }

  // Orders endpoints
  async listOrders(token: string) {
    return this.request('/orders', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  }

  async getOrder(token: string, orderId: string) {
    return this.request(`/orders/${orderId}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  }

  async createOrder(token: string, payload: any) {
    return this.request('/orders', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });
  }

  async getOrderInvoice(token: string, orderId: string) {
    return this.request(`/orders/${orderId}/invoice`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  }

  // Payment endpoints
  async createMercadoPagoPreference(token: string, payload: any) {
    console.log('=== API: CREATE MERCADO PAGO PREFERENCE ===');
    console.log('Token:', token ? 'Present' : 'Missing');
    console.log('Payload:', JSON.stringify(payload, null, 2));
    console.log('Endpoint:', `${this.baseUrl}/payments/mercadopago/preference`);
    
    try {
      const result = await this.request('/payments/mercadopago/preference', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
      
      console.log('=== MERCADO PAGO PREFERENCE RESPONSE ===');
      console.log('Response:', JSON.stringify(result, null, 2));
      console.log('init_point:', result?.init_point);
      console.log('sandbox_init_point:', result?.sandbox_init_point);
      console.log('url:', result?.url);
      
      return result;
    } catch (error: any) {
      console.error('=== MERCADO PAGO PREFERENCE ERROR ===');
      console.error('Error:', error);
      console.error('Error message:', error?.message);
      console.error('Error status:', error?.status);
      throw error;
    }
  }

  // Affiliate endpoints
  async createAffiliate(token: string, payload: any) {
    return this.request('/affiliates', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });
  }

  async getAffiliateStats(token: string) {
    return this.request('/affiliates/stats', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  }

  async listTransactions(token: string) {
    return this.request('/transactions', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  }

  // Categories endpoints
  async listCategories(token?: string) {
    return this.request('/categories', {
      method: 'GET',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
  }

  // Image upload endpoints
  async uploadImage(token: string, uri: string, fileName: string) {
    try {
      console.log('=== UPLOAD IMAGE DEBUG ===');
      console.log('Token:', token ? 'Present' : 'Missing');
      console.log('URI:', uri);
      console.log('FileName:', fileName);
      console.log('Upload URL:', `${this.baseUrl}/upload`);

      const formData = new FormData();
      formData.append('file', {
        uri,
        name: fileName,
        type: 'image/jpeg',
      } as any);

      const url = `${this.baseUrl}/upload`;
      
      console.log('Sending request...');
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      console.log('Response status:', response.status);
      console.log('Response ok:', response.ok);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.log('Error data:', errorData);
        throw {
          message: errorData.message || errorData.error || `HTTP ${response.status}`,
          status: response.status,
        } as ApiError;
      }

      const result = await response.json();
      console.log('Upload successful:', result);
      return result;
    } catch (error: any) {
      console.error('=== UPLOAD ERROR ===');
      console.error('Error:', error);
      console.error('Error message:', error.message);
      console.error('Error status:', error.status);
      throw error;
    }
  }

  async deleteImage(token: string, publicId: string) {
    return this.request('/upload', {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ publicId }),
    });
  }
}

export const Api = new ApiClient(API_URL);
