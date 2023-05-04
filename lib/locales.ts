import locales from './data/locales.json' assert { type: 'json' };

export const getLocales = ({
  keys,
  language,
}: {
  keys: string[];
  language: string;
}): Locale[] => {
  return locales.filter(
    (locale) => locale.language === language && keys.includes(locale.key),
  );
};

export type Locale = (typeof locales)[number];
