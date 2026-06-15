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

// Recursively get all paths to string values
function getStringPaths(obj, currentPath = [], result = []) {
  if (typeof obj === 'string') {
    result.push({ path: currentPath, value: obj });
  } else if (Array.isArray(obj)) {
    for (let i = 0; i < obj.length; i++) {
      getStringPaths(obj[i], [...currentPath, i], result);
    }
  } else if (typeof obj === 'object' && obj !== null) {
    for (const key of Object.keys(obj)) {
      getStringPaths(obj[key], [...currentPath, key], result);
    }
  }
  return result;
}

// Helper to set a value at a given path in an object
function setValueAtPath(obj, path, value) {
  let current = obj;
  for (let i = 0; i < path.length - 1; i++) {
    const key = path[i];
    const nextKey = path[i + 1];
    if (current[key] === undefined) {
      current[key] = typeof nextKey === 'number' ? [] : {};
    }
    current = current[key];
  }
  const lastKey = path[path.length - 1];
  current[lastKey] = value;
}

// Helper to get a value at a given path in an object
function getValueAtPath(obj, path) {
  let current = obj;
  for (const key of path) {
    if (current === undefined || current === null) return undefined;
    current = current[key];
  }
  return current;
}

async function translateObjectHelper(enObj, existingObj, targetLang) {
  const result = JSON.parse(JSON.stringify(enObj));
  const stringPaths = getStringPaths(enObj);
  
  const pathsToTranslate = [];
  const valuesToTranslate = [];
  
  for (const { path, value } of stringPaths) {
    const existVal = getValueAtPath(existingObj || {}, path);
    if (typeof existVal === 'string' && existVal.trim() !== '' && existVal !== value) {
      setValueAtPath(result, path, existVal);
    } else {
      pathsToTranslate.push(path);
      valuesToTranslate.push(value);
    }
  }
  
  if (pathsToTranslate.length > 0) {
    const batchSize = 30;
    const translatedValues = [];
    for (let i = 0; i < valuesToTranslate.length; i += batchSize) {
      const batch = valuesToTranslate.slice(i, i + batchSize);
      const translated = await translateBatch(batch, targetLang);
      translatedValues.push(...translated);
      await new Promise(r => setTimeout(r, 50));
    }
    
    for (let i = 0; i < pathsToTranslate.length; i++) {
      setValueAtPath(result, pathsToTranslate[i], translatedValues[i]);
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
