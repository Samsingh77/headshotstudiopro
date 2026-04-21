const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'App.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// Replace light text colors with darker ones for light theme
content = content.replace(/text-slate-300/g, 'text-slate-600');
content = content.replace(/text-slate-400/g, 'text-slate-500');
content = content.replace(/text-slate-200/g, 'text-slate-700');
content = content.replace(/text-indigo-200/g, 'text-green-700');
content = content.replace(/text-green-100/g, 'text-green-800');

// Fix border colors
content = content.replace(/border-white\/10/g, 'border-slate-200');
content = content.replace(/border-white\/5/g, 'border-slate-100');
content = content.replace(/border-white\/20/g, 'border-slate-200');

// Fix background colors
content = content.replace(/bg-slate-800\/50/g, 'bg-slate-50');
content = content.replace(/bg-slate-800/g, 'bg-slate-50');
content = content.replace(/bg-slate-700/g, 'bg-slate-100');

fs.writeFileSync(filePath, content);
console.log('Replaced more colors');
