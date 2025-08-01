import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import readline from 'readline';

/**
 * Interactive SQLite Query Tool
 * Because someone needs to make sense of the data after importing it
 */
class DatabaseQueryTool {
    constructor(dbFile = 'coffee_sales.db') {
        this.dbFile = dbFile;
        this.db = null;
        this.rl = null;
    }

    async initialize() {
        console.log('🔍 Coffee Sales Database Query Tool');
        console.log('====================================');
        
        try {
            this.db = await open({
                filename: this.dbFile,
                driver: sqlite3.Database
            });
            
            console.log(`📊 Connected to: ${this.dbFile}`);
            
            // Show available tables
            await this.showTables();
            
        } catch (error) {
            console.error(`❌ Failed to connect to database: ${error.message}`);
            console.log('💡 Tip: Run the import script first to create the database');
            process.exit(1);
        }
    }

    async showTables() {
        const tables = await this.db.all(`
            SELECT name FROM sqlite_master 
            WHERE type='table' AND name NOT LIKE 'sqlite_%'
            ORDER BY name
        `);

        if (tables.length === 0) {
            console.log('⚠️  No tables found in database');
            return;
        }

        console.log('\n📋 Available Tables:');
        for (const table of tables) {
            console.log(`   • ${table.name}`);
            
            // Show column info
            const columns = await this.db.all(`PRAGMA table_info(${table.name})`);
            columns.forEach(col => {
                const pk = col.pk ? ' (PK)' : '';
                console.log(`     - ${col.name}: ${col.type}${pk}`);
            });
            
            // Show row count
            const count = await this.db.get(`SELECT COUNT(*) as count FROM ${table.name}`);
            console.log(`     📊 Rows: ${count.count}`);
        }
    }

    async showPresetQueries() {
        console.log('\n🔥 PRESET QUERIES FOR COFFEE SALES ER DATABASE:');
        console.log('================================================');
        console.log('1. Show recent sales (with product names)');
        console.log('2. Sales summary by product');
        console.log('3. Daily sales totals');
        console.log('4. Top selling products');
        console.log('5. Monthly revenue trends');
        console.log('6. Customer analysis');
        console.log('7. Store performance comparison');
        console.log('8. Payment method preferences');
        console.log('9. Sales by time of day');
        console.log('10. Product category analysis');
        console.log('11. Show table schemas');
        console.log('12. Database statistics');
        console.log('help - Show this menu');
        console.log('quit - Exit the tool');
    }

