import * as XLSX from 'xlsx';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import fs from 'fs';

/**
 * Professional Coffee Sales Data Importer with Proper ER Schema
 * Now with 100% less guessing and 100% more architectural sanity
 */
class CoffeeSalesImporter {
    constructor(excelFile, dbFile = 'coffee_sales.db') {
        this.excelFile = excelFile;
        this.dbFile = dbFile;
        this.db = null;
        this.workbook = null;
        this.erSchema = this.defineERSchema();
        this.lookupCaches = {}; // Cache for normalized lookups
    }

    defineERSchema() {
        return {
            clientes: {
                tableName: 'clientes',
                columns: [
                    'id_cliente INTEGER PRIMARY KEY AUTOINCREMENT',
                    'codigo_anonimo TEXT',
                    'tipo_cliente TEXT',
                    'fecha_primer_compra DATETIME',
                    'fecha_ultima_compra DATETIME',
                    'total_compras INTEGER DEFAULT 0',
                    'monto_total_gastado DECIMAL(10,2) DEFAULT 0',
                    'fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP'
                ]
            },
            productos: {
                tableName: 'productos',
                columns: [
                    'id_producto INTEGER PRIMARY KEY AUTOINCREMENT',
                    'nombre_producto TEXT NOT NULL',
                    'categoria TEXT',
                    'precio_base DECIMAL(10,2)',
                    'activo BOOLEAN DEFAULT 1',
                    'fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP',
                    'fecha_actualizacion DATETIME DEFAULT CURRENT_TIMESTAMP'
                ]
            },
            metodos_pago: {
                tableName: 'metodos_pago',
                columns: [
                    'id_metodo_pago INTEGER PRIMARY KEY AUTOINCREMENT',
                    'tipo_pago TEXT NOT NULL',
                    'descripcion TEXT',
                    'activo BOOLEAN DEFAULT 1',
                    'periodo_dia TEXT'
                ]
            },
            sucursales: {
                tableName: 'sucursales',
                columns: [
                    'id_sucursal INTEGER PRIMARY KEY AUTOINCREMENT',
                    'nombre_sucursal TEXT NOT NULL',
                    'direccion TEXT',
                    'ciudad TEXT',
                    'activa BOOLEAN DEFAULT 1',
                    'fecha_apertura DATETIME',
                    'fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP'
                ]
            },
            ventas: {
                tableName: 'ventas',
                columns: [
                    'id_venta INTEGER PRIMARY KEY AUTOINCREMENT',
                    'fecha_venta DATE NOT NULL',
                    'fecha_hora_venta DATETIME NOT NULL',
                    'hora_del_dia TIME',
                    'id_producto INTEGER NOT NULL',
                    'id_metodo_pago INTEGER NOT NULL',
                    'id_cliente INTEGER',
                    'id_sucursal INTEGER NOT NULL',
                    'precio_unitario DECIMAL(10,2) NOT NULL',
                    'cantidad INTEGER NOT NULL DEFAULT 1',
                    'monto_total DECIMAL(10,2) NOT NULL',
                    'periodo_dia TEXT',
                    'dia_semana TEXT',
                    'nombre_mes TEXT',
                    'numero_dia_semana INTEGER',
                    'numero_mes INTEGER',
                    'fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP',
                    'fecha_actualizacion DATETIME DEFAULT CURRENT_TIMESTAMP',
                    'FOREIGN KEY (id_producto) REFERENCES productos(id_producto)',
                    'FOREIGN KEY (id_metodo_pago) REFERENCES metodos_pago(id_metodo_pago)',
                    'FOREIGN KEY (id_cliente) REFERENCES clientes(id_cliente)',
                    'FOREIGN KEY (id_sucursal) REFERENCES sucursales(id_sucursal)'
                ]
            }
        };
    }

    async initialize() {
        console.log('🚀 Initializing Coffee Sales Importer...');
        
        // Open SQLite database
        this.db = await open({
            filename: this.dbFile,
            driver: sqlite3.Database
        });

        // Read Excel file
        const fileBuffer = fs.readFileSync(this.excelFile);
        this.workbook = XLSX.read(fileBuffer, { type: 'buffer' });
        
        console.log(`📊 Connected to database: ${this.dbFile}`);
        console.log(`📁 Loaded Excel file: ${this.excelFile}`);
    }

