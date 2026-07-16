// 生产环境使用远程后端，开发环境使用本地代理
const API_BASE = import.meta.env.VITE_API_URL || '/api';

class ApiClient {
  private token: string | null = null;

  setToken(token: string | null) {
    this.token = token;
    if (token) {
      localStorage.setItem('token', token);
    } else {
      localStorage.removeItem('token');
    }
  }

  getToken(): string | null {
    if (!this.token) {
      this.token = localStorage.getItem('token');
    }
    return this.token;
  }

  private async request(path: string, options: RequestInit = {}): Promise<Response> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string> || {}),
    };

    const token = this.getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers,
    });

    if (response.status === 401) {
      this.setToken(null);
      window.location.href = '/ai-platform/login';
      throw new Error('认证已过期，请重新登录');
    }

    return response;
  }

  async get(path: string) {
    const response = await this.request(path);
    if (!response.ok) {
      const err = await response.json().catch(() => ({ detail: '请求失败' }));
      throw new Error(err.detail || '请求失败');
    }
    return response.json();
  }

  async post(path: string, data?: unknown) {
    const response = await this.request(path, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({ detail: '请求失败' }));
      throw new Error(err.detail || '请求失败');
    }
    return response.json();
  }

  async put(path: string, data?: unknown) {
    const response = await this.request(path, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({ detail: '请求失败' }));
      throw new Error(err.detail || '请求失败');
    }
    return response.json();
  }

  async delete(path: string) {
    const response = await this.request(path, { method: 'DELETE' });
    if (!response.ok) {
      const err = await response.json().catch(() => ({ detail: '请求失败' }));
      throw new Error(err.detail || '请求失败');
    }
    return response.json();
  }

  async streamChat(
    path: string,
    data: unknown,
    onMessage: (chunk: string) => void,
    onDone: (convId: string) => void,
    onError: (error: string) => void,
  ): Promise<void> {
    const token = this.getToken();
    const response = await fetch(`${API_BASE}${path}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({ detail: '请求失败' }));
      onError(err.detail || '请求失败');
      return;
    }

    const reader = response.body?.getReader();
    if (!reader) {
      onError('无法读取响应流');
      return;
    }

    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          try {
            const parsed = JSON.parse(line.slice(6));
            if (parsed.content) {
              onMessage(parsed.content);
            }
            if (parsed.conversation_id && line.includes('"done"')) {
              onDone(parsed.conversation_id);
            }
          } catch {
            // 非JSON行，跳过
          }
        }
      }
    }
  }
}

export const api = new ApiClient();