    async executePresetQuery(number) {
        switch (number) {
            case '1': // Recent sales with product names
                return await this.runQuery(`
                    SELECT 
                        v.fecha_venta as fecha,
                        v.hora_del_dia as hora,
                        p.nombre_producto as producto,
                        p.categoria,
                        v.cantidad,
                        v.precio_unitario,
                        v.monto_total,
                        s.nombre_sucursal as sucursal,
                        mp.tipo_pago as pago
                    FROM ventas v
                    JOIN productos p ON v.id_producto = p.id_producto
                    JOIN sucursales s ON v.id_sucursal = s.id_sucursal
                    JOIN metodos_pago mp ON v.id_metodo_pago = mp.id_metodo_pago
                    ORDER BY v.fecha_hora_venta DESC
                    LIMIT 20
                `);
            
            case '2': // Sales summary by product
                return await this.runQuery(`
                    SELECT 
                        p.nombre_producto as producto,
                        p.categoria,
                        COUNT(v.id_venta) as cantidad_vendida,
                        SUM(v.monto_total) as ingresos_totales,
                        AVG(v.precio_unitario) as precio_promedio,
                        MIN(v.fecha_venta) as primera_venta,
                        MAX(v.fecha_venta) as ultima_venta
                    FROM productos p
                    LEFT JOIN ventas v ON p.id_producto = v.id_producto
                    GROUP BY p.id_producto, p.nombre_producto, p.categoria
                    ORDER BY ingresos_totales DESC
                `);
            
            case '3': // Daily sales totals
                return await this.runQuery(`
                    SELECT 
                        fecha_venta as fecha,
                        dia_semana,
                        COUNT(*) as num_transacciones,
                        SUM(cantidad) as productos_vendidos,
                        SUM(monto_total) as ingresos_dia,
                        AVG(monto_total) as ticket_promedio
                    FROM ventas
                    GROUP BY fecha_venta, dia_semana
                    ORDER BY fecha_venta DESC
                    LIMIT 30
                `);
            
            case '4': // Top selling products
                return await this.runQuery(`
                    SELECT 
                        p.nombre_producto as producto,
                        p.categoria,
                        SUM(v.cantidad) as unidades_vendidas,
                        COUNT(v.id_venta) as transacciones,
                        SUM(v.monto_total) as ingresos_totales,
                        AVG(v.precio_unitario) as precio_promedio
                    FROM ventas v
                    JOIN productos p ON v.id_producto = p.id_producto
                    GROUP BY p.id_producto, p.nombre_producto, p.categoria
                    ORDER BY unidades_vendidas DESC
                    LIMIT 15
                `);
            
            case '5': // Monthly revenue trends
                return await this.runQuery(`
                    SELECT 
                        nombre_mes as mes,
                        numero_mes,
                        COUNT(*) as transacciones,
                        SUM(cantidad) as productos_vendidos,
                        SUM(monto_total) as ingresos,
                        AVG(monto_total) as ticket_promedio,
                        COUNT(DISTINCT id_producto) as productos_unicos
                    FROM ventas
                    GROUP BY numero_mes, nombre_mes
                    ORDER BY numero_mes
                `);
            
            case '6': // Customer analysis
                return await this.runQuery(`
                    SELECT 
                        c.codigo_anonimo as cliente,
                        c.tipo_cliente,
                        c.total_compras,
                        c.monto_total_gastado as total_gastado,
                        c.fecha_primer_compra,
                        c.fecha_ultima_compra,
                        ROUND(c.monto_total_gastado / c.total_compras, 2) as ticket_promedio,
                        CASE 
                            WHEN c.monto_total_gastado > 1000 THEN 'VIP'
                            WHEN c.monto_total_gastado > 500 THEN 'Premium'
                            WHEN c.monto_total_gastado > 100 THEN 'Regular'
                            ELSE 'Nuevo'
                        END as segmento
                    FROM clientes c
                    WHERE c.total_compras > 0
                    ORDER BY c.monto_total_gastado DESC
                    LIMIT 20
                `);
            
            case '7': // Store performance comparison
                return await this.runQuery(`
                    SELECT 
                        s.nombre_sucursal as sucursal,
                        s.ciudad,
                        COUNT(v.id_venta) as transacciones,
                        SUM(v.monto_total) as ingresos_totales,
                        AVG(v.monto_total) as ticket_promedio,
                        COUNT(DISTINCT v.id_producto) as productos_vendidos,
                        COUNT(DISTINCT v.id_cliente) as clientes_unicos,
                        MIN(v.fecha_venta) as primera_venta,
                        MAX(v.fecha_venta) as ultima_venta
                    FROM sucursales s
                    LEFT JOIN ventas v ON s.id_sucursal = v.id_sucursal
                    GROUP BY s.id_sucursal, s.nombre_sucursal, s.ciudad
                    ORDER BY ingresos_totales DESC
                `);
            
            case '8': // Payment method preferences
                return await this.runQuery(`
                    SELECT 
                        mp.tipo_pago as metodo_pago,
                        mp.descripcion,
                        COUNT(v.id_venta) as transacciones,
                        SUM(v.monto_total) as ingresos_totales,
                        AVG(v.monto_total) as ticket_promedio,
                        ROUND(COUNT(v.id_venta) * 100.0 / (SELECT COUNT(*) FROM ventas), 2) as porcentaje_uso
                    FROM metodos_pago mp
                    LEFT JOIN ventas v ON mp.id_metodo_pago = v.id_metodo_pago
                    GROUP BY mp.id_metodo_pago, mp.tipo_pago, mp.descripcion
                    ORDER BY transacciones DESC
                `);
            
            case '9': // Sales by time of day
                return await this.runQuery(`
                    SELECT 
                        periodo_dia,
                        COUNT(*) as transacciones,
                        SUM(monto_total) as ingresos,
                        AVG(monto_total) as ticket_promedio,
                        ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM ventas), 2) as porcentaje_ventas
                    FROM ventas
                    GROUP BY periodo_dia
                    ORDER BY 
                        CASE periodo_dia 
                            WHEN 'Mañana' THEN 1 
                            WHEN 'Tarde' THEN 2 
                            WHEN 'Noche' THEN 3 
                        END
                `);
            
            case '10': // Product category analysis
                return await this.runQuery(`
                    SELECT 
                        COALESCE(p.categoria, 'Sin categoría') as categoria,
                        COUNT(DISTINCT p.id_producto) as productos_categoria,
                        COUNT(v.id_venta) as transacciones,
                        SUM(v.cantidad) as unidades_vendidas,
                        SUM(v.monto_total) as ingresos_totales,
                        AVG(v.precio_unitario) as precio_promedio,
                        MAX(v.monto_total) as venta_mayor,
                        MIN(v.monto_total) as venta_menor
                    FROM productos p
                    LEFT JOIN ventas v ON p.id_producto = v.id_producto
                    GROUP BY p.categoria
                    ORDER BY ingresos_totales DESC
                `);
            
            case '11': // Show table schemas
                console.log('\n📋 DATABASE SCHEMA:');
                console.log('===================');
                
                const tables = ['clientes', 'productos', 'metodos_pago', 'sucursales', 'ventas'];
                for (const table of tables) {
                    console.log(`\n🔸 Table: ${table}`);
                    const schema = await this.db.all(`PRAGMA table_info(${table})`);
                    schema.forEach(col => {
                        const pk = col.pk ? ' (PK)' : '';
                        const nullable = col.notnull ? ' NOT NULL' : '';
                        console.log(`   ${col.name}: ${col.type}${nullable}${pk}`);
                    });
                }
                return;
            
            case '12': // Database statistics
                return await this.runQuery(`
                    SELECT 
                        'ventas' as tabla, COUNT(*) as registros 
                    FROM ventas
                    UNION ALL
                    SELECT 'productos', COUNT(*) FROM productos
                    UNION ALL
                    SELECT 'clientes', COUNT(*) FROM clientes
                    UNION ALL
                    SELECT 'sucursales', COUNT(*) FROM sucursales
                    UNION ALL
                    SELECT 'metodos_pago', COUNT(*) FROM metodos_pago
                    ORDER BY registros DESC
                `);
            
            default:
                console.log('❌ Invalid option. Type "help" to see available queries.');
        }
    }

