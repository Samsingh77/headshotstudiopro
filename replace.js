import fs from 'fs';

const appTsxPath = './App.tsx';
let appTsxContent = fs.readFileSync(appTsxPath, 'utf8');

const startMarker = 'const LandingPage: React.FC<{';
const endMarker = '  );\n};\n';

const startIndex = appTsxContent.indexOf(startMarker);
const endIndex = appTsxContent.indexOf(endMarker, startIndex) + endMarker.length;

if (startIndex !== -1 && endIndex !== -1) {
  const newLandingPage = fs.readFileSync('./NewLandingPage.txt', 'utf8');
  
  appTsxContent = appTsxContent.substring(0, startIndex) + newLandingPage + '\n' + appTsxContent.substring(endIndex);
  
  fs.writeFileSync(appTsxPath, appTsxContent, 'utf8');
  console.log('Successfully replaced LandingPage component.');
} else {
  console.error('Could not find LandingPage component boundaries.');
  console.log('startIndex:', startIndex);
  console.log('endIndex:', endIndex);
}
