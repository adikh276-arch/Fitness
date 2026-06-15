import { Project, SyntaxKind } from 'ts-morph';

const project = new Project({
  tsConfigFilePath: 'tsconfig.json',
});

const sourceFiles = project.getSourceFiles('src/app/components/**/*.tsx');

let missedStrings = 0;

for (const sourceFile of sourceFiles) {
  const fileName = sourceFile.getBaseName();
  // We want to find string literals that are likely user facing but not wrapped in t()
  
  const stringLiterals = sourceFile.getDescendantsOfKind(SyntaxKind.StringLiteral);
  for (const literal of stringLiterals) {
    const parent = literal.getParent();
    const text = literal.getLiteralValue();
    
    if (!/[a-zA-Z]/.test(text)) continue; // ignore non-words
    if (/^[A-Z0-9_-]+$/.test(text) && text.includes('_')) continue; // likely a key or ID
    
    // Ignore if already inside a call expression like t('...')
    if (parent.getKind() === SyntaxKind.CallExpression) continue;
    
    // Ignore import declarations
    if (literal.getFirstAncestorByKind(SyntaxKind.ImportDeclaration)) continue;
    
    // Ignore class names
    if (parent.getKind() === SyntaxKind.JsxAttribute && parent.getName() === 'className') continue;
    if (parent.getKind() === SyntaxKind.PropertyAssignment && parent.getName() === 'className') continue;
    
    // Ignore keys, ids, etc
    if (parent.getKind() === SyntaxKind.JsxAttribute && ['key', 'id', 'name', 'type', 'mode', 'stroke', 'fill', 'dataKey'].includes(parent.getName())) continue;
    
    // Ignore if it's inside a property assignment for known non-display properties
    if (parent.getKind() === SyntaxKind.PropertyAssignment) {
      const propName = parent.getName();
      if (['id', 'key', 'type', 'icon', 'color', 'className', 'name', 'action_type'].includes(propName)) continue;
    }

    // Only look at strings inside JSX Expressions
    if (literal.getFirstAncestorByKind(SyntaxKind.JsxExpression)) {
       console.log(`[${fileName}] Found in JSX Expression: "${text}" (Line: ${literal.getStartLineNumber()})`);
       missedStrings++;
    }
  }
}

console.log(`Total missed strings in JSX expressions: ${missedStrings}`);
