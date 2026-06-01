const fs = require('fs');
const path = require('path');

const walkSync = (dir, filelist = []) => {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const dirFile = path.join(dir, file);
    if (fs.statSync(dirFile).isDirectory()) {
      filelist = walkSync(dirFile, filelist);
    } else if (dirFile.endsWith('page.tsx')) {
      filelist.push(dirFile);
    }
  }
  return filelist;
};

const mapPathToPermission = (filePath) => {
  const isManage = filePath.includes('/create/') || filePath.includes('/edit/');
  const action = isManage ? 'MANAGE' : 'VIEW';
  
  if (filePath.includes('/campuses')) return `${action}_CAMPUSES`;
  if (filePath.includes('/classes')) return `${action}_CLASSES`;
  if (filePath.includes('/competences')) return `${action}_COMPETENCES`;
  
  return null;
};

const files = walkSync('client/src/app/(main)');

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  
  // Skip if already protected
  if (content.includes('ProtectedComponent')) {
    continue;
  }
  
  const permCode = mapPathToPermission(file);
  if (!permCode) {
    continue;
  }
  
  console.log(`Protecting ${file} with ${permCode}`);
  
  // Insert imports
  const importLines = [
    "import ProtectedComponent from '@/components/permissions/protectedcomponent';",
    "import { PERMISSION_CODES } from '@/codes';"
  ].join('\n');
  
  const lastImportIndex = content.lastIndexOf('import ');
  const endOfLastImport = content.indexOf('\n', lastImportIndex);
  
  content = content.slice(0, endOfLastImport) + '\n' + importLines + content.slice(endOfLastImport);
  
  // Find where to inject ProtectedComponent
  if (content.includes('<MainLayout')) {
    content = content.replace(/<MainLayout([\s\S]*?)<\/MainLayout>/, (match) => {
      return `<ProtectedComponent permissionCode={PERMISSION_CODES.${permCode}}>\n    ${match}\n    </ProtectedComponent>`;
    });
  } else {
    const exportDefIdx = content.indexOf('export default function');
    if (exportDefIdx !== -1) {
      let returnIdx = content.indexOf('return (', exportDefIdx);
      if (returnIdx !== -1) {
        content = content.slice(0, returnIdx) + 
                  `return (\n    <ProtectedComponent permissionCode={PERMISSION_CODES.${permCode}}>` + 
                  content.slice(returnIdx + 8);
        
        let lastReturnEndIdx = content.lastIndexOf('  );\n}');
        if (lastReturnEndIdx !== -1) {
          content = content.slice(0, lastReturnEndIdx) + 
                    `  </ProtectedComponent>\n  );\n}` + 
                    content.slice(lastReturnEndIdx + 6);
        } else {
          lastReturnEndIdx = content.lastIndexOf(');\n}');
          if (lastReturnEndIdx !== -1) {
              content = content.slice(0, lastReturnEndIdx) + 
                    `  </ProtectedComponent>\n);\n}` + 
                    content.slice(lastReturnEndIdx + 4);
          }
        }
      }
    }
  }
  
  fs.writeFileSync(file, content);
}

console.log('Done part 3!');



// celery -A pallisa_api worker --loglevel=info