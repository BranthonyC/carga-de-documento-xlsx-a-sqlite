import * as XLSX from 'xlsx';
import fs from 'fs';

/**
 * Analyze Excel file structure to understand the data before creating ER schema
 * Because apparently we're working blind here
 */
class ExcelAnalyzer {
    constructor(filePath) {
        this.filePath = filePath;
        this.workbook = null;
        this.worksheets = {};
    }

    async analyze() {
        try {
            console.log(`🔍 Analyzing Excel file: ${this.filePath}`);
            
            // Read the Excel file
            const fileBuffer = fs.readFileSync(this.filePath);
            this.workbook = XLSX.read(fileBuffer, { type: 'buffer' });
            
            console.log(`📊 Found ${this.workbook.SheetNames.length} worksheet(s):`);
            
            // Analyze each worksheet
            for (const sheetName of this.workbook.SheetNames) {
                console.log(`\n🔸 Sheet: "${sheetName}"`);
                await this.analyzeWorksheet(sheetName);
            }
            
            // Suggest ER schema
            this.suggestERSchema();
            
        } catch (error) {
            console.error('💥 Error analyzing Excel file:', error.message);
            throw error;
        }
    }

    analyzeWorksheet(sheetName) {
        const worksheet = this.workbook.Sheets[sheetName];
        const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        
        if (data.length === 0) {
            console.log('   ⚠️  Empty worksheet');
            return;
        }

        // Get headers (first row)
        const headers = data[0] || [];
        console.log(`   📝 Columns (${headers.length}):`, headers);
        
        // Sample data (first 3 rows after header)
        const sampleData = data.slice(1, 4);
        console.log(`   📋 Sample data (${data.length - 1} total rows):`);
        
        sampleData.forEach((row, index) => {
            console.log(`   Row ${index + 1}:`, row);
        });

        // Analyze data types
        this.analyzeDataTypes(headers, data.slice(1));
        
        // Store for ER schema suggestion
        this.worksheets[sheetName] = {
            headers,
            rowCount: data.length - 1,
            sampleData
        };
    }

    analyzeDataTypes(headers, dataRows) {
        if (dataRows.length === 0) return;
        
        console.log('   🔍 Inferred data types:');
        
        headers.forEach((header, colIndex) => {
            const columnData = dataRows.map(row => row[colIndex]).filter(val => val != null);
            const dataType = this.inferDataType(columnData);
            console.log(`      ${header}: ${dataType}`);
        });
    }

    inferDataType(columnData) {
        if (columnData.length === 0) return 'UNKNOWN';
        
        const sample = columnData.slice(0, 10); // Check first 10 non-null values
        
        // Check for dates
        if (sample.some(val => val instanceof Date || this.isDateString(val))) {
            return 'DATE/DATETIME';
        }
        
        // Check for numbers
        if (sample.every(val => !isNaN(val) && isFinite(val))) {
            return sample.every(val => Number.isInteger(Number(val))) ? 'INTEGER' : 'DECIMAL';
        }
        
        // Check for boolean
        if (sample.every(val => val === true || val === false || val === 'true' || val === 'false')) {
            return 'BOOLEAN';
        }
        
        return 'TEXT';
    }

    isDateString(value) {
        if (typeof value !== 'string') return false;
        const date = new Date(value);
        return !isNaN(date.getTime()) && value.match(/\d{1,4}[-/]\d{1,2}[-/]\d{1,4}/);
    }

    suggestERSchema() {
        console.log('\n🎯 SUGGESTED ER SCHEMA:');
        console.log('=======================');
        
        Object.entries(this.worksheets).forEach(([sheetName, data]) => {
            console.log(`\n📋 Table: ${sheetName.toLowerCase().replace(/\s+/g, '_')}`);
            console.log('   Suggested structure:');
            
            // Add auto-increment ID
            console.log('   - id: INTEGER PRIMARY KEY AUTOINCREMENT');
            
            data.headers.forEach(header => {
                const sqlColumnName = header.toLowerCase().replace(/\s+/g, '_').replace(/[^\w]/g, '');
                console.log(`   - ${sqlColumnName}: ${this.getSQLiteType(header, data.sampleData)}`);
            });
        });
        
        console.log('\n🔗 POTENTIAL RELATIONSHIPS:');
        console.log('============================');
        console.log('   (Analyze your data to identify foreign keys and relationships)');
        console.log('   - Look for ID fields that reference other tables');
        console.log('   - Consider normalization opportunities');
        console.log('   - Identify many-to-many relationships that need junction tables');
    }

    getSQLiteType(columnName, sampleData) {
        const lowerName = columnName.toLowerCase();
        
        // Common patterns
        if (lowerName.includes('id') && lowerName !== 'id') return 'INTEGER';
        if (lowerName.includes('date') || lowerName.includes('time')) return 'DATETIME';
        if (lowerName.includes('price') || lowerName.includes('amount') || lowerName.includes('total')) return 'DECIMAL(10,2)';
        if (lowerName.includes('quantity') || lowerName.includes('count')) return 'INTEGER';
        
        return 'TEXT';
    }
}

// Run the analyzer
const fileName = 'Coffe_sales.xlsx'; // Note: keeping the original typo from the file
const analyzer = new ExcelAnalyzer(fileName);

analyzer.analyze().catch(error => {
    console.error('Analysis failed:', error.message);
    process.exit(1);
});