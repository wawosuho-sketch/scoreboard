const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'types', 'database.types.ts');
let content = fs.readFileSync(filePath, 'utf8');

// Replace Row: { ... } with Row: { ... }, Insert: Partial<{ ... }>, Update: Partial<{ ... }>
// Since we only need to stop `never` from happening, we can just map Insert and Update to Partial<Row> globally, but wait, the type system needs it under each table.

content = content.replace(/Row: \{([^}]+)\}/g, (match, p1) => {
  return `Row: {${p1}}\n          Insert: Partial<{${p1}}>\n          Update: Partial<{${p1}}>`;
});

fs.writeFileSync(filePath, content, 'utf8');
console.log('Fixed database.types.ts');