    async createERSchema() {
        console.log('\n🏗️  Creating Professional ER Schema...');

        // Create tables in correct order (respecting foreign key dependencies)
        const creationOrder = ['clientes', 'productos', 'metodos_pago', 'sucursales', 'ventas'];
        
        for (const tableName of creationOrder) {
            await this.createTable(tableName);
        }

        // Create indexes for better performance
        await this.createIndexes();

        // Initialize lookup caches
        await this.initializeLookupCaches();

        console.log('✅ ER Schema created successfully with proper relationships');
    }

    async createTable(tableName) {
        const tableSchema = this.erSchema[tableName];
        if (!tableSchema) {
            throw new Error(`Unknown table: ${tableName}`);
        }

        console.log(`📋 Creating table: ${tableName}`);

        // Drop table if exists
        await this.db.exec(`DROP TABLE IF EXISTS ${tableName}`);

        // Create table with proper schema
        const columnDefinitions = tableSchema.columns.join(',\n    ');
        const createTableSQL = `
            CREATE TABLE ${tableName} (
                ${columnDefinitions}
            )
        `;

        await this.db.exec(createTableSQL);
        console.log(`   ✓ Table ${tableName} created with ${tableSchema.columns.length} columns`);
    }

    async initializeLookupCaches() {
        console.log('🔍 Initializing lookup caches...');
        
        this.lookupCaches = {
            productos: {},
            clientes: {},
            sucursales: {},
            metodos_pago: {}
        };
        
        console.log('   ✓ Lookup caches initialized');
    }

    async getOrCreateProducto(nombre, categoria = null, precioBase = null) {
        const key = nombre?.toString().toLowerCase().trim();
        if (!key) return null;

        // Check cache first
        if (this.lookupCaches.productos[key]) {
            return this.lookupCaches.productos[key];
        }

        // Check database
        let producto = await this.db.get(
            'SELECT id_producto FROM productos WHERE LOWER(nombre_producto) = ?',
            [key]
        );

        if (!producto) {
            // Create new producto
            const result = await this.db.run(
                `INSERT INTO productos (nombre_producto, categoria, precio_base) 
                 VALUES (?, ?, ?)`,
                [nombre, categoria, precioBase]
            );
            producto = { id_producto: result.lastID };
        }

        // Cache the result
        this.lookupCaches.productos[key] = producto.id_producto;
        return producto.id_producto;
    }

    async getOrCreateCliente(codigoAnonimo, tipoCliente = null) {
        if (!codigoAnonimo) return null;

        const key = codigoAnonimo.toString().trim();
        
        // Check cache first
        if (this.lookupCaches.clientes[key]) {
            return this.lookupCaches.clientes[key];
        }

        // Check database
        let cliente = await this.db.get(
            'SELECT id_cliente FROM clientes WHERE codigo_anonimo = ?',
            [key]
        );

        if (!cliente) {
            // Create new cliente
            const result = await this.db.run(
                `INSERT INTO clientes (codigo_anonimo, tipo_cliente) 
                 VALUES (?, ?)`,
                [key, tipoCliente]
            );
            cliente = { id_cliente: result.lastID };
        }

        // Cache the result
        this.lookupCaches.clientes[key] = cliente.id_cliente;
        return cliente.id_cliente;
    }

    async getOrCreateSucursal(nombre, direccion = null, ciudad = null) {
        const key = nombre?.toString().toLowerCase().trim();
        if (!key) {
            // Create a default sucursal if none specified
            return await this.getOrCreateSucursal('Sucursal Principal', 'Sin dirección', 'Sin ciudad');
        }

        // Check cache first
        if (this.lookupCaches.sucursales[key]) {
            return this.lookupCaches.sucursales[key];
        }

        // Check database
        let sucursal = await this.db.get(
            'SELECT id_sucursal FROM sucursales WHERE LOWER(nombre_sucursal) = ?',
            [key]
        );

        if (!sucursal) {
            // Create new sucursal
            const result = await this.db.run(
                `INSERT INTO sucursales (nombre_sucursal, direccion, ciudad) 
                 VALUES (?, ?, ?)`,
                [nombre, direccion, ciudad]
            );
            sucursal = { id_sucursal: result.lastID };
        }

        // Cache the result
        this.lookupCaches.sucursales[key] = sucursal.id_sucursal;
        return sucursal.id_sucursal;
    }

