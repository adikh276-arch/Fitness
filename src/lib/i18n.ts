import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// ─────────────────────────────────────────────────────────────────────────────
// Synchronous Resource Loader using Vite's Glob Import
// This bundles all locale JSON files into the app for zero-latency switching.
// ─────────────────────────────────────────────────────────────────────────────
const localeModules = import.meta.glob('./locales/**/*.json', { eager: true });

const resources: any = {};

Object.entries(localeModules).forEach(([path, module]: [string, any]) => {
  // Path format: ./locales/en/common.json
  const parts = path.split('/');
  const lang = parts[2];
  const namespace = parts[3].replace('.json', '');

  if (!resources[lang]) {
    resources[lang] = {};
  }
  resources[lang][namespace] = module.default || module;
});

// Detect language from URL ?lang= param first, then browser preference.
function detectLang(): string {
  if (typeof window === 'undefined') return 'en';
  const params = new URLSearchParams(window.location.search);
  const urlLang = params.get('lang');
  if (urlLang) return urlLang;
  return navigator.language?.split('-')[0] ?? 'en';
}

const lng = detectLang();

i18n
  .use(initReactI18next)
  .init({
    lng,
    fallbackLng: 'en',
    debug: false,
    interpolation: {
      escapeValue: false,
    },
    resources,
    // Automatically detect namespaces from the loaded resources
    ns: Object.keys(resources.en || {}),
    defaultNS: 'common',
  });

export default i18n;
