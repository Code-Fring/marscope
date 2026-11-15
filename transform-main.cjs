const fs = require('fs');
const path = require('path');
const parser = require('@babel/parser');
const generate = require('@babel/generator').default;
const traverse = require('@babel/traverse').default;
const t = require('@babel/types');

const filePath = path.join(__dirname, 'src', 'main.tsx');
let code = fs.readFileSync(filePath, 'utf8');

console.log('Reading main.tsx...');
console.log('Original length:', code.length);

// Parse with Babel
const ast = parser.parse(code, {
  sourceType: 'module',
  plugins: ['typescript', 'jsx'],
});

// Transform h() calls with array children to individual arguments
traverse(ast, {
  CallExpression(path) {
    const callee = path.node.callee;
    if (t.isIdentifier(callee, { name: 'h' }) || 
        (t.isMemberExpression(callee) && t.isIdentifier(callee.property, { name: 'h' }))) {
      
      const args = path.node.arguments;
      if (args.length >= 3) {
        const thirdArg = args[2];
        if (t.isArrayExpression(thirdArg)) {
          // Replace h(tag, props, [children...]) with h(tag, props, ...children)
          const newArgs = [args[0], args[1], ...thirdArg.elements];
          path.node.arguments = newArgs;
        }
      }
    }
  });

const output = generate(ast, {
  retainLines: true,
  compact: false,
}).code;

fs.writeFileSync(filePath, output, 'utf8');
console.log('Successfully transformed main.tsx using Babel');