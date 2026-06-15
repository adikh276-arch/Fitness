/**
 * auto-translate.cjs
 * 
 * Uses Google Translate API (if key present) or falls back to LibreTranslate.
 * 
 * Usage: node scripts/auto-translate.cjs [filename.json] [lang]
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const dotenv = require('dotenv');

dotenv.config();

const localesDir = path.resolve(__dirname, '../src/lib/locales');
const enDir = path.join(localesDir, 'en');
const API_KEY = process.env.GOOGLE_TRANSLATE_API_KEY;

// Free LibreTranslate instances (fallback)
const LIBRE_TRANSLATE_INSTANCES = [
  { host: 'translate.argosopentech.com', port: 443, protocol: https },
  { host: 'libretranslate.de', port: 443, protocol: https },
];

let instanceIndex = 0;

function translateGoogle(text, targetLang) {
  return new Promise((resolve) => {
    const body = JSON.stringify({
      q: text,
      target: targetLang,
      source: 'en',
      format: 'text'
    });

    const options = {
      hostname: 'translation.googleapis.com',
      port: 443,
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
            resolve(parsed.data.translations[0].translatedText);
          } else {
            console.log('Google Error:', data);
            resolve(null);
          }
        } catch (e) {
          resolve(null);
        }
      });
    });

    req.on('error', () => resolve(null));
    req.write(body);
    req.end();
  });
}

function translateLibre(text, targetLang) {
  return new Promise((resolve) => {
    const langMap = { 'zh-Hans': 'zh', 'zh-Hant': 'zh', 'no': 'nb' };
    const lt = langMap[targetLang] || targetLang;
    const instance = LIBRE_TRANSLATE_INSTANCES[instanceIndex % LIBRE_TRANSLATE_INSTANCES.length];
    
    const body = JSON.stringify({ q: text, source: 'en', target: lt, format: 'text' });
    const options = {
      hostname: instance.host,
      port: instance.port,
      path: '/translate',
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) },
      timeout: 10000
    };

    const req = instance.protocol.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          if (parsed.translatedText) resolve(parsed.translatedText);
          else { instanceIndex++; resolve(text); }
        } catch (e) { resolve(text); }
      });
    });
    req.on('error', () => { instanceIndex++; resolve(text); });
    req.write(body);
    req.end();
  });
}

async function translateText(text, targetLang) {
  if (!text || text.trim() === '') return text;
  
  if (API_KEY) {
    const result = await translateGoogle(text, targetLang);
    if (result) return result;
  }
  
  return translateLibre(text, targetLang);
}

async function translateObject(enObj, existingObj, targetLang, pathStr = '') {
  const result = { ...existingObj };
  
  for (const key of Object.keys(enObj)) {
    const currentPath = pathStr ? `${pathStr}.${key}` : key;
    const enValue = enObj[key];
    const existingValue = existingObj ? existingObj[key] : undefined;

    if (typeof enValue === 'string') {
      if (existingValue && existingValue !== '' && existingValue !== enValue) {
        continue;
      }
      process.stdout.write(`  [${targetLang}] ${currentPath}... `);
      const translated = await translateText(enValue, targetLang);
      result[key] = translated;
      console.log(translated === enValue ? '(untranslated)' : 'ok');
    } else if (Array.isArray(enValue)) {
      result[key] = Array.isArray(result[key]) ? result[key] : [];
      for (let i = 0; i < enValue.length; i++) {
        if (typeof enValue[i] === 'object' && enValue[i] !== null) {
          result[key][i] = await translateObject(enValue[i], result[key][i] || {}, targetLang, `${currentPath}[${i}]`);
        } else if (typeof enValue[i] === 'string') {
          const existing = result[key][i];
          if (!existing || existing === '' || existing === enValue[i]) {
            process.stdout.write(`  [${targetLang}] ${currentPath}[${i}]... `);
            result[key][i] = await translateText(enValue[i], targetLang);
            console.log('ok');
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
  const targetFile = process.argv[2];
  const targetLangs = process.argv[3] ? [process.argv[3]] : ['es', 'fr', 'de', 'it', 'pt', 'hi', 'ar', 'ru', 'ja', 'ko'];

  const files = targetFile && targetFile !== 'all'
    ? [targetFile.endsWith('.json') ? targetFile : `${targetFile}.json`]
    : fs.readdirSync(enDir).filter(f => f.endsWith('.json'));

  for (const file of files) {
    const enPath = path.join(enDir, file);
    if (!fs.existsSync(enPath)) {
      console.error(`File not found: ${enPath}`);
      continue;
    }
    const enData = JSON.parse(fs.readFileSync(enPath, 'utf8'));

    for (const lang of targetLangs) {
      const langDir = path.join(localesDir, lang);
      if (!fs.existsSync(langDir)) fs.mkdirSync(langDir, { recursive: true });
      const langPath = path.join(langDir, file);
      const existing = fs.existsSync(langPath) ? JSON.parse(fs.readFileSync(langPath, 'utf8')) : {};
      
      console.log(`\n=== ${file} -> ${lang} ===`);
      const translated = await translateObject(enData, existing, lang);
      fs.writeFileSync(langPath, JSON.stringify(translated, null, 2), 'utf8');
      console.log(`✓ Saved ${lang}/${file}`);
    }
  }
  console.log('\n✅ Done!');
}

run().catch(console.error);
