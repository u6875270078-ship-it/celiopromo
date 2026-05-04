const NATIVE_API_BASE = 'https://celiopromo.it';

const isNative = (): boolean => {
  if (typeof window === 'undefined') return false;
  const w = window as any;
  if (w.Capacitor?.isNativePlatform?.()) return true;
  if (w.Capacitor?.getPlatform && w.Capacitor.getPlatform() !== 'web') return true;
  const proto = window.location?.protocol;
  return proto === 'capacitor:';
};

export const API_BASE: string = isNative() ? NATIVE_API_BASE : '';

export const apiUrl = (path: string): string => {
  if (!API_BASE) return path;
  if (/^https?:\/\//i.test(path)) return path;
  return API_BASE + (path.startsWith('/') ? path : `/${path}`);
};

let installed = false;
export const installFetchInterceptor = (): void => {
  if (installed || !API_BASE || typeof window === 'undefined') return;
  installed = true;

  const originalFetch = window.fetch.bind(window);
  window.fetch = (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    if (typeof input === 'string') {
      if (input.startsWith('/api')) {
        return originalFetch(API_BASE + input, { credentials: 'include', ...init });
      }
    } else if (input instanceof URL) {
      if (input.pathname.startsWith('/api') && (input.origin === window.location.origin || input.host === 'localhost')) {
        return originalFetch(API_BASE + input.pathname + input.search, { credentials: 'include', ...init });
      }
    } else if (input instanceof Request) {
      const url = input.url;
      try {
        const u = new URL(url);
        if (u.pathname.startsWith('/api') && (u.origin === window.location.origin || u.host === 'localhost')) {
          const rewritten = new Request(API_BASE + u.pathname + u.search, input);
          return originalFetch(rewritten, { credentials: 'include', ...init });
        }
      } catch {
      }
    }
    return originalFetch(input as any, init);
  };
};
