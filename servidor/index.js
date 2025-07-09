const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const app = express();

const db = require('./models');

// Importar rutas
const userRoutes = require('./routes/users');
const productRoutes = require('./routes/products');
const categoryRoutes = require('./routes/categories');
const orderRoutes = require('./routes/orders'); 
const adminRoutes = require('./routes/admin');

// ✅ CORS ÚNICO
app.use(cors({
  origin: 'http://localhost:5173',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

// ✅ MIDDLEWARE DE PARSING SIMPLIFICADO (sin verificación problemática)
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// CONFIGURACIÓN CORREGIDA para servir archivos estáticos
const assetsPath = path.join(__dirname, '..', 'src', 'assets');
console.log(`📁 Ruta absoluta de assets: ${assetsPath}`);

// Verificar que la carpeta existe y listar archivos
if (fs.existsSync(assetsPath)) {
  console.log(`✅ La carpeta de assets existe`);
  try {
    const files = fs.readdirSync(assetsPath);
    console.log(`📂 Archivos encontrados (${files.length}):`);
    files.forEach(file => {
      console.log(`   - ${file}`);
    });
  } catch (err) {
    console.error('❌ Error al leer la carpeta:', err.message);
  }
} else {
  console.error(`❌ La carpeta de assets NO existe en: ${assetsPath}`);
}

// Middleware de debugging para requests de assets
app.use('/assets', (req, res, next) => {
  const requestedFile = req.path;
  const fullPath = path.join(assetsPath, requestedFile);
  
  console.log(`\n📂 Solicitud de archivo estático:`);
  console.log(`   - Archivo solicitado: ${requestedFile}`);
  console.log(`   - Ruta completa: ${fullPath}`);
  console.log(`   - Existe: ${fs.existsSync(fullPath)}`);
  
  if (fs.existsSync(fullPath)) {
    console.log(`   ✅ Sirviendo archivo`);
  } else {
    console.log(`   ❌ Archivo no encontrado`);
  }
  
  next();
});

// Servir archivos estáticos con configuración específica
app.use('/assets', express.static(assetsPath, {
  // Opciones adicionales
  maxAge: 0, // Sin caché durante desarrollo
  setHeaders: (res, filePath) => {
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Cache-Control', 'no-cache');
    console.log(`   📤 Enviando archivo: ${path.basename(filePath)}`);
  }
}));

// ✅ LOGGING DE RUTAS PARA DETECTAR PROBLEMAS
console.log('🔍 Registrando rutas...');

try {
  app.use('/api/users', userRoutes);
  console.log('✅ Rutas de users registradas');
} catch (error) {
  console.error('❌ Error en rutas users:', error.message);
}

try {
  app.use('/api/products', productRoutes);
  console.log('✅ Rutas de products registradas');
} catch (error) {
  console.error('❌ Error en rutas products:', error.message);
}

try {
  app.use('/api/categories', categoryRoutes);
  console.log('✅ Rutas de categories registradas');
} catch (error) {
  console.error('❌ Error en rutas categories:', error.message);
}

try {
  app.use('/api/orders', orderRoutes);
  console.log('✅ Rutas de orders registradas');
} catch (error) {
  console.error('❌ Error en rutas orders:', error.message);
}

try {
  app.use('/api/admin', adminRoutes);
  console.log('✅ Rutas de admin registradas');
} catch (error) {
  console.error('❌ Error en rutas admin:', error.message);
}

// Ruta de prueba para assets
app.get('/api/test-assets', (req, res) => {
  try {
    const files = fs.readdirSync(assetsPath);
    res.json({
      success: true,
      assetsPath: assetsPath,
      exists: fs.existsSync(assetsPath),
      files: files,
      totalFiles: files.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      assetsPath: assetsPath
    });
  }
});

// Ruta para verificar si el servidor está funcionando
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Servidor funcionando correctamente',
    timestamp: new Date().toISOString()
  });
});

// ✅ MIDDLEWARE DE MANEJO DE ERRORES MEJORADO
app.use((err, req, res, next) => {
  console.error('❌ Error capturado:', err);
  
  // Verificar si ya se enviaron headers
  if (res.headersSent) {
    console.error('⚠️ Headers ya enviados, delegando al manejo por defecto');
    return next(err);
  }
  
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Error interno del servidor',
    error: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

// Sincronizar base de datos e iniciar servidor
const PORT = process.env.PORT || 3001;

db.sequelize.sync({ force: false })
  .then(() => {
    console.log('\n✅ Base de datos sincronizada correctamente');
    app.listen(PORT, () => {
      console.log(`\n🚀 Servidor escuchando en el puerto ${PORT}`);
      console.log(`📁 Archivos estáticos servidos desde: ${assetsPath}`);
      console.log(`🌐 Prueba una imagen: http://localhost:${PORT}/assets/polloentero.png`);
      console.log(`🔧 Debug de assets: http://localhost:${PORT}/api/test-assets\n`);
    });
  })
  .catch((error) => {
    console.error('❌ Error al sincronizar la base de datos:', error);
  });

module.exports = app;