    async getOrCreateMetodoPago(tipoPago, descripcion = null) {
        const key = tipoPago?.toString().toLowerCase().trim();
        if (!key) {
            // Default payment method
            return await this.getOrCreateMetodoPago('Efectivo', 'Pago en efectivo');
        }

        // Check cache first
        if (this.lookupCaches.metodos_pago[key]) {
            return this.lookupCaches.metodos_pago[key];
        }

        // Check database
        let metodo = await this.db.get(
            'SELECT id_metodo_pago FROM metodos_pago WHERE LOWER(tipo_pago) = ?',
            [key]
        );

        if (!metodo) {
            // Create new metodo de pago
            const result = await this.db.run(
                `INSERT INTO metodos_pago (tipo_pago, descripcion) 
                 VALUES (?, ?)`,
                [tipoPago, descripcion]
            );
            metodo = { id_metodo_pago: result.lastID };
        }

        // Cache the result
        this.lookupCaches.metodos_pago[key] = metodo.id_metodo_pago;
        return metodo.id_metodo_pago;
    }

    inferSQLiteType(columnName, data) {
        if (data.length === 0) return 'TEXT';
        
        const lowerName = columnName?.toLowerCase() || '';
        const sample = data.slice(0, 20); // Check first 20 values

        // Specific patterns for coffee sales data
        if (lowerName.includes('price') || lowerName.includes('amount') || 
            lowerName.includes('total') || lowerName.includes('cost')) {
            return 'DECIMAL(10,2)';
        }
        
        if (lowerName.includes('quantity') || lowerName.includes('count') || 
            lowerName.includes('number')) {
            return 'INTEGER';
        }

        if (lowerName.includes('date') || lowerName.includes('time')) {
            return 'DATETIME';
        }

        if (lowerName.includes('id') && lowerName !== 'id') {
            return 'INTEGER';
        }

        // Analyze actual data
        if (sample.every(val => !isNaN(val) && isFinite(val))) {
            const hasDecimals = sample.some(val => val % 1 !== 0);
            return hasDecimals ? 'DECIMAL(10,2)' : 'INTEGER';
        }

        if (sample.some(val => this.isDateLike(val))) {
            return 'DATETIME';
        }

        return 'TEXT';
    }

    inferConstraints(columnName, data) {
        const constraints = [];
        const lowerName = columnName?.toLowerCase() || '';

        // Not null if most values are present
        const nullCount = data.filter(val => val == null).length;
        if (nullCount / data.length < 0.1) {
            constraints.push('NOT NULL');
        }

        return constraints.join(' ');
    }

    isDateLike(value) {
        if (value instanceof Date) return true;
        if (typeof value !== 'string') return false;
        
        const date = new Date(value);
        return !isNaN(date.getTime()) && 
               (value.match(/\d{1,4}[-/]\d{1,2}[-/]\d{1,4}/) || 
                value.match(/\d{1,2}[-/]\d{1,2}[-/]\d{4}/));
    }

