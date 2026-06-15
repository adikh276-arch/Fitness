import { Project, SyntaxKind } from 'ts-morph';
import fs from 'fs';
import path from 'path';

const TARGET_FILES = [
  { path: 'src/app/components/Others/DailySugarEase/DailySugarEaseExercise.tsx', namespace: 'DailySugarEase' },
  { path: 'src/app/components/Others/DailySugarEase/FeedbackScreen.tsx', namespace: 'DailySugarEase' },
  { path: 'src/app/components/Others/DailySugarEase/FoodLoggingScreen.tsx', namespace: 'DailySugarEase' },
  { path: 'src/app/components/Others/DailySugarEase/HistorySheet.tsx', namespace: 'DailySugarEase' },
  { path: 'src/app/components/Others/DailySugarEase/StartScreen.tsx', namespace: 'DailySugarEase' },
  { path: 'src/app/components/Others/DailySugarEase/SummaryScreen.tsx', namespace: 'DailySugarEase' },
  { path: 'src/app/components/Others/HealthyRecipeLog/HealthyRecipeLogExercise.tsx', namespace: 'HealthyRecipeLog' },
  { path: 'src/app/components/Others/HealthyRecipeLog/HistoryDrawer.tsx', namespace: 'HealthyRecipeLog' },
  { path: 'src/app/components/Others/HealthyRecipeLog/NavLink.tsx', namespace: 'HealthyRecipeLog' },
  { path: 'src/app/components/Others/HealthyRecipeLog/ProgressBar.tsx', namespace: 'HealthyRecipeLog' },
  { path: 'src/app/components/Others/HealthyRecipeLog/Screen1Welcome.tsx', namespace: 'HealthyRecipeLog' },
  { path: 'src/app/components/Others/HealthyRecipeLog/Screen2Recipe.tsx', namespace: 'HealthyRecipeLog' },
  { path: 'src/app/components/Others/HealthyRecipeLog/Screen3Rating.tsx', namespace: 'HealthyRecipeLog' },
  { path: 'src/app/components/Others/HealthyRecipeLog/Screen4Done.tsx', namespace: 'HealthyRecipeLog' },
  { path: 'src/app/components/Others/HealthyRecipeLog/ScreenClosing.tsx', namespace: 'HealthyRecipeLog' }
];

const project = new Project({
  tsConfigFilePath: 'tsconfig.json'
});

function generateKey(text) {
  return text.trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .substring(0, 40) || 'empty_key';
}

async function run() {
  for (const fileDef of TARGET_FILES) {
    console.log(`Processing ${fileDef.path}...`);
    const sourceFile = project.getSourceFileOrThrow(fileDef.path);
    const ns = fileDef.namespace;
    
    const translations = {};
    let keyCounter = {};

    function addTranslation(text) {
      const cleanText = text.replace(/\n\s+/g, ' ').trim();
      if (!cleanText) return null;
      let key = generateKey(cleanText);
      if (key === 'empty_key' || !key) return null;
      
      if (translations[key] && translations[key] !== cleanText) {
        keyCounter[key] = (keyCounter[key] || 1) + 1;
        key = `${key}_${keyCounter[key]}`;
      }
      translations[key] = cleanText;
      return key;
    }

    const jsxTexts = sourceFile.getDescendantsOfKind(SyntaxKind.JsxText).reverse();
    for (const jsxText of jsxTexts) {
      const fullText = jsxText.getText();
      // Remove starting/ending brackets or quotes if it somehow got captured
      const clean = jsxText.getLiteralText().trim();
      
      if (clean && /[a-zA-Z]/.test(clean)) {
        const key = addTranslation(clean);
        if (key) {
           const match = fullText.match(/^(\s*)([\s\S]*?)(\s*)$/);
           const pre = match ? match[1] : '';
           const post = match ? match[3] : '';
           jsxText.replaceWithText(`${pre}{t('${key}')}${post}`);
        }
      }
    }

    const attrs = sourceFile.getDescendantsOfKind(SyntaxKind.JsxAttribute).reverse();
    for (const attr of attrs) {
      let name;
      try {
        name = attr.getNameNode().getText();
      } catch (e) { continue; }
      
      if (['placeholder', 'title', 'alt', 'label'].includes(name)) {
        const initializer = attr.getInitializer();
        if (initializer && initializer.getKind() === SyntaxKind.StringLiteral) {
          const text = initializer.getLiteralValue();
          if (text && /[a-zA-Z]/.test(text)) {
            const key = addTranslation(text);
            if (key) {
              attr.setInitializer(`{t('${key}')}`);
            }
          }
        }
      }
    }

    const hasImport = sourceFile.getImportDeclaration(decl => decl.getModuleSpecifierValue() === 'react-i18next');
    if (!hasImport) {
      sourceFile.addImportDeclaration({
        namedImports: ['useTranslation'],
        moduleSpecifier: 'react-i18next'
      });
    }

    let mainComponent = sourceFile.getFunction(func => func.isDefaultExport());
    if (!mainComponent) {
      const defaultExport = sourceFile.getExportAssignment(exp => !exp.isExportEquals());
      if (defaultExport) {
        const expName = defaultExport.getExpression().getText();
        mainComponent = sourceFile.getFunction(expName) || sourceFile.getVariableDeclaration(expName)?.getInitializerIfKind(SyntaxKind.ArrowFunction) || sourceFile.getVariableDeclaration(expName)?.getInitializerIfKind(SyntaxKind.FunctionExpression);
      }
    }
    
    if (mainComponent) {
      const body = mainComponent.getBody();
      if (body && body.getKind() === SyntaxKind.Block) {
        const hasT = body.getVariableStatements().some(stmt => stmt.getText().includes('useTranslation'));
        if (!hasT) {
          body.insertStatements(0, `const { t } = useTranslation('${ns}');`);
        }
      }
    } else {
       console.log("Could not find main component for", ns);
    }

    await sourceFile.save();

    const localesDir = path.join(process.cwd(), 'src/lib/locales/en');
    if (!fs.existsSync(localesDir)) fs.mkdirSync(localesDir, { recursive: true });
    
    const jsonPath = path.join(localesDir, `${ns}.json`);
    let existingData = {};
    if (fs.existsSync(jsonPath)) {
      existingData = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
    }
    const mergedData = { ...existingData, ...translations };
    fs.writeFileSync(jsonPath, JSON.stringify(mergedData, null, 2));

    console.log(`Saved ${Object.keys(translations).length} keys for ${ns}`);
  }
}

run().catch(console.error);
