const fs = require('fs');
const path = require('path');
const https = require('https');

const localesDir = path.resolve(__dirname, '../src/lib/locales');
const enDir = path.join(localesDir, 'en');

const targetLanguages = [
  'es', 'fr', 'de', 'pt', 'it', 'nl', 'pl', 'ru', 'uk',
  'ar', 'hi', 'bn', 'ur', 'ta', 'te',
  'zh-Hans', 'zh-Hant', 'ja', 'ko', 'id', 'ms', 'vi', 'th', 'tl',
  'tr', 'cs', 'ro', 'hu', 'el', 'sv', 'no', 'da', 'fi', 'he'
];

function translateTextSingle(text, targetLang) {
  return new Promise((resolve) => {
    if (!text || text.trim() === '') {
      resolve(text);
      return;
    }
    
    let googleLang = targetLang;
    if (targetLang === 'zh-Hans') googleLang = 'zh-CN';
    if (targetLang === 'zh-Hant') googleLang = 'zh-TW';
    if (targetLang === 'no') googleLang = 'no';

    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=${googleLang}&dt=t&q=${encodeURIComponent(text)}`;

    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          if (parsed && parsed[0]) {
            let translated = parsed[0].map(part => part[0]).join('');
            // Clean common html entity encodings
            translated = translated
              .replace(/&#39;/g, "'")
              .replace(/&quot;/g, '"')
              .replace(/&amp;/g, '&')
              .replace(/&lt;/g, '<')
              .replace(/&gt;/g, '>');
            resolve(translated);
          } else {
            resolve(text);
          }
        } catch (e) {
          resolve(text);
        }
      });
    }).on('error', () => {
      resolve(text);
    });
  });
}

async function translateBatch(texts, targetLang) {
  if (texts.length === 0) return [];
  const joined = texts.join('\n');
  const translatedJoined = await translateTextSingle(joined, targetLang);
  const lines = translatedJoined.split('\n').map(l => l.trim());
  if (lines.length === texts.length) {
    return lines;
  }
  // Fallback to individual
  const results = [];
  for (const text of texts) {
    results.push(await translateTextSingle(text, targetLang));
    await new Promise(r => setTimeout(r, 20)); // tiny delay
  }
  return results;
}

// Flatten JSON
function flattenObject(obj, prefix = '', res = {}) {
  for (const key of Object.keys(obj)) {
    const propName = prefix ? `${prefix}.${key}` : key;
    if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
      flattenObject(obj[key], propName, res);
    } else {
      res[propName] = obj[key];
    }
  }
  return res;
}

// Unflatten JSON
function unflattenObject(data) {
  const result = {};
  for (const key of Object.keys(data)) {
    const parts = key.split('.');
    let current = result;
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      if (i === parts.length - 1) {
        current[part] = data[key];
      } else {
        current[part] = current[part] || {};
        current = current[part];
      }
    }
  }
  return result;
}

// Helper to translate array
async function translateArray(arr, existingArr, targetLang) {
  const results = [];
  for (let i = 0; i < arr.length; i++) {
    const item = arr[i];
    const existingItem = existingArr && existingArr[i];
    if (existingItem && existingItem !== '' && existingItem !== item) {
      results.push(existingItem);
    } else if (typeof item === 'string') {
      results.push(await translateTextSingle(item, targetLang));
    } else if (typeof item === 'object' && item !== null) {
      results.push(await translateObjectHelper(item, existingItem || {}, targetLang));
    } else {
      results.push(item);
    }
  }
  return results;
}

async function translateObjectHelper(enObj, existingObj, targetLang) {
  const flatEn = flattenObject(enObj);
  const flatExisting = flattenObject(existingObj || {});
  
  const keysToTranslate = [];
  const enValuesToTranslate = [];
  
  for (const key of Object.keys(flatEn)) {
    const enVal = flatEn[key];
    if (typeof enVal === 'string') {
      const existVal = flatExisting[key];
      if (!existVal || existVal === '' || existVal === enVal) {
        keysToTranslate.push(key);
        enValuesToTranslate.push(enVal);
      }
    }
  }
  
  if (keysToTranslate.length > 0) {
    const batchSize = 30;
    const translatedValues = [];
    for (let i = 0; i < enValuesToTranslate.length; i += batchSize) {
      const batch = enValuesToTranslate.slice(i, i + batchSize);
      const translated = await translateBatch(batch, targetLang);
      translatedValues.push(...translated);
      await new Promise(r => setTimeout(r, 50));
    }
    
    for (let i = 0; i < keysToTranslate.length; i++) {
      flatExisting[keysToTranslate[i]] = translatedValues[i];
    }
  }
  
  const result = unflattenObject(flatExisting);
  
  for (const key of Object.keys(enObj)) {
    if (Array.isArray(enObj[key])) {
      result[key] = await translateArray(enObj[key], existingObj ? existingObj[key] : null, targetLang);
    }
  }
  
  return result;
}

async function run() {
  const enFiles = fs.readdirSync(enDir).filter(f => f.endsWith('.json'));
  
  for (const file of enFiles) {
    const enPath = path.join(enDir, file);
    const enData = JSON.parse(fs.readFileSync(enPath, 'utf8'));
    
    console.log(`\n===================================`);
    console.log(`Processing File: ${file}`);
    console.log(`===================================`);
    
    await Promise.all(targetLanguages.map(async (lang) => {
      const langDir = path.join(localesDir, lang);
      if (!fs.existsSync(langDir)) {
        fs.mkdirSync(langDir, { recursive: true });
      }
      
      const langPath = path.join(langDir, file);
      const existingData = fs.existsSync(langPath)
        ? JSON.parse(fs.readFileSync(langPath, 'utf8'))
        : {};
        
      const translated = await translateObjectHelper(enData, existingData, lang);
      fs.writeFileSync(langPath, JSON.stringify(translated, null, 2), 'utf8');
      console.log(`  ✓ Saved ${lang}/${file}`);
    }));
  }
  
  console.log('\n✅ All translations completed successfully!');
}

run().catch(console.error);
