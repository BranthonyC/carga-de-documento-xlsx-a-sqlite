-- ☕ COFFEE SALES DATABASE - INSERT TEMPLATES
-- ============================================
-- Basic INSERT templates for each table in the ER schema
-- Copy and modify these for your own data

-- ============================================================================
-- TABLA: CLIENTES
-- Estructura: Cliente con código anónimo y estadísticas
-- ============================================================================
INSERT INTO clientes (
    codigo_anonimo,
    tipo_cliente,
    fecha_primer_compra,
    fecha_ultima_compra,
    total_compras,
    monto_total_gastado,
    fecha_creacion
) VALUES (
    'ANON_001',                    -- Código único del cliente
    'Regular',                     -- Tipo: Regular, Premium, VIP
    '2024-01-15',                  -- Primera compra (YYYY-MM-DD)
    '2024-01-28',                  -- Última compra (YYYY-MM-DD)
    5,                             -- Total de compras realizadas
    45.50,                         -- Monto total gastado
    CURRENT_TIMESTAMP              -- Fecha de creación automática
);

-- ============================================================================
-- TABLA: PRODUCTOS
-- Estructura: Catálogo de productos con categorías y precios
-- ============================================================================
INSERT INTO productos (
    nombre_producto,
    categoria,
    precio_base,
    activo,
    fecha_creacion,
    fecha_actualizacion
) VALUES (
    'Cappuccino Grande',           -- Nombre del producto
    'Bebida Caliente',             -- Categoría (Bebida Caliente/Fría, Panadería, Postre, etc.)
    4.50,                          -- Precio base del producto
    1,                             -- Activo: 1=activo, 0=inactivo
    CURRENT_TIMESTAMP,             -- Fecha de creación
    CURRENT_TIMESTAMP              -- Fecha de última actualización
);

-- ============================================================================
-- TABLA: METODOS_PAGO
-- Estructura: Formas de pago disponibles
-- ============================================================================
INSERT INTO metodos_pago (
    tipo_pago,
    descripcion,
    activo,
    periodo_dia
) VALUES (
    'Tarjeta Crédito',             -- Tipo de pago
    'Tarjeta de crédito Visa/Mastercard', -- Descripción detallada
    1,                             -- Activo: 1=activo, 0=inactivo
    'Todo el día'                  -- Período disponible
);

-- ============================================================================
-- TABLA: SUCURSALES
-- Estructura: Ubicaciones de las tiendas
-- ============================================================================
INSERT INTO sucursales (
    nombre_sucursal,
    direccion,
    ciudad,
    activa,
    fecha_apertura,
    fecha_creacion
) VALUES (
    'Centro Histórico',            -- Nombre de la sucursal
    'Calle Principal 123',         -- Dirección física
    'Ciudad Central',              -- Ciudad donde está ubicada
    1,                             -- Activa: 1=activa, 0=cerrada
    '2023-06-15',                  -- Fecha de apertura (YYYY-MM-DD)
    CURRENT_TIMESTAMP              -- Fecha de creación del registro
);

-- ============================================================================
-- TABLA: VENTAS (Tabla principal con Foreign Keys)
-- Estructura: Transacciones de venta con todas las relaciones
-- ============================================================================
INSERT INTO ventas (
    fecha_venta,
    fecha_hora_venta,
    hora_del_dia,
    id_producto,                   -- FK → productos.id_producto
    id_metodo_pago,                -- FK → metodos_pago.id_metodo_pago
    id_cliente,                    -- FK → clientes.id_cliente (puede ser NULL)
    id_sucursal,                   -- FK → sucursales.id_sucursal
    precio_unitario,
    cantidad,
    monto_total,
    periodo_dia,
    dia_semana,
    nombre_mes,
    numero_dia_semana,
    numero_mes,
    fecha_creacion,
    fecha_actualizacion
) VALUES (
    '2024-01-15',                  -- Fecha de la venta (YYYY-MM-DD)
    '2024-01-15 09:30:00',         -- Fecha y hora completa (YYYY-MM-DD HH:MM:SS)
    '09:30:00',                    -- Solo la hora (HH:MM:SS)
    1,                             -- ID del producto (debe existir en tabla productos)
    2,                             -- ID del método de pago (debe existir en metodos_pago)
    5,                             -- ID del cliente (debe existir en clientes, o NULL)
    1,                             -- ID de la sucursal (debe existir en sucursales)
    4.50,                          -- Precio unitario del producto
    2,                             -- Cantidad vendida
    9.00,                          -- Monto total (precio_unitario × cantidad)
    'Mañana',                      -- Período del día: Mañana, Tarde, Noche
    'Lunes',                       -- Día de la semana en español
    'Enero',                       -- Nombre del mes en español
    1,                             -- Número del día de semana (0=Domingo, 1=Lunes, etc.)
    1,                             -- Número del mes (1=Enero, 2=Febrero, etc.)
    CURRENT_TIMESTAMP,             -- Fecha de creación del registro
    CURRENT_TIMESTAMP              -- Fecha de última actualización
);

-- ============================================================================
-- CONSULTAS DE VERIFICACIÓN
-- Ejecuta estas después de insertar datos para verificar las relaciones FK
-- ============================================================================

-- Verificar que los Foreign Keys funcionan correctamente:
SELECT 
    v.id_venta,
    p.nombre_producto,
    c.codigo_anonimo,
    s.nombre_sucursal,
    mp.tipo_pago,
    v.monto_total
FROM ventas v
JOIN productos p ON v.id_producto = p.id_producto
JOIN sucursales s ON v.id_sucursal = s.id_sucursal
JOIN metodos_pago mp ON v.id_metodo_pago = mp.id_metodo_pago
LEFT JOIN clientes c ON v.id_cliente = c.id_cliente
ORDER BY v.fecha_hora_venta DESC
LIMIT 5;

-- Verificar conteos de registros:
SELECT 'clientes' as tabla, COUNT(*) as registros FROM clientes
UNION ALL
SELECT 'productos', COUNT(*) FROM productos
UNION ALL
SELECT 'metodos_pago', COUNT(*) FROM metodos_pago
UNION ALL
SELECT 'sucursales', COUNT(*) FROM sucursales
UNION ALL
SELECT 'ventas', COUNT(*) FROM ventas
ORDER BY registros DESC;

-- ============================================================================
-- NOTAS IMPORTANTES:
-- ============================================================================
-- 1. Los IDs se auto-incrementan, no los incluyas en los INSERT
-- 2. Los Foreign Keys deben existir en las tablas referenciadas ANTES de insertar en ventas
-- 3. El campo id_cliente puede ser NULL para ventas anónimas
-- 4. Los campos con DEFAULT CURRENT_TIMESTAMP se llenan automáticamente
-- 5. Siempre verifica la integridad referencial después de insertar
-- ============================================================================