#!/usr/bin/env node

import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

/**
 * Setup script for the Coffee Sales Importer
 * Because apparently we need to hold everyone's hand through npm install
 */
class ProjectSetup {
    constructor() {
        this.excelFile = 'Coffe_sales.xlsx';
        this.requiredFiles = [this.excelFile];
        this.scripts = ['analyze-excel.js', 'import-sales.js', 'query-db.js'];
    }

    async run() {
        console.log('☕ Coffee Sales Importer Setup');
        console.log('==============================\n');

        try {
            await this.checkFiles();
            await this.installDependencies();
            await this.showUsageInstructions();
            
            console.log('🎉 Setup completed successfully!');
            console.log('Run "npm run analyze" to get started');
            
        } catch (error) {
            console.error('💥 Setup failed:', error.message);
            process.exit(1);
        }
    }

    async checkFiles() {
        console.log('🔍 Checking required files...');

        // Check if Excel file exists
        if (!fs.existsSync(this.excelFile)) {
            console.log(`⚠️  Excel file not found: ${this.excelFile}`);
            console.log('💡 Make sure your Excel file is named "Coffe_sales.xlsx" and is in this directory');
            
            // List Excel files in directory
            const excelFiles = fs.readdirSync('.')
                .filter(file => file.match(/\.(xlsx|xls)$/i));
            
            if (excelFiles.length > 0) {
                console.log('\n📁 Found these Excel files:');
                excelFiles.forEach(file => console.log(`   • ${file}`));
                console.log('\n💡 Rename your file to "Coffe_sales.xlsx" or update the script');
            }
            
            throw new Error('Excel file not found');
        }

        console.log(`✅ Found Excel file: ${this.excelFile}`);

        // Check script files
        const missingScripts = this.scripts.filter(script => !fs.existsSync(script));
        if (missingScripts.length > 0) {
            console.log('⚠️  Missing script files:', missingScripts);
            throw new Error('Required script files are missing');
        }

        console.log('✅ All script files present');
    }

    async installDependencies() {
        console.log('\n📦 Installing dependencies...');
        
        if (!fs.existsSync('package.json')) {
            throw new Error('package.json not found');
        }

        // Check if node_modules exists
        if (fs.existsSync('node_modules')) {
            console.log('📚 node_modules directory already exists');
            
            // Check if key dependencies are installed
            const keyDeps = ['xlsx', 'sqlite3', 'sqlite'];
            const missing = keyDeps.filter(dep => !fs.existsSync(`node_modules/${dep}`));
            
            if (missing.length === 0) {
                console.log('✅ Dependencies already installed');
                return;
            }
            
            console.log('⚠️  Some dependencies missing:', missing);
        }

        // Install dependencies
        console.log('🔧 Running npm install...');
        
        return new Promise((resolve, reject) => {
            const npmProcess = spawn('npm', ['install'], {
                stdio: 'inherit',
                shell: true
            });

            npmProcess.on('close', (code) => {
                if (code === 0) {
                    console.log('✅ Dependencies installed successfully');
                    resolve();
                } else {
                    reject(new Error(`npm install failed with code ${code}`));
                }
            });

            npmProcess.on('error', (error) => {
                reject(new Error(`Failed to run npm install: ${error.message}`));
            });
        });
    }

    showUsageInstructions() {
        console.log('\n🚀 USAGE INSTRUCTIONS');
        console.log('=====================');
        console.log('1. Analyze your Excel file first:');
        console.log('   npm run analyze');
        console.log('');
        console.log('2. Import data to SQLite:');
        console.log('   npm start');
        console.log('');
        console.log('3. Query your database:');
        console.log('   node query-db.js');
        console.log('');
        console.log('📖 For detailed instructions, see README.md');
        console.log('');
        
        // Show file info
        const stats = fs.statSync(this.excelFile);
        const sizeKB = Math.round(stats.size / 1024);
        console.log(`📊 Your Excel file: ${this.excelFile} (${sizeKB} KB)`);
        console.log(`📅 Last modified: ${stats.mtime.toLocaleDateString()}`);
    }

    static async checkNodeVersion() {
        const version = process.version;
        const majorVersion = parseInt(version.substring(1).split('.')[0]);
        
        if (majorVersion < 14) {
            console.error('❌ Node.js version 14 or higher required');
            console.error(`   Current version: ${version}`);
            console.error('   Please update Node.js: https://nodejs.org/');
            process.exit(1);
        }
        
        console.log(`✅ Node.js version: ${version}`);
    }
}

// Run setup
const main = async () => {
    await ProjectSetup.checkNodeVersion();
    const setup = new ProjectSetup();
    await setup.run();
};

main().catch(error => {
    console.error('Setup script failed:', error.message);
    process.exit(1);
});