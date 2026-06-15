module.exports = {
  contextSeparator: '_',
  // Key separator used in your translation keys
  keySeparator: '.',
  // Namespace separator used in your translation keys
  // If you want to separate languages into different files, you should use namespaces.
  nsSeparator: ':',
  
  // Array of languages to generate
  locales: ['en', 'es', 'fr', 'de', 'pt', 'ru', 'zh-Hans', 'zh-Hant', 'ja', 'ko', 'ar', 'hi', 'bn', 'id', 'tr', 'vi', 'it', 'pl', 'th', 'tl', 'nl', 'sv', 'no', 'da', 'fi', 'cs', 'el', 'ro', 'hu', 'uk', 'he', 'ms', 'ta', 'te', 'ur'],
  
  // Default language
  defaultNamespace: 'common',
  defaultValue: (lng, ns, key) => {
    if (lng === 'en') {
      return key;
    }
    return '';
  },

  // Output path for the generated files
  // {{lng}} for language, {{ns}} for namespace
  // This will be overridden by the script to point to the module's i18n folder
  outputPath: 'src/app/components/Others/{{ns}}/i18n/{{lng}}.json',

  // Input files to scan
  // This will also be overridden by the script
  input: ['src/**/*.{js,jsx,ts,tsx}'],

  // Whether to keep keys that are no longer present in the code
  keepRemoved: false,

  // Whether to sort the keys alphabetically
  sort: true,

  // Whether to use a custom function for translation
  // If you use a custom function name like `i18n.t`, you can specify it here
  lexers: {
    ts: ['JsxLexer'],
    tsx: ['JsxLexer'],
    js: ['JsxLexer'],
    jsx: ['JsxLexer'],
    default: ['JsxLexer'],
  },
};
