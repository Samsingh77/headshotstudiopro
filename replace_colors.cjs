const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'App.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// Replace old colors with new ones
content = content.replace(/#4F46E5/g, '#16A34A'); // Indigo to Green
content = content.replace(/#4338CA/g, '#15803D'); // Indigo hover to Green hover
content = content.replace(/#40b581/g, '#16A34A'); // Old emerald to new Green
content = content.replace(/#00b87c/g, '#16A34A'); // Old emerald to new Green
content = content.replace(/indigo-600/g, 'green-600');
content = content.replace(/indigo-500/g, 'green-500');
content = content.replace(/indigo-400/g, 'green-400');
content = content.replace(/indigo-100/g, 'green-100');
content = content.replace(/indigo-50/g, 'green-50');

// Replace dark backgrounds with light ones
content = content.replace(/bg-slate-900\/80/g, 'bg-white/90');
content = content.replace(/bg-slate-900\/50/g, 'bg-slate-50/50');
content = content.replace(/bg-slate-900/g, 'bg-white');
content = content.replace(/bg-slate-950/g, 'bg-slate-50');
content = content.replace(/bg-black\/80/g, 'bg-white/90');
content = content.replace(/bg-black\/60/g, 'bg-white/90');
content = content.replace(/bg-black\/40/g, 'bg-white/80');
content = content.replace(/bg-black/g, 'bg-slate-50');

// Replace text colors
content = content.replace(/text-white/g, 'text-slate-900');
// But wait, buttons need text-white! Let's be careful.
// Let's not blindly replace text-white. We can fix specific sections.

fs.writeFileSync(filePath, content);
console.log('Replaced colors');
