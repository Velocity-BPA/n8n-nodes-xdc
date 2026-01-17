const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, '..', 'nodes', 'Xdc');
const destDir = path.join(__dirname, '..', 'dist', 'nodes', 'Xdc');

// Ensure destination directory exists
fs.mkdirSync(destDir, { recursive: true });

// Copy SVG files
const files = fs.readdirSync(srcDir);
files.forEach(file => {
    if (file.endsWith('.svg') || file.endsWith('.png')) {
        const src = path.join(srcDir, file);
        const dest = path.join(destDir, file);
        fs.copyFileSync(src, dest);
        console.log(`Copied ${file} to dist`);
    }
});

console.log('Icon copy complete!');
