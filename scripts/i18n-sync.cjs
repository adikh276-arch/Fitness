const fs = require('fs');
const path = require('path');

const publicLocalesDir = path.resolve('public/locales');

// Ensure public/locales exists
if (!fs.existsSync(publicLocalesDir)) {
  fs.mkdirSync(publicLocalesDir, { recursive: true });
}

// Find all i18n folders in components/Others
const othersDir = path.resolve('src/app/components/Others');
const modules = fs.readdirSync(othersDir).filter(f => {
  return fs.statSync(path.join(othersDir, f)).isDirectory() && fs.existsSync(path.join(othersDir, f, 'i18n'));
});

console.log(`Syncing locales for ${modules.length} modules...`);

modules.forEach(moduleName => {
  const sourceI18nDir = path.join(othersDir, moduleName, 'i18n');
  const languages = fs.readdirSync(sourceI18nDir).filter(f => f.endsWith('.json'));

  languages.forEach(langFile => {
    const lang = langFile.replace('.json', '');
    const destLangDir = path.join(publicLocalesDir, lang);

    if (!fs.existsSync(destLangDir)) {
      fs.mkdirSync(destLangDir, { recursive: true });
    }

    const sourcePath = path.join(sourceI18nDir, langFile);
    const destPath = path.join(destLangDir, `${moduleName}.json`);

    fs.copyFileSync(sourcePath, destPath);
  });
  console.log(`  [OK] ${moduleName}`);
});

console.log('Sync complete!');
