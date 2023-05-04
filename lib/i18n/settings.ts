import { getURL } from '../utils';
import type { Dictionary } from './types';

export const fallbackLang = 'en';
export const languages = [fallbackLang, 'de', 'fr', 'es', 'ru'];
export const loadDictionary = async (language: string) => {
  const lang = languages.includes(language) ? language : fallbackLang;
  const result = await import(`#/lib/i18n/dictionaries/${lang}.json`);
  return (result.default ?? result) as Promise<Dictionary>;
};
export const labels: {
  [language: string]: string;
} = {
  en: 'English',
  de: 'Deutsch',
  fr: 'Français',
  es: 'Español',
  ru: 'Русский',
};

export function getAlternates(pathname = '') {
  return languages.reduce((acc, lang) => {
    acc[lang] = getURL(`/${lang}${pathname}`);
    return acc;
  }, {} as Record<string, string>);
}

export function getDateLocale(language: string) {
  switch (language) {
    case 'de':
      return import('date-fns/locale/de').then((result) => result.default);
    case 'fr':
      return import('date-fns/locale/fr').then((result) => result.default);
    case 'es':
      return import('date-fns/locale/es').then((result) => result.default);
    case 'ru':
      return import('date-fns/locale/ru').then((result) => result.default);
    default:
      return import('date-fns/locale/en-US').then((result) => result.default);
  }
}
