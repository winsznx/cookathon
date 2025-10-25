#!/usr/bin/env node

import { existsSync, readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

console.log('🔍 Verifying NFT Telegram Bot Setup...\n');

let errors = 0;
let warnings = 0;

// Check 1: Node.js version
console.log('✓ Checking Node.js version...');
const nodeVersion = process.version;
const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0]);
if (majorVersion < 18) {
  console.error('  ❌ Node.js version must be 18 or higher. Current:', nodeVersion);
  errors++;
} else {
  console.log('  ✅ Node.js version:', nodeVersion);
}

// Check 2: Environment files
console.log('\n✓ Checking environment files...');
const envPath = join(rootDir, '.env');
const webappEnvPath = join(rootDir, 'webapp', '.env');

if (!existsSync(envPath)) {
  console.error('  ❌ Root .env file not found. Run: cp .env.example .env');
  errors++;
} else {
  console.log('  ✅ Root .env file exists');

  // Check required variables
  const envContent = readFileSync(envPath, 'utf-8');
  const requiredVars = [
    'TELEGRAM_BOT_TOKEN',
    'DEPLOYER_PRIVATE_KEY',
    'PINATA_API_KEY',
    'PINATA_SECRET_KEY'
  ];

  requiredVars.forEach(varName => {
    if (!envContent.includes(`${varName}=`) || envContent.includes(`${varName}=your_`)) {
      console.error(`  ⚠️  ${varName} not configured`);
      warnings++;
    }
  });

  if (envContent.includes('CONTRACT_ADDRESS=') && !envContent.includes('CONTRACT_ADDRESS=your_')) {
    console.log('  ✅ CONTRACT_ADDRESS configured');
  } else {
    console.log('  ⚠️  CONTRACT_ADDRESS not set (deploy contract first)');
    warnings++;
  }
}

if (!existsSync(webappEnvPath)) {
  console.error('  ❌ Webapp .env file not found. Run: cp webapp/.env.example webapp/.env');
  errors++;
} else {
  console.log('  ✅ Webapp .env file exists');

  const webappEnvContent = readFileSync(webappEnvPath, 'utf-8');
  if (webappEnvContent.includes('VITE_REOWN_PROJECT_ID=your_')) {
    console.error('  ⚠️  VITE_REOWN_PROJECT_ID not configured');
    warnings++;
  }
}

// Check 3: Dependencies
console.log('\n✓ Checking dependencies...');
const folders = ['backend', 'webapp', 'contracts', 'shared'];
folders.forEach(folder => {
  const nodeModulesPath = join(rootDir, folder, 'node_modules');
  if (!existsSync(nodeModulesPath)) {
    console.error(`  ❌ ${folder}/node_modules not found. Run: npm run install:all`);
    errors++;
  } else {
    console.log(`  ✅ ${folder}/node_modules exists`);
  }
});

// Check 4: Required directories
console.log('\n✓ Checking project structure...');
const requiredDirs = [
  'backend/src',
  'webapp/src',
  'contracts/contracts',
  'shared/src'
];

requiredDirs.forEach(dir => {
  const dirPath = join(rootDir, dir);
  if (!existsSync(dirPath)) {
    console.error(`  ❌ Missing directory: ${dir}`);
    errors++;
  } else {
    console.log(`  ✅ ${dir}`);
  }
});

// Summary
console.log('\n' + '='.repeat(50));
console.log('SETUP VERIFICATION SUMMARY');
console.log('='.repeat(50));

if (errors === 0 && warnings === 0) {
  console.log('✅ All checks passed! Your setup looks good.');
  console.log('\nNext steps:');
  console.log('1. Deploy contract: cd contracts && npm run deploy');
  console.log('2. Update .env files with CONTRACT_ADDRESS');
  console.log('3. Start backend: npm run dev:backend');
  console.log('4. Start webapp: npm run dev:webapp');
} else {
  if (errors > 0) {
    console.error(`\n❌ Found ${errors} error(s) - please fix before continuing`);
  }
  if (warnings > 0) {
    console.warn(`\n⚠️  Found ${warnings} warning(s) - recommended to fix`);
  }
}

console.log('\nFor detailed setup instructions, see QUICKSTART.md');
console.log('For full documentation, see README.md\n');

process.exit(errors > 0 ? 1 : 0);
