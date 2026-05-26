const fs = require('fs');

function processFile(file) {
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(/text-gray-900/g, 'text-[var(--My-Black)]')
                   .replace(/text-gray-800/g, 'text-[var(--My-Black)]')
                   .replace(/text-gray-500/g, 'text-[var(--My-Gray)]')
                   .replace(/text-gray-400/g, 'text-[var(--My-Gray)]');
  fs.writeFileSync(file, content);
}

processFile('/home/oscar-baifam/pallisa/client/src/components/report-card/OLevelReportCard.tsx');
processFile('/home/oscar-baifam/pallisa/client/src/components/report-card/ALevelReportCard.tsx');
console.log('done');
