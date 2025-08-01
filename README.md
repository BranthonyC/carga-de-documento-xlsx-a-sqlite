# ☕ Coffee Sales Excel to SQLite Importer

Un sistema profesional para convertir datos de ventas de café desde Excel a una base de datos SQLite con esquema ER apropiado.

## 🚀 Instalación

```bash
# Instalar dependencias
npm install

# O si prefieres yarn (aunque honestamente, npm está bien)
yarn install
```

## 📊 Uso

### 1. Analizar el archivo Excel primero (recomendado)

Antes de importar todo como un salvaje, analiza qué contiene tu archivo:

```bash
npm run analyze
```

Esto te mostrará:
- 📋 Estructura de las hojas de cálculo
- 🔍 Tipos de datos inferidos
- 🎯 Esquema ER sugerido
- 🔗 Relaciones potenciales

### 2. Importar datos a SQLite

Una vez que sepas qué tienes, importa los datos:

```bash
npm start
```

El script:
- ✅ Crea un esquema ER inteligente
- 🔄 Transforma tipos de datos automáticamente
- 📚 Añade índices para mejor rendimiento
- 🛡️ Maneja errores de datos graciosamente
- 📈 Genera un reporte de resumen

### 3. Consultar la base de datos

Explora tus datos importados:

```bash
node query-db.js
```

Características del query tool:
- 🔥 Consultas predefinidas para análisis común
- 💬 Modo interactivo con prompt SQL
- 📊 Visualización de resultados en tabla
- 🔍 Detección automática de columnas relevantes

## 📁 Archivos Generados

- `coffee_sales.db` - Base de datos SQLite con tus datos
- `package.json` - Dependencias del proyecto
- Logs de importación en la consola

## 📊 Diagramas del Proceso

### Flujo Principal de Importación

```mermaid
flowchart TD
    A["📁 Archivo Excel<br/>(Coffe_sales.xlsx)"] --> B["🔍 Leer & Analizar<br/>Headers y Datos"]
    
    B --> C["🏗️ Crear Esquema ER<br/>5 Tablas Normalizadas"]
    
    C --> C1["📋 Crear tabla CLIENTES<br/>(id, codigo_anonimo, tipo_cliente...)"]
    C --> C2["📦 Crear tabla PRODUCTOS<br/>(id, nombre_producto, categoria...)"]
    C --> C3["💳 Crear tabla METODOS_PAGO<br/>(id, tipo_pago, descripcion...)"]
    C --> C4["🏪 Crear tabla SUCURSALES<br/>(id, nombre_sucursal, ciudad...)"]
    C --> C5["💰 Crear tabla VENTAS<br/>(id, fecha, FK_producto, FK_cliente...)"]
    
    C1 --> D["🔍 Crear Índices<br/>Para Performance"]
    C2 --> D
    C3 --> D
    C4 --> D
    C5 --> D
    
    D --> E["🗂️ Inicializar<br/>Caché de Lookups"]
    
    E --> F["📊 Procesar Filas<br/>del Excel"]
    
    F --> G["🎯 Mapeo Inteligente<br/>Columnas → Campos"]
    
    G --> G1["🔍 Extraer Producto<br/>+ Categoría"]
    G --> G2["👤 Extraer Cliente<br/>+ Tipo"]
    G --> G3["💳 Extraer Método Pago"]
    G --> G4["🏪 Extraer Sucursal<br/>+ Ubicación"]
    G --> G5["📅 Extraer & Calcular<br/>Fechas + Períodos"]
    
    G1 --> H1["🔄 Lookup/Insert<br/>PRODUCTOS"]
    G2 --> H2["🔄 Lookup/Insert<br/>CLIENTES"]
    G3 --> H3["🔄 Lookup/Insert<br/>METODOS_PAGO"]
    G4 --> H4["🔄 Lookup/Insert<br/>SUCURSALES"]
    
    H1 --> I["💾 Insert VENTA<br/>con Foreign Keys"]
    H2 --> I
    H3 --> I
    H4 --> I
    G5 --> I
    
    I --> J{{"🔄 ¿Más filas<br/>en Excel?"}}
    
    J -->|Si| F
    J -->|No| K["📈 Actualizar<br/>Estadísticas Clientes"]
    
    K --> L["📊 Generar Reporte<br/>Completo"]
    
    L --> M["✅ Base de Datos<br/>Lista para Consultas"]
    
    M --> N["🔥 Query Tool<br/>12 Consultas Avanzadas"]
    
    subgraph Cache ["🧠 Sistema de Caché"]
        CA["Productos Cache"]
        CB["Clientes Cache"] 
        CC["Sucursales Cache"]
        CD["Métodos Pago Cache"]
    end
    
    H1 -.-> CA
    H2 -.-> CB
    H3 -.-> CD
    H4 -.-> CC
    
    subgraph ER ["🏛️ Esquema ER Final"]
        ERA["CLIENTES<br/>↓ 1:N"]
        ERB["PRODUCTOS<br/>↓ 1:N"]
        ERC["METODOS_PAGO<br/>↓ 1:N"]
        ERD["SUCURSALES<br/>↓ 1:N"]
        ERE["VENTAS<br/>(Tabla Central)"]
        
        ERA --> ERE
        ERB --> ERE
        ERC --> ERE
        ERD --> ERE
    end
    
    M -.-> ER
    
    style A fill:#e1f5fe
    style M fill:#c8e6c9
    style N fill:#fff3e0
    style ER fill:#f3e5f5
    style Cache fill:#fff8e1
```

