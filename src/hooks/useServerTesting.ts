import { useState, useCallback } from 'react';
import { WebpipeInstance, buildServerUrlFromInstance } from '../utils/processUtils';

export const useServerTesting = () => {
  const [serverBaseUrl, setServerBaseUrl] = useState<string>('');
  const [routeTestInputs, setRouteTestInputs] = useState<Record<string, string>>({});
  const [lastResponse, setLastResponse] = useState<any>(null);

  const normalizeBaseUrl = useCallback((base: string): string => {
    if (!base) return '';
    let normalized = base.trim();
    if (!/^https?:\/\//i.test(normalized)) {
      normalized = `http://${normalized}`;
    }
    normalized = normalized.replace(/\/$/, '');
    return normalized;
  }, []);

  const buildRouteUrl = useCallback((baseUrl: string, routePath: string, override?: string): string | null => {
    if (override && /^https?:\/\//i.test(override.trim())) {
      return override.trim();
    }
    const base = normalizeBaseUrl(baseUrl || '');
    if (!base) return null;
    const path = (override && override.trim()) || routePath || '';
    const withLeading = path.startsWith('/') ? path : `/${path}`;
    return `${base}${withLeading}`;
  }, [normalizeBaseUrl]);

  const setRouteTestInput = useCallback((routeKey: string, value: string) => {
    setRouteTestInputs(prev => ({ ...prev, [routeKey]: value }));
  }, []);

  const testRouteGet = useCallback(async (route: any, overridePathOrUrl?: string) => {
    try {
      const routeKey = `${route.method} ${route.path}`;
      const input = overridePathOrUrl ?? routeTestInputs[routeKey] ?? route.path;
      const url = buildRouteUrl(serverBaseUrl, route.path, input);
      if (!url) {
        setLastResponse({ ok: false, timestamp: Date.now(), error: 'Base URL is not set' });
        return;
      }
      if (window.electronAPI && window.electronAPI.httpGet) {
        const res = await window.electronAPI.httpGet(url);
        setLastResponse({ url, timestamp: Date.now(), ...res });
      } else {
        const r = await fetch(url);
        const text = await r.text();
        let body: any = text;
        try { body = JSON.parse(text); } catch {}
        setLastResponse({
          url,
          timestamp: Date.now(),
          ok: r.ok,
          status: r.status,
          statusText: r.statusText,
          headers: Object.fromEntries(r.headers.entries()),
          body
        });
      }
    } catch (error) {
      setLastResponse({ ok: false, timestamp: Date.now(), error: String(error) });
    }
  }, [serverBaseUrl, routeTestInputs, buildRouteUrl]);

  const handleInstanceSelect = useCallback((instance: WebpipeInstance) => {
    const serverUrl = buildServerUrlFromInstance(instance);
    setServerBaseUrl(serverUrl);
  }, []);

  return {
    serverBaseUrl,
    setServerBaseUrl,
    routeTestInputs,
    setRouteTestInput,
    lastResponse,
    testRouteGet,
    handleInstanceSelect
  };
};