    async mapExcelRowToVenta(row, headers) {
        // Helper method to get value by possible column names
        const getValue = (possibleNames) => {
            for (const name of possibleNames) {
                const index = headers.findIndex(h => 
                    h && h.toString().toLowerCase().includes(name.toLowerCase())
                );
                if (index >= 0 && row[index] != null) {
                    return row[index];
                }
            }
            return null;
        };

        // Extract data from Excel row using flexible column matching
        const fecha = getValue(['fecha', 'date', 'día']) || new Date();
        const producto = getValue(['producto', 'product', 'item', 'coffee']);
        const categoria = getValue(['categoria', 'category', 'tipo']);
        const precio = getValue(['precio', 'price', 'total', 'amount']);
        const cantidad = getValue(['cantidad', 'quantity', 'qty']) || 1;
        const cliente = getValue(['cliente', 'customer', 'client']);
        const metodoPago = getValue(['pago', 'payment', 'método']);
        const sucursal = getValue(['sucursal', 'store', 'location', 'branch']);
        
        // Transform date
        const fechaObj = fecha instanceof Date ? fecha : new Date(fecha);
        const fechaISO = fechaObj.toISOString();
        const fechaDate = fechaISO.split('T')[0];
        const horaTime = fechaISO.split('T')[1].split('.')[0];
        
        // Calculate derived fields
        const diasSemana = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
        const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
                      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
        
        const diaSemana = diasSemana[fechaObj.getDay()];
        const nombreMes = meses[fechaObj.getMonth()];
        const hora = fechaObj.getHours();
        
        let periodoDia = 'Mañana';
        if (hora >= 12 && hora < 18) periodoDia = 'Tarde';
        else if (hora >= 18) periodoDia = 'Noche';

        // Get or create foreign key IDs
        const idProducto = await this.getOrCreateProducto(producto, categoria, precio);
        const idCliente = cliente ? await this.getOrCreateCliente(cliente) : null;
        const idSucursal = await this.getOrCreateSucursal(sucursal);
        const idMetodoPago = await this.getOrCreateMetodoPago(metodoPago);

        if (!idProducto || !idSucursal || !idMetodoPago) {
            throw new Error('Failed to resolve required foreign keys');
        }

        return {
            fecha_venta: fechaDate,
            fecha_hora_venta: fechaISO,
            hora_del_dia: horaTime,
            id_producto: idProducto,
            id_metodo_pago: idMetodoPago,
            id_cliente: idCliente,
            id_sucursal: idSucursal,
            precio_unitario: parseFloat(precio) || 0,
            cantidad: parseInt(cantidad) || 1,
            monto_total: (parseFloat(precio) || 0) * (parseInt(cantidad) || 1),
            periodo_dia: periodoDia,
            dia_semana: diaSemana,
            nombre_mes: nombreMes,
            numero_dia_semana: fechaObj.getDay(),
            numero_mes: fechaObj.getMonth() + 1
        };
    }

    async createIndexes() {
        console.log('🔍 Creating performance indexes...');

        const indexes = [
            // Ventas table indexes (most important for queries)
            'CREATE INDEX idx_ventas_fecha ON ventas(fecha_venta)',
            'CREATE INDEX idx_ventas_producto ON ventas(id_producto)',
            'CREATE INDEX idx_ventas_cliente ON ventas(id_cliente)',
            'CREATE INDEX idx_ventas_sucursal ON ventas(id_sucursal)',
            'CREATE INDEX idx_ventas_metodo_pago ON ventas(id_metodo_pago)',
            'CREATE INDEX idx_ventas_fecha_hora ON ventas(fecha_hora_venta)',
            'CREATE INDEX idx_ventas_mes ON ventas(numero_mes)',
            
            // Lookup table indexes
            'CREATE INDEX idx_productos_nombre ON productos(nombre_producto)',
            'CREATE INDEX idx_clientes_codigo ON clientes(codigo_anonimo)',
            'CREATE INDEX idx_sucursales_nombre ON sucursales(nombre_sucursal)',
            'CREATE INDEX idx_metodos_tipo ON metodos_pago(tipo_pago)',
            
            // Composite indexes for common queries
            'CREATE INDEX idx_ventas_fecha_sucursal ON ventas(fecha_venta, id_sucursal)',
            'CREATE INDEX idx_ventas_producto_fecha ON ventas(id_producto, fecha_venta)'
        ];

        for (const indexSQL of indexes) {
            try {
                await this.db.exec(indexSQL);
                const indexName = indexSQL.match(/CREATE INDEX (\w+)/)[1];
                console.log(`   ✓ Index created: ${indexName}`);
            } catch (error) {
                console.log(`   ⚠️  Index creation failed: ${error.message}`);
            }
        }
    }