### Transformación de Datos por Fila

```mermaid
graph LR
    subgraph Excel ["📊 Fila Excel Original"]
        E1["Fecha: 2024-01-15 09:30"]
        E2["Producto: Cappuccino Grande"]
        E3["Precio: $4.50"]
        E4["Cliente: ANON_12345"]
        E5["Sucursal: Centro Mall"]
        E6["Pago: Tarjeta Credito"]
    end
    
    subgraph Transform ["🔄 Transformación Inteligente"]
        T1["📅 Calcular:<br/>• Día semana: Lunes<br/>• Período: Mañana<br/>• Mes: Enero"]
        T2["🔍 Normalizar:<br/>• Categoría: Bebida Caliente<br/>• Precio base: $4.50"]
        T3["👤 Identificar:<br/>• Tipo: Regular<br/>• Nuevo/Existente"]
        T4["🏪 Geocodificar:<br/>• Ciudad: Centro<br/>• Activa: true"]
        T5["💳 Categorizar:<br/>• Tipo: Tarjeta<br/>• Descripción: Crédito"]
    end
    
    subgraph Lookup ["🗂️ Sistema Lookup/Cache"]
        L1["🔍 Buscar Producto<br/>Cache: cappuccino grande<br/>→ id_producto: 15"]
        L2["🔍 Buscar Cliente<br/>Cache: anon_12345<br/>→ id_cliente: 234"]
        L3["🔍 Buscar Sucursal<br/>Cache: centro mall<br/>→ id_sucursal: 3"]
        L4["🔍 Buscar Método<br/>Cache: tarjeta credito<br/>→ id_metodo: 2"]
    end
    
    subgraph Tables ["🏛️ Inserción en Tablas ER"]
        TB1["📦 PRODUCTOS<br/>(si no existe)<br/>INSERT: Cappuccino Grande"]
        TB2["👤 CLIENTES<br/>(si no existe)<br/>INSERT: ANON_12345"]
        TB3["🏪 SUCURSALES<br/>(si no existe)<br/>INSERT: Centro Mall"]
        TB4["💳 METODOS_PAGO<br/>(si no existe)<br/>INSERT: Tarjeta Credito"]
        TB5["💰 VENTAS<br/>INSERT con FKs:<br/>• id_producto: 15<br/>• id_cliente: 234<br/>• id_sucursal: 3<br/>• id_metodo: 2<br/>• fecha_venta: 2024-01-15<br/>• periodo_dia: Mañana<br/>• dia_semana: Lunes<br/>• monto_total: 4.50"]
    end
    
    E1 --> T1
    E2 --> T2
    E3 --> T2
    E4 --> T3
    E5 --> T4
    E6 --> T5
    
    T2 --> L1
    T3 --> L2
    T4 --> L3
    T5 --> L4
    
    L1 --> TB1
    L2 --> TB2
    L3 --> TB3
    L4 --> TB4
    
    TB1 --> TB5
    TB2 --> TB5
    TB3 --> TB5
    TB4 --> TB5
    T1 --> TB5
    
    style Excel fill:#e3f2fd
    style Transform fill:#f3e5f5
    style Lookup fill:#fff8e1
    style Tables fill:#e8f5e8
```

## 🔧 Características Técnicas

### Esquema ER Profesional
Implementa exactamente el diagrama ER proporcionado con:
- **5 Tablas Normalizadas**: `clientes`, `productos`, `metodos_pago`, `sucursales`, `ventas`
- **Relaciones Foreign Key**: Integridad referencial completa
- **Índices Optimizados**: Para consultas de alto rendimiento
- **Campos Calculados**: Derivaciones automáticas (día de semana, período del día, etc.)

### Normalización Inteligente
- **Lookup Tables**: Crea automáticamente registros de productos, clientes, sucursales
- **Deduplicación**: Evita duplicados usando caché inteligente
- **Mapeo Flexible**: Reconoce columnas del Excel por nombres similares
- **Estadísticas Cliente**: Calcula automáticamente totales de compras y fechas

