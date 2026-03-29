import axios from 'axios';

export const api = axios.create({ baseURL: '/api' });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const authApi = {
  async login(email: string, password: string) {
    const res = await api.post<{
      token: string;
      user: { id: number; email: string; name: string; role: string };
    }>('/auth/login', { email, password });
    return res.data;
  },

  async me(token: string) {
    const res = await api.get<{ id: number; email: string; name: string; role: string }>(
      '/auth/me',
      { headers: { Authorization: `Bearer ${token}` } },
    );
    return res.data;
  },

  async logout() {
    await api.post('/auth/logout');
  },
};

export const marketApi = {
  async getSummary() {
    const res = await api.get('/market/summary');
    return res.data as {
      areaBreakdown: Array<{ area: string; avg_price_sqft: number; total_transactions: number; total_volume: number }>;
      dailyTotals: Array<{ date: string; total_transactions: number; avg_price_sqft: number; total_volume: number }>;
    };
  },

  async getLeads() {
    const res = await api.get('/market/leads');
    return res.data as Array<{
      id: number; name: string; email: string; budget: number; interest: string; status: string;
    }>;
  },
};

export const newsApi = {
  async getArticles() {
    const res = await api.get<Array<{
      id: number;
      title: string;
      summary: string | null;
      link: string | null;
      source: string;
      published_at: string | null;
      fetched_at: string;
    }>>('/news');
    return res.data;
  },

  async getSummary() {
    const res = await api.get<{
      id: number;
      article_count: number;
      generated_at: string;
      payload: {
        summaryEn: string[];
        summaryTr: string[];
        sentiment: 'HOT' | 'NEUTRAL' | 'CAUTIOUS';
        pitchEn: string;
        pitchTr: string;
        trendingAreas: string[];
      };
    } | null>('/news/summary');
    return res.data;
  },
};
