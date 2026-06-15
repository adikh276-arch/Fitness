/**
 * bulk-translate.cjs
 * 
 * Reads all JSON files under src/lib/locales/en/
 * and generates translated versions for all target languages.
 * Writes output to src/lib/locales/<lang>/<file>.json
 * Skips keys that already have translations.
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
require('dotenv').config();

const API_KEY = process.env.GOOGLE_TRANSLATE_API_KEY;
if (!API_KEY) {
  console.error('GOOGLE_TRANSLATE_API_KEY not found in .env');
  process.exit(1);
}

const localesDir = path.resolve(__dirname, '../src/lib/locales');
const enDir = path.join(localesDir, 'en');

// Target languages to translate to
const targetLanguages = [
  'es', 'fr', 'de', 'pt', 'it', 'nl', 'pl', 'ru', 'uk',
  'ar', 'hi', 'bn', 'ur', 'ta', 'te',
  'zh-Hans', 'zh-Hant', 'ja', 'ko', 'id', 'ms', 'vi', 'th', 'tl',
  'tr', 'cs', 'ro', 'hu', 'el', 'sv', 'no', 'da', 'fi', 'he'
];

// Translate text via Google Translate REST API
function translateText(text, targetLang) {
  return new Promise((resolve, reject) => {
    if (!text || text.trim() === '') {
      resolve(text);
      return;
    }

    // Map zh-Hans/zh-Hant to Google's codes
    let googleLang = targetLang;
    if (targetLang === 'zh-Hans') googleLang = 'zh-CN';
    if (targetLang === 'zh-Hant') googleLang = 'zh-TW';
    if (targetLang === 'no') googleLang = 'no';

    const body = JSON.stringify({
      q: text,
      target: googleLang,
      format: 'text'
    });

    const options = {
      hostname: 'translation.googleapis.com',
      path: `/language/translate/v2?key=${API_KEY}`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body)
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          if (parsed.data && parsed.data.translations && parsed.data.translations[0]) {
            let translated = parsed.data.translations[0].translatedText;
            // Decode HTML entities
            translated = translated
              .replace(/&#39;/g, "'")
              .replace(/&quot;/g, '"')
              .replace(/&amp;/g, '&')
              .replace(/&lt;/g, '<')
              .replace(/&gt;/g, '>');
            resolve(translated);
          } else {
            console.error('Unexpected response:', data);
            resolve(text); // fallback to original
          }
        } catch (e) {
          console.error('Parse error:', e.message);
          resolve(text);
        }
      });
    });

    req.on('error', (e) => {
      console.error('Request error:', e.message);
      resolve(text);
    });

    req.write(body);
    req.end();
  });
}

// Recursively translate all string values in an object
async function translateObject(enObj, existingObj, targetLang, path = '') {
  const result = { ...existingObj };
  
  for (const key of Object.keys(enObj)) {
    const currentPath = path ? `${path}.${key}` : key;
    const enValue = enObj[key];
    const existingValue = existingObj[key];

    if (typeof enValue === 'string') {
      // Skip if already translated (non-empty string different from key)
      if (existingValue && existingValue !== '' && existingValue !== enValue) {
        // Already translated, keep it
        continue;
      }
      // Translate
      process.stdout.write(`  Translating [${targetLang}] ${currentPath}... `);
      const translated = await translateText(enValue, targetLang);
      result[key] = translated;
      console.log('done');
    } else if (Array.isArray(enValue)) {
      // Handle arrays
      result[key] = result[key] || [];
      for (let i = 0; i < enValue.length; i++) {
        if (typeof enValue[i] === 'object' && enValue[i] !== null) {
          result[key][i] = await translateObject(enValue[i], result[key][i] || {}, targetLang, `${currentPath}[${i}]`);
        } else if (typeof enValue[i] === 'string') {
          const existing = result[key][i];
          if (!existing || existing === '' || existing === enValue[i]) {
            process.stdout.write(`  Translating [${targetLang}] ${currentPath}[${i}]... `);
            result[key][i] = await translateText(enValue[i], targetLang);
            console.log('done');
          }
        }
      }
    } else if (typeof enValue === 'object' && enValue !== null) {
      result[key] = await translateObject(enValue, existingValue || {}, targetLang, currentPath);
    }
  }

  return result;
}

async function run() {
  if (!fs.existsSync(enDir)) {
    console.error('en/ directory not found:', enDir);
    process.exit(1);
  }

  const files = fs.readdirSync(enDir).filter(f => f.endsWith('.json'));
  console.log(`Found ${files.length} locale files to translate: ${files.join(', ')}\n`);

  // Get specific file from args if provided
  const targetFile = process.argv[2]; // e.g., "IntermittentFasting.json"

  for (const file of files) {
    if (targetFile && file !== targetFile) continue;

    const enPath = path.join(enDir, file);
    const enData = JSON.parse(fs.readFileSync(enPath, 'utf8'));

    console.log(`\n=== Translating: ${file} ===`);

    for (const lang of targetLanguages) {
      const langDir = path.join(localesDir, lang);
      if (!fs.existsSync(langDir)) {
        fs.mkdirSync(langDir, { recursive: true });
      }

      const langPath = path.join(langDir, file);
      const existingData = fs.existsSync(langPath)
        ? JSON.parse(fs.readFileSync(langPath, 'utf8'))
        : {};

      console.log(`\n[${lang}] ${file}:`);
      const translated = await translateObject(enData, existingData, lang);
      fs.writeFileSync(langPath, JSON.stringify(translated, null, 2), 'utf8');
      console.log(`  ✓ Saved ${lang}/${file}`);
    }
  }

  console.log('\n✅ All translations complete!');
}

run().catch(console.error);
