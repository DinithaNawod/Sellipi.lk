import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';
import catalog from '../../shared/siteContent.json';
import { fetchSiteContent, type SiteContentData } from '../services/api';

const originals = new Map(catalog.map(field => [field.value, field.key]));
const defaults = new Map(catalog.map(field => [field.key, field.value]));
const Context = createContext({ t: (text: string) => text, value: (key: string) => defaults.get(key) || '', image: (_key: string, fallback: string) => fallback, refresh: () => Promise.resolve() });
export function SiteContentProvider({ children }: { children: ReactNode }) {
  const [content, setContent] = useState<SiteContentData>({ values: {}, revision: 0 });
  const refresh = useCallback(async () => { try { setContent(await fetchSiteContent()); } catch { /* Bundled content remains available if the API is offline. */ } }, []);
  useEffect(() => { void refresh(); window.addEventListener('focus', refresh); return () => window.removeEventListener('focus', refresh); }, [refresh]);
  const value = (key: string) => content.values[key] ?? defaults.get(key) ?? '';
  const t = (text: string) => { const key = originals.get(text); return key ? value(key) : text; };
  const image = (key: string, fallback: string) => content.values[key] || fallback;
  return <Context.Provider value={{ t, value, image, refresh }}>{children}</Context.Provider>;
}
export const useSiteContent = () => useContext(Context);