    async findColumns(tableName, keywords) {
        const columns = await this.db.all(`PRAGMA table_info(${tableName})`);
        return columns
            .filter(col => keywords.some(keyword => 
                col.name.toLowerCase().includes(keyword.toLowerCase())
            ))
            .map(col => col.name);
    }

    async runQuery(sql) {
        try {
            console.log(`\n🔍 Running: ${sql.trim()}`);
            console.log('─'.repeat(50));
            
            const results = await this.db.all(sql);
            
            if (results.length === 0) {
                console.log('📭 No results found');
                return;
            }

            // Pretty print results
            console.table(results);
            console.log(`\n📊 ${results.length} row(s) returned`);
            
        } catch (error) {
            console.error(`❌ Query error: ${error.message}`);
        }
    }

    async startInteractiveMode() {
        this.rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout,
            prompt: 'coffee-db> '
        });

        await this.showPresetQueries();
        console.log('\n💡 You can also type any SQL query directly!\n');

        this.rl.prompt();

        this.rl.on('line', async (input) => {
            const trimmed = input.trim();
            
            if (trimmed === 'quit' || trimmed === 'exit') {
                console.log('👋 Goodbye!');
                this.rl.close();
                return;
            }
            
            if (trimmed === 'help') {
                await this.showPresetQueries();
                this.rl.prompt();
                return;
            }
            
            if (trimmed === 'tables') {
                await this.showTables();
                this.rl.prompt();
                return;
            }

            // Check if it's a preset query number
            if (/^\d+$/.test(trimmed)) {
                await this.executePresetQuery(trimmed);
            } else if (trimmed.length > 0) {
                // Execute as SQL
                await this.runQuery(trimmed);
            }
            
            this.rl.prompt();
        });

        this.rl.on('close', async () => {
            if (this.db) {
                await this.db.close();
            }
            process.exit(0);
        });
    }

    async run() {
        await this.initialize();
        await this.startInteractiveMode();
    }
}

// Run the query tool
const queryTool = new DatabaseQueryTool();
queryTool.run().catch(error => {
    console.error('Query tool failed:', error.message);
    process.exit(1);
});