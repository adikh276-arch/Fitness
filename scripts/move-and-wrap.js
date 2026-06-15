import { Project, SyntaxKind } from 'ts-morph';
import fs from 'fs';
import path from 'path';

const TARGETS = [
  { file: 'src/app/components/DiabetesDietGuide.tsx', vars: ['TIMING_OPTIONS', 'PLATE_CONFIG'], namespace: 'DiabetesDiet' },
  { file: 'src/app/components/FlexibilityMobilityGuide.tsx', vars: ['routines', 'mobilityTests', 'focusAreaOptions'], namespace: 'FlexibilityMobility' },
  { file: 'src/app/components/GutHealthGuide.tsx', vars: ['BRISTOL_SCALE_CONFIG', 'SYMPTOMS', 'TRIGGERS', 'PREBIOTICS_IDS', 'PROBIOTICS_IDS', 'PLANT_LIST_IDS'], namespace: 'GutHealth' },
  { file: 'src/app/components/HeartHealthGuide.tsx', vars: ['SNEAKY_SALT_FOODS'], namespace: 'HeartHealth' },
  { file: 'src/app/components/HIITCardioGuide.tsx', vars: ['presetWorkouts'], namespace: 'HIITCardio' },
  { file: 'src/app/components/HomeWorkoutsGuide.tsx', vars: ['gearOptions', 'workouts'], namespace: 'HomeWorkouts' },
  { file: 'src/app/components/KetoBasicsGuide.tsx', vars: ['allFoods', 'popularGreenLightFoods', 'popularKetoKillers'], namespace: 'KetoBasics' },
  { file: 'src/app/components/PostureCorrectionGuide.tsx', vars: ['stretchRoutines', 'allSymptoms', 'ergonomicItems'], namespace: 'PostureCorrection' },
  { file: 'src/app/components/StrengthTrainingGuide.tsx', vars: ['exercises', 'exerciseLibrary'], namespace: 'StrengthTraining' },
  { file: 'src/app/components/YogaFlexibilityGuide.tsx', vars: ['flows', 'poses', 'moodEmojis', 'deskStretches'], namespace: 'YogaFlexibility' }
];

const project = new Project({
  tsConfigFilePath: 'tsconfig.json',
});

function slugify(text) {
  return text.toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .substring(0, 40);
}

for (const target of TARGETS) {
  console.log(`Processing ${target.file}...`);
  const sourceFile = project.getSourceFile(target.file);
  if (!sourceFile) {
    console.error(`Could not find file ${target.file}`);
    continue;
  }

  let mainComponent = sourceFile.getFunction(func => func.isDefaultExport());
  if (!mainComponent) {
    const defaultExport = sourceFile.getExportAssignment(exp => !exp.isExportEquals());
    if (defaultExport) {
      const expName = defaultExport.getExpression().getText();
      mainComponent = sourceFile.getFunction(expName) || sourceFile.getVariableDeclaration(expName)?.getInitializerIfKind(SyntaxKind.ArrowFunction);
    }
  }

  if (!mainComponent) {
    console.error(`Could not find main component in ${target.file}`);
    continue;
  }

  const enJsonPath = path.join(process.cwd(), 'src', 'lib', 'locales', 'en', `${target.namespace}.json`);
  let enJson = {};
  if (fs.existsSync(enJsonPath)) {
    enJson = JSON.parse(fs.readFileSync(enJsonPath, 'utf-8'));
  }

  let addedKeys = 0;

  for (const varName of target.vars) {
    const varDecl = sourceFile.getVariableStatement(stmt => {
      const decls = stmt.getDeclarations();
      return decls.length === 1 && decls[0].getName() === varName;
    });

    if (!varDecl) {
      console.warn(`Variable ${varName} not found outside component in ${target.file}. It might already be inside.`);
      // If it's inside, let's find it inside the mainComponent
      const innerDecl = mainComponent.getVariableStatement(stmt => {
         const decls = stmt.getDeclarations();
         return decls.length === 1 && decls[0].getName() === varName;
      });
      if (innerDecl) {
        processVariable(innerDecl);
      }
      continue;
    }

    // Move it inside
    const varText = varDecl.getText();
    varDecl.remove();

    // Insert at the beginning of the main component
    const body = mainComponent.getBody();
    if (body) {
      const statements = body.getStatements();
      let insertPos = 0;
      // find useTranslation hook to insert after
      const tHookIdx = statements.findIndex(s => s.getText().includes('useTranslation('));
      if (tHookIdx !== -1) insertPos = tHookIdx + 1;
      
      const newStmt = mainComponent.insertVariableStatement(insertPos, {
         declarationKind: "const",
         declarations: [{
           name: "DUMMY",
           initializer: "null"
         }]
      });
      newStmt.replaceWithText(varText);
      
      // Process the newly inserted variable
      const innerDecl = mainComponent.getVariableStatement(stmt => {
         const decls = stmt.getDeclarations();
         return decls.length === 1 && decls[0].getName() === varName;
      });
      if (innerDecl) {
        processVariable(innerDecl);
      }
    }
  }

  function processVariable(innerDecl) {
    const stringLiterals = innerDecl.getDescendantsOfKind(SyntaxKind.StringLiteral);
    for (const literal of stringLiterals.reverse()) {
      // check if it's an object property key (e.g. `id: 'something'`)
      const parent = literal.getParent();
      if (parent.getKind() === SyntaxKind.PropertyAssignment && parent.getNameNode() === literal) {
        continue;
      }
      
      // we only want actual text. 
      const text = literal.getLiteralValue();
      if (!/[a-zA-Z]/.test(text)) continue;
      // skip some obvious IDs / paths / etc
      if (text.includes('/') || text.includes('-') && !text.includes(' ') && text === text.toLowerCase()) continue;
      // skip pure ids like 'no-equipment', 'upper-body'
      if (/^[a-z0-9-]+$/.test(text)) continue;

      const key = slugify(text);
      if (key) {
        enJson[key] = text;
        addedKeys++;
        literal.replaceWithText(`t('${key}', \`${text.replace(/`/g, '\\`')}\`)`);
      }
    }
  }

  if (addedKeys > 0) {
    fs.writeFileSync(enJsonPath, JSON.stringify(enJson, null, 2));
    console.log(`Saved ${addedKeys} new keys for ${target.namespace}`);
  }

  sourceFile.saveSync();
}
