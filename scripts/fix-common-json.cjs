const fs = require('fs');
const path = require('path');

const localesDir = path.resolve(__dirname, '../public/locales');
if (!fs.existsSync(localesDir)) {
  console.error('Locales directory not found');
  process.exit(1);
}

const languages = fs.readdirSync(localesDir).filter(f => {
  const fullPath = path.join(localesDir, f);
  return fs.statSync(fullPath).isDirectory() && f !== '{{lng}}';
});

languages.forEach(lang => {
  const commonPath = path.join(localesDir, lang, 'common.json');
  if (!fs.existsSync(commonPath)) {
    fs.writeFileSync(commonPath, '{}', 'utf8');
    console.log(`Created common.json for ${lang}`);
  }
});