    async importData() {
        console.log('\n📥 Importing data with ER normalization...');

        for (const sheetName of this.workbook.SheetNames) {
            const worksheet = this.workbook.Sheets[sheetName];
            const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
            
            if (data.length <= 1) {
                console.log(`⚠️  No data found in sheet: ${sheetName}`);
                continue;
            }

            const headers = data[0];
            const rows = data.slice(1);

            console.log(`📊 Processing ${rows.length} rows from sheet: ${sheetName}`);
            console.log(`📋 Headers found: ${headers.join(', ')}`);

            // Prepare insert statement for ventas table
            const insertSQL = `
                INSERT INTO ventas (
                    fecha_venta, fecha_hora_venta, hora_del_dia,
                    id_producto, id_metodo_pago, id_cliente, id_sucursal,
                    precio_unitario, cantidad, monto_total,
                    periodo_dia, dia_semana, nombre_mes,
                    numero_dia_semana, numero_mes
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `;

            const stmt = await this.db.prepare(insertSQL);
            let successCount = 0;
            let errorCount = 0;

            // Process rows with progress updates
            for (let i = 0; i < rows.length; i++) {
                const row = rows[i];
                
                // Show progress every 100 rows
                if (i > 0 && i % 100 === 0) {
                    console.log(`   📈 Processed ${i}/${rows.length} rows...`);
                }

                try {
                    // Map Excel row to normalized venta record
                    const ventaData = await this.mapExcelRowToVenta(row, headers);
                    
                    // Insert into ventas table
                    await stmt.run([
                        ventaData.fecha_venta,
                        ventaData.fecha_hora_venta,
                        ventaData.hora_del_dia,
                        ventaData.id_producto,
                        ventaData.id_metodo_pago,
                        ventaData.id_cliente,
                        ventaData.id_sucursal,
                        ventaData.precio_unitario,
                        ventaData.cantidad,
                        ventaData.monto_total,
                        ventaData.periodo_dia,
                        ventaData.dia_semana,
                        ventaData.nombre_mes,
                        ventaData.numero_dia_semana,
                        ventaData.numero_mes
                    ]);

                    successCount++;
                } catch (error) {
                    errorCount++;
                    if (errorCount <= 10) { // Show first 10 errors
                        console.log(`   ⚠️  Row ${i + 1} error: ${error.message}`);
                        if (errorCount === 10) {
                            console.log('   🔄 Further errors will be suppressed...');
                        }
                    }
                }
            }

            await stmt.finalize();
            
            console.log(`\n   ✅ Import completed for ${sheetName}:`);
            console.log(`      • ${successCount} rows imported successfully`);
            if (errorCount > 0) {
                console.log(`      • ${errorCount} rows failed to import`);
            }
        }

        // Update client statistics
        await this.updateClientStatistics();
    }

    async updateClientStatistics() {
        console.log('\n📊 Updating client statistics...');

        // Update total purchases and amounts for each client
        await this.db.exec(`
            UPDATE clientes SET 
                total_compras = (
                    SELECT COUNT(*) 
                    FROM ventas 
                    WHERE ventas.id_cliente = clientes.id_cliente
                ),
                monto_total_gastado = (
                    SELECT COALESCE(SUM(monto_total), 0) 
                    FROM ventas 
                    WHERE ventas.id_cliente = clientes.id_cliente
                ),
                fecha_primer_compra = (
                    SELECT MIN(fecha_venta) 
                    FROM ventas 
                    WHERE ventas.id_cliente = clientes.id_cliente
                ),
                fecha_ultima_compra = (
                    SELECT MAX(fecha_venta) 
                    FROM ventas 
                    WHERE ventas.id_cliente = clientes.id_cliente
                )
            WHERE id_cliente IN (SELECT DISTINCT id_cliente FROM ventas WHERE id_cliente IS NOT NULL)
        `);

        console.log('   ✅ Client statistics updated');
    }