### Transformación de Datos Avanzada
- **Fechas y Horas**: Extrae fecha, hora, día de semana, mes, período del día
- **Montos**: Calcula totales basados en precio unitario × cantidad
- **Categorización**: Clasifica automáticamente datos por tipo
- **Validación**: Maneja errores graciosamente con reportes detallados

### Estructura de la Base de Datos ER

El sistema implementa exactamente este esquema normalizado:

```
📋 CLIENTES
├── id_cliente (PK)
├── codigo_anonimo 
├── tipo_cliente
├── fecha_primer_compra
├── fecha_ultima_compra
├── total_compras (calculado)
├── monto_total_gastado (calculado)
└── fecha_creacion

📦 PRODUCTOS  
├── id_producto (PK)
├── nombre_producto
├── categoria
├── precio_base
├── activo
├── fecha_creacion
└── fecha_actualizacion

💳 METODOS_PAGO
├── id_metodo_pago (PK)
├── tipo_pago
├── descripcion
├── activo
└── periodo_dia

🏪 SUCURSALES
├── id_sucursal (PK)
├── nombre_sucursal
├── direccion
├── ciudad
├── activa
├── fecha_apertura
└── fecha_creacion

💰 VENTAS (tabla principal)
├── id_venta (PK)
├── fecha_venta
├── fecha_hora_venta
├── hora_del_dia
├── id_producto (FK → productos)
├── id_metodo_pago (FK → metodos_pago)
├── id_cliente (FK → clientes)
├── id_sucursal (FK → sucursales)
├── precio_unitario
├── cantidad
├── monto_total
├── periodo_dia (Mañana/Tarde/Noche)
├── dia_semana
├── nombre_mes
├── numero_dia_semana
├── numero_mes
├── fecha_creacion
└── fecha_actualizacion
```

### 12 Consultas Predefinidas Avanzadas
1. **Ventas Recientes**: Con nombres de productos y sucursales
2. **Resumen por Producto**: Análisis completo de performance
3. **Totales Diarios**: Tendencias temporales detalladas
4. **Top Productos**: Ranking por unidades vendidas
5. **Tendencias Mensuales**: Análisis de estacionalidad
6. **Análisis de Clientes**: Segmentación VIP/Premium/Regular
7. **Performance Sucursales**: Comparación entre tiendas
8. **Métodos de Pago**: Preferencias y distribución
9. **Ventas por Hora**: Análisis de períodos del día
10. **Categorías**: Performance por tipo de producto
11. **Esquemas**: Estructura completa de la base de datos
12. **Estadísticas**: Resumen ejecutivo de registros

## 🎯 Mejores Prácticas

### Para Datos de Ventas de Café
El sistema está optimizado para reconocer automáticamente:
- `product`, `item`, `coffee_type` → Productos
- `price`, `amount`, `total` → Montos monetarios
- `quantity`, `count` → Cantidades
- `date`, `timestamp` → Fechas/tiempos
- `customer`, `client` → Información de clientes

### Consejos de Rendimiento
- **Índices automáticos** en columnas ID, fecha y cliente
- **Tipos de datos optimizados** para cada columna
- **Transacciones por lotes** para imports grandes
- **Manejo de errores** que no interrumpe el import completo

## 🚨 Solución de Problemas

### Error: "File not found"
- Verifica que `Coffe_sales.xlsx` esté en el directorio
- Revisa la ortografía del nombre del archivo

### Error: "Cannot read Excel file"
- Asegúrate que el archivo no esté abierto en Excel
- Verifica que sea un archivo Excel válido (.xlsx)

### Datos no se importan correctamente
- Ejecuta `npm run analyze` primero
- Revisa que las columnas tengan headers válidos
- Verifica que no haya celdas combinadas en los headers

### Performance lenta
- El script crea índices automáticamente
- Para archivos >100k filas, considera dividir los datos
- SQLite puede manejar millones de filas sin problemas

## 🔮 Próximas Características

- [ ] Exportar resultados a CSV
- [ ] Interfaz web para consultas
- [ ] Detección automática de relaciones FK
- [ ] Validación de datos pre-import
- [ ] Soporte para múltiples archivos Excel
- [ ] Generación de reportes PDF

## 🤝 Contribuir

Si encuentras bugs o tienes ideas brillantes:
1. Fork el repo
2. Crea una branch con nombre descriptivo
3. Haz tus cambios sin romper nada
4. Submit un PR con explicación clara

## 📄 Licencia

MIT - Haz lo que quieras, pero no me culpes si explota

---

*Built with ☕ and a healthy dose of sarcasm by a senior dev who's tired of Excel chaos*# carga-de-documento-xlsx-a-sqlite
