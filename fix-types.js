const fs = require('fs');

function fixFile(file) {
  let content = fs.readFileSync(file, 'utf8');
  
  // Replace:
  // .update({ foo: bar })
  // with:
  // .update({ foo: bar } as any)
  // Or just replace all `.update({` with `const updateData: any = {`
  // Actually, I can just write a quick script that replaces `@ts-ignore` and `.insert({...})` with `const data: any = {...}; .insert(data)`
  // But regex might be tricky for multi-line.
}
// I will just use multi_replace_file_content for the 3 files. It's safer.
