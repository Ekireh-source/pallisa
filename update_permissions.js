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
  
  if (filePath.includes('/academic-years')) return `${action}_ACADEMIC_YEARS`;
  if (filePath.includes('/classes')) return `${action}_CLASSES`;
  if (filePath.includes('/students')) return `${action}_STUDENTS`;
  if (filePath.includes('/teachers')) return `${action}_TEACHERS`;
  if (filePath.includes('/terms')) return `${action}_TERMS`;
  if (filePath.includes('/subjects')) return `${action}_SUBJECTS`;
  if (filePath.includes('/streams')) return `${action}_STREAMS`;
  if (filePath.includes('/roles')) return `${action}_ROLES`;
  if (filePath.includes('/dashboard')) return `VIEW_DASHBOARD`;
  if (filePath.includes('/grading') || filePath.includes('/exams') || filePath.includes('/activity-of-integration') || filePath.includes('/competences')) return `${action}_GRADING`;
  if (filePath.includes('/reports')) return `${action}_REPORTS`;
  
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
    console.log(`Skipping ${file} - no mapped permission`);
    continue;
  }
  
  // Check if MainLayout is used
  if (!content.includes('<MainLayout')) {
    console.log(`Skipping ${file} - no MainLayout`);
    continue;
  }
  
  console.log(`Protecting ${file} with ${permCode}`);
  
  // Insert imports
  const importLines = [
    "import ProtectedComponent from '@/components/permissions/protectedcomponent';",
    "import { PERMISSION_CODES } from '@/codes';"
  ].join('\n');
  
  // Find the last import statement
  const lastImportIndex = content.lastIndexOf('import ');
  const endOfLastImport = content.indexOf('\n', lastImportIndex);
  
  content = content.slice(0, endOfLastImport) + '\n' + importLines + content.slice(endOfLastImport);
  
  // Wrap MainLayout
  // We need to replace `<MainLayout` with `<ProtectedComponent permissionCode={PERMISSION_CODES.XXX}>\n<MainLayout`
  // But wait, there might be multiple MainLayouts or it might be formatted differently.
  // Using a regex to replace the outer MainLayout tag
  
  content = content.replace(/<MainLayout([\s\S]*?)<\/MainLayout>/, (match) => {
    return `<ProtectedComponent permissionCode={PERMISSION_CODES.${permCode}}>\n    ${match}\n    </ProtectedComponent>`;
  });
  
  fs.writeFileSync(file, content);
}

console.log('Done!');
