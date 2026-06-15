import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import { resources } from './locales/index';


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
