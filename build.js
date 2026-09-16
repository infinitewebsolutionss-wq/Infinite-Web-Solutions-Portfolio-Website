/**
 * Infinite Web Solutions - Project Build & Pre-flight Deployment Script
 */

const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.join(__dirname, '..');
const DATA_DIR = path.join(ROOT_DIR, 'data');
const ASSETS_DIR = path.join(ROOT_DIR, 'assets', 'images');

console.log('🚀 Starting Infinite Web Solutions build process...');

// 1. Ensure required data files exist
const requiredFiles = [
  { file: path.join(DATA_DIR, 'projects.json'), default: [] },
  { file: path.join(DATA_DIR, 'quotes.json'), default: [] },
  { file: path.join(DATA_DIR, 'contacts.json'), default: [] },
  { file: path.join(DATA_DIR, 'email_outbox.json'), default: [] }
];

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  console.log('📁 Created missing data/ directory.');
}

requiredFiles.forEach(({ file, default: defaultVal }) => {
  if (!fs.existsSync(file)) {
    fs.writeFileSync(file, JSON.stringify(defaultVal, null, 2));
    console.log(`📄 Initialized missing file: ${path.relative(ROOT_DIR, file)}`);
  }
});

// 2. Validate core static assets
const requiredAssets = [
  path.join(ROOT_DIR, 'index.html'),
  path.join(ROOT_DIR, 'styles.css'),
  path.join(ROOT_DIR, 'main.js'),
  path.join(ROOT_DIR, 'server.js'),
  path.join(ROOT_DIR, 'emailService.js'),
  path.join(ASSETS_DIR, 'angeles-urgent-care.png'),
  path.join(ASSETS_DIR, 'all-med-la.png'),
  path.join(ASSETS_DIR, 'la-ent.png'),
  path.join(ASSETS_DIR, 'cnhf-clinics.png')
];

let missingCount = 0;
requiredAssets.forEach(assetPath => {
  if (!fs.existsSync(assetPath)) {
    console.error(`❌ Missing asset: ${path.relative(ROOT_DIR, assetPath)}`);
    missingCount++;
  }
});

if (missingCount > 0) {
  console.error(`❌ Build failed with ${missingCount} missing assets.`);
  process.exit(1);
}

console.log('✅ All project files, data stores, and mockups verified.');
console.log('🎉 Build completed successfully!');
