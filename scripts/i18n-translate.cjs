const fs = require('fs');
const path = require('path');
const axios = require('axios');
require('dotenv').config();

const API_KEY = process.env.GOOGLE_TRANSLATE_API_KEY;
const ENDPOINT = 'https://translation.googleapis.com/language/translate/v2';

if (!API_KEY) {
  console.error('GOOGLE_TRANSLATE_API_KEY not found in .env');
  process.exit(1);
}

const modulePath = process.argv[2];
if (!modulePath) {
  console.error('Please provide a module path. Example: src/app/components/Others/FoodDiary');
  process.exit(1);
}

const i18nDir = path.resolve(modulePath, 'i18n');
if (!fs.existsSync(i18nDir)) {
  console.error(`i18n directory not found in: ${modulePath}`);
  process.exit(1);
}

const enPath = path.join(i18nDir, 'en.json');
if (!fs.existsSync(enPath)) {
  console.error(`en.json not found in: ${i18nDir}`);
  process.exit(1);
}

const enData = JSON.parse(fs.readFileSync(enPath, 'utf8'));
const languages = fs.readdirSync(i18nDir)
  .filter(f => f.endsWith('.json') && f !== 'en.json' && f !== '{{lng}}.json')
  .map(f => f.replace('.json', ''));

console.log(`Translating module: ${path.basename(modulePath)}`);
console.log(`Languages to translate: ${languages.join(', ')}`);

async function translateText(text, targetLang) {
  if (!text || text.trim() === '') return '';
  try {
    // Protect interpolation variables like {{count}} or {{name}}
    const protectedText = text.replace(/\{\{(.+?)\}\}/g, '<span class="notranslate">{{$1}}</span>');
    
    const response = await axios.post(`${ENDPOINT}?key=${API_KEY}`, {
      q: protectedText,
      target: targetLang,
      format: 'html'
    });

    let translated = response.data.data.translations[0].translatedText;
    
    translated = translated.replace(/<span class="notranslate">\{\{(.+?)\}\}<\/span>/g, '{{$1}}');
    translated = translated.replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, "&");
    
    return translated;
  } catch (error) {
    console.error(`Translation failed for "${text}" to ${targetLang}:`, error.response?.data || error.message);
    return null;
  }
}

async function translateDeep(enObj, langObj, targetLang) {
  let updated = false;
  for (const key in enObj) {
    if (typeof enObj[key] === 'object' && enObj[key] !== null) {
      if (!langObj[key]) langObj[key] = {};
      const subUpdated = await translateDeep(enObj[key], langObj[key], targetLang);
      if (subUpdated) updated = true;
    } else {
      if (!langObj[key] || langObj[key] === '') {
        const translation = await translateText(enObj[key], targetLang);
        if (translation) {
          langObj[key] = translation;
          updated = true;
          console.log(`    [+] Translated to ${targetLang}: "${key}"`);
        }
      }
    }
  }
  return updated;
}

async function run() {
  for (const lang of languages) {
    const langPath = path.join(i18nDir, `${lang}.json`);
    const langData = JSON.parse(fs.readFileSync(langPath, 'utf8'));

    console.log(`\nProcessing ${lang}...`);

    const updated = await translateDeep(enData, langData, lang);

    if (updated) {
      fs.writeFileSync(langPath, JSON.stringify(langData, null, 2), 'utf8');
      console.log(`  [OK] Saved ${lang}.json`);
    } else {
      console.log(`  [SKIP] No new translations needed for ${lang}`);
    }
  }
  console.log('\nAll translations complete!');
}

run();
