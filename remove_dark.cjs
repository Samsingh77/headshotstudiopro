const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'App.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// Remove all dark: classes
content = content.replace(/dark:[a-zA-Z0-9\-\/\[\]#]+/g, '');
// Clean up double spaces left behind
content = content.replace(/\s{2,}/g, ' ');

// Replace specific dark theme colors with light theme equivalents
// For example, bg-slate-900 -> bg-white
// text-white -> text-slate-900 (in some contexts, but need to be careful)

fs.writeFileSync(filePath, content);
console.log('Removed dark classes');
