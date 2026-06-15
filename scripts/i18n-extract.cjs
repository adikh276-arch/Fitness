const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const modulePath = process.argv[2];

if (!modulePath) {
  console.error('Please provide a module path. Example: src/app/components/Others/FoodDiary');
  process.exit(1);
}

const fullPath = path.resolve(modulePath);
if (!fs.existsSync(fullPath)) {
  console.error(`Path not found: ${fullPath}`);
  process.exit(1);
}

const moduleName = path.basename(fullPath);
console.log(`Extracting translations for module: ${moduleName}`);

// We'll create a temporary config for this run to set the correct input and output
const configPath = path.resolve('i18next-parser.config.cjs');
const outputPath = path.join(fullPath, 'i18n/$LOCALE.json');
const inputPath = path.join(modulePath, '**/*.{js,jsx,ts,tsx}');

try {
  // Run i18next-parser
  const command = `npx i18next-parser "${inputPath}" --config "${configPath}" --output "${outputPath}"`;

  console.log(`Running: ${command}`);
  execSync(command, { stdio: 'inherit' });
  console.log('Extraction complete!');
} catch (error) {
  console.error('Extraction failed:', error.message);
  process.exit(1);
}
