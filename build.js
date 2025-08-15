#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔍 Validating static website files...');

// Check if all referenced files exist
const requiredFiles = [
    'index.html',
    'css/style.css',
    'css/responsive.css',
    'js/main.js',
    'config-live.js',
    'images/logo.svg',
    'images/assistant-icon.svg'
];

let allFilesExist = true;

requiredFiles.forEach(file => {
    if (fs.existsSync(file)) {
        console.log(`✅ ${file}`);
    } else {
        console.log(`❌ ${file} - MISSING`);
        allFilesExist = false;
    }
});

// Check blog directory
const blogDir = 'blog';
if (fs.existsSync(blogDir)) {
    const blogFiles = fs.readdirSync(blogDir);
    console.log(`📝 Blog directory contains ${blogFiles.length} files`);
} else {
    console.log('❌ Blog directory missing');
    allFilesExist = false;
}

if (allFilesExist) {
    console.log('\n🎉 All required files are present!');
    console.log('📁 Static website is ready for deployment.');
} else {
    console.log('\n⚠️  Some files are missing. Please check the errors above.');
    process.exit(1);
}
