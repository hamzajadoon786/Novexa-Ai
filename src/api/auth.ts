import { api } from './client';

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
  isVerified: boolean;
  createdAt: string;
}

export interface AuthResponse {
  user: UserProfile;
  accessToken: string;
  refreshToken: string;
}

export const authApi = {
  async register(payload: Record<string, any>): Promise<AuthResponse> {
    const { data } = await api.post<AuthResponse>('/auth/register', payload);
    this.setTokenState(data);
    return data;
  },

  async login(payload: Record<string, any>): Promise<AuthResponse> {
    const { data } = await api.post<AuthResponse>('/auth/login', payload);
    this.setTokenState(data);
    return data;
  },

  async googleLogin(credential: string): Promise<AuthResponse> {
    const { data } = await api.post<AuthResponse>('/auth/google', { token: credential });
    this.setTokenState(data);
    return data;
  },

  async forgotPassword(email: string): Promise<{ message: string }> {
    const { data } = await api.post<{ message: string }>('/auth/forgot-password', { email });
    return data;
  },

  async verifyEmail(token: string): Promise<{ message: string }> {
    const { data } = await api.post<{ message: string }>('/auth/verify-email', { token });
    return data;
  },

  async getCurrentUser(): Promise<UserProfile> {
    const { data } = await api.get<UserProfile>('/auth/me');
    return data;
  },

  async updateProfile(payload: Record<string, any>): Promise<UserProfile> {
    const { data } = await api.put<UserProfile>('/auth/profile', payload);
    return data;
  },

  async changePassword(payload: Record<string, any>): Promise<{ message: string }> {
    const { data } = await api.put<{ message: string }>('/auth/change-password', payload);
    return data;
  },

  async logout(): Promise<void> {
    try {
      await api.post('/auth/logout');
    } finally {
      localStorage.removeItem('_nvx_auth_token_');
      localStorage.removeItem('_nvx_refresh_token_');
    }
  },

  setTokenState(data: AuthResponse): void {
    localStorage.setItem('_nvx_auth_token_', data.accessToken);
    localStorage.setItem('_nvx_refresh_token_', data.refreshToken);
  }
};
