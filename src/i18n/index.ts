import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { getLocales } from 'expo-localization';
import pt from './locales/pt';

const resources = {
  pt: { translation: pt },
};

const deviceLang = getLocales()[0]?.languageCode ?? 'pt';
const supportedLangs = Object.keys(resources);
const lng = supportedLangs.includes(deviceLang) ? deviceLang : 'pt';

i18n.use(initReactI18next).init({
  resources,
  lng,
  fallbackLng: 'pt',
  interpolation: {
    escapeValue: false,
  },
});

export default i18n;
