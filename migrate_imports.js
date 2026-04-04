const fs = require('fs');
const path = require('path');

function walkDir(dir, ext) {
  let results = [];
  const items = fs.readdirSync(dir);
  for (const item of items) {
    const fp = path.join(dir, item);
    const stat = fs.statSync(fp);
    if (stat.isDirectory() && item !== 'node_modules' && item !== '.git') {
      results = results.concat(walkDir(fp, ext));
    } else if (ext.some(e => fp.endsWith(e))) {
      results.push(fp);
    }
  }
  return results;
}

const srcDir = path.join(__dirname, 'src');
const files = walkDir(srcDir, ['.js', '.jsx']);
let count = 0;

for (const file of files) {
  let content = fs.readFileSync(file, 'utf-8');
  if (!content.includes('firebase')) continue;
  
  const original = content;
  
  // Remove all firebase/firestore imports
  content = content.replace(/import\s*\{[^}]*\}\s*from\s*['"]firebase\/firestore['"];?\n?/g, '');
  // Remove all firebase/auth imports  
  content = content.replace(/import\s*\{[^}]*\}\s*from\s*['"]firebase\/auth['"];?\n?/g, '');
  // Remove all firebase/storage imports
  content = content.replace(/import\s*\{[^}]*\}\s*from\s*['"]firebase\/storage['"];?\n?/g, '');
  // Remove all firebase/functions imports
  content = content.replace(/import\s*\{[^}]*\}\s*from\s*['"]firebase\/functions['"];?\n?/g, '');
  
  // Replace local firebase imports with supabase
  content = content.replace(/import\s*\{[^}]*\}\s*from\s*['"]\.\.\/firebase['"];?\n?/g, 
    "import { supabase } from '../supabase';\n");
  content = content.replace(/import\s*\{[^}]*\}\s*from\s*['"]\.\.\/\.\.\/firebase['"];?\n?/g,
    "import { supabase } from '../../supabase';\n");
  
  // Replace auth.signOut() with supabase.auth.signOut()
  content = content.replace(/auth\.signOut\(\)/g, 'supabase.auth.signOut()');
  
  if (content !== original) {
    fs.writeFileSync(file, content, 'utf-8');
    count++;
    console.log('Updated:', path.relative(__dirname, file));
  }
}

console.log(`\nTotal files updated: ${count}`);