    async generateReport() {
        console.log('\n📈 COFFEE SALES DATABASE REPORT');
        console.log('================================');
        
        try {
            // Overall statistics
            const ventas = await this.db.get('SELECT COUNT(*) as total FROM ventas');
            const productos = await this.db.get('SELECT COUNT(*) as total FROM productos');
            const clientes = await this.db.get('SELECT COUNT(*) as total FROM clientes');
            const sucursales = await this.db.get('SELECT COUNT(*) as total FROM sucursales');
            const metodosPago = await this.db.get('SELECT COUNT(*) as total FROM metodos_pago');
            
            console.log('\n📊 OVERVIEW:');
            console.log(`   • Sales Records: ${ventas.total}`);
            console.log(`   • Products: ${productos.total}`);
            console.log(`   • Clients: ${clientes.total}`);
            console.log(`   • Stores: ${sucursales.total}`);
            console.log(`   • Payment Methods: ${metodosPago.total}`);

            // Sales summary
            const totalRevenue = await this.db.get('SELECT SUM(monto_total) as total FROM ventas');
            const avgSale = await this.db.get('SELECT AVG(monto_total) as promedio FROM ventas');
            const dateRange = await this.db.get(`
                SELECT MIN(fecha_venta) as primera, MAX(fecha_venta) as ultima 
                FROM ventas
            `);

            console.log('\n💰 SALES SUMMARY:');
            console.log(`   • Total Revenue: $${(totalRevenue.total || 0).toFixed(2)}`);
            console.log(`   • Average Sale: $${(avgSale.promedio || 0).toFixed(2)}`);
            console.log(`   • Date Range: ${dateRange.primera} to ${dateRange.ultima}`);

            // Top products
            console.log('\n🏆 TOP 5 PRODUCTS:');
            const topProducts = await this.db.all(`
                SELECT p.nombre_producto, 
                       COUNT(*) as sales_count,
                       SUM(v.monto_total) as revenue
                FROM ventas v
                JOIN productos p ON v.id_producto = p.id_producto
                GROUP BY p.id_producto, p.nombre_producto
                ORDER BY revenue DESC
                LIMIT 5
            `);
            
            topProducts.forEach((product, index) => {
                console.log(`   ${index + 1}. ${product.nombre_producto}: ${product.sales_count} sales, $${product.revenue.toFixed(2)}`);
            });

            // Top clients
            console.log('\n👥 TOP 5 CLIENTS:');
            const topClients = await this.db.all(`
                SELECT c.codigo_anonimo,
                       c.total_compras,
                       c.monto_total_gastado
                FROM clientes c
                WHERE c.total_compras > 0
                ORDER BY c.monto_total_gastado DESC
                LIMIT 5
            `);
            
            if (topClients.length > 0) {
                topClients.forEach((client, index) => {
                    console.log(`   ${index + 1}. ${client.codigo_anonimo}: ${client.total_compras} purchases, $${client.monto_total_gastado.toFixed(2)}`);
                });
            } else {
                console.log('   No client data available (anonymous sales)');
            }

            // Store performance
            console.log('\n🏪 STORE PERFORMANCE:');
            const storeStats = await this.db.all(`
                SELECT s.nombre_sucursal,
                       COUNT(v.id_venta) as sales_count,
                       SUM(v.monto_total) as revenue
                FROM sucursales s
                LEFT JOIN ventas v ON s.id_sucursal = v.id_sucursal
                GROUP BY s.id_sucursal, s.nombre_sucursal
                ORDER BY revenue DESC
            `);
            
            storeStats.forEach((store, index) => {
                console.log(`   ${index + 1}. ${store.nombre_sucursal}: ${store.sales_count} sales, $${(store.revenue || 0).toFixed(2)}`);
            });

            // Monthly trends
            console.log('\n📅 MONTHLY SALES:');
            const monthlyStats = await this.db.all(`
                SELECT nombre_mes,
                       numero_mes,
                       COUNT(*) as sales_count,
                       SUM(monto_total) as revenue
                FROM ventas
                GROUP BY numero_mes, nombre_mes
                ORDER BY numero_mes
            `);
            
            monthlyStats.forEach(month => {
                console.log(`   ${month.nombre_mes}: ${month.sales_count} sales, $${month.revenue.toFixed(2)}`);
            });

        } catch (error) {
            console.log(`❌ Error generating report: ${error.message}`);
        }

        console.log(`\n💾 Database saved as: ${this.dbFile}`);
        console.log('🎯 Use "node query-db.js" to explore your data interactively!');
    }

    async run() {
        try {
            await this.initialize();
            await this.createERSchema();
            await this.importData();
            await this.generateReport();
            
            console.log('\n🎉 Import completed successfully!');
            console.log(`📊 Your data is now available in SQLite database: ${this.dbFile}`);
            
        } catch (error) {
            console.error('💥 Import failed:', error.message);
            throw error;
        } finally {
            if (this.db) {
                await this.db.close();
            }
        }
    }
}

// Run the importer
const main = async () => {
    const excelFile = 'Coffe_sales.xlsx'; // Keeping original filename
    const importer = new CoffeeSalesImporter(excelFile);
    
    try {
        await importer.run();
    } catch (error) {
        console.error('Script failed:', error.message);
        process.exit(1);
    }
};

main();