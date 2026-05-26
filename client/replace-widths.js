const fs = require('fs');
const path = require('path');

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(function(file) {
        file = path.join(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) {
            results = results.concat(walk(file));
        } else {
            if (file.endsWith('page.tsx')) {
                results.push(file);
            }
        }
    });
    return results;
}

const dir = path.join(__dirname, 'src/app/(main)');
const files = walk(dir);

let totalChanged = 0;

files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    
    // Replace max-w-2xl mx-auto, max-w-4xl mx-auto, max-w-5xl mx-auto, max-w-7xl mx-auto
    const regex = /className="([^"]*)max-w-[a-zA-Z0-9-]+ mx-auto\s*([^"]*)"/g;
    
    let changed = false;
    const newContent = content.replace(regex, (match, p1, p2) => {
        changed = true;
        let prefix = p1 ? p1.trim() + ' ' : '';
        let suffix = p2 ? ' ' + p2.trim() : '';
        // If there's no space before or after, don't add one
        let inner = [prefix.trim(), 'w-full', suffix.trim()].filter(Boolean).join(' ');
        return `className="${inner}"`;
    });

    if (changed) {
        fs.writeFileSync(file, newContent);
        console.log(`Updated: ${file.replace(__dirname, '')}`);
        totalChanged++;
    }
});

console.log(`\nCompleted! Total files updated: ${totalChanged}`);
