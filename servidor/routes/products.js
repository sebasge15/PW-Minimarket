const express = require('express');
const router = express.Router();
const db = require('../models');

// ✅ RUTA BÁSICA: OBTENER TODOS LOS PRODUCTOS
router.get('/', async (req, res) => {
  try {
    console.log('🔍 GET /api/products - Obteniendo todos los productos...');
    
    // Obtener productos activos
    const products = await db.Product.findAll({
      where: { 
        is_active: true 
      },
      order: [['created_at', 'DESC']]
    });
    
    console.log(`✅ ${products.length} productos encontrados`);
    
    // Log de algunos productos para debug
    if (products.length > 0) {
      console.log('📦 Primeros productos:');
      products.slice(0, 3).forEach((product, index) => {
        console.log(`   ${index + 1}. ${product.name} - $${product.price}`);
      });
    }
    
    res.status(200).json({
      success: true,
      count: products.length,
      products: products
    });
    
  } catch (error) {
    console.error('❌ Error al obtener productos:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor al obtener productos',
      error: error.message
    });
  }
});

// ✅ RUTA PARA PRODUCTOS DESTACADOS (la que ya funciona en HomePage)
router.get('/featured', async (req, res) => {
  try {
    console.log('🔍 GET /api/products/featured - Obteniendo productos destacados...');
    
    const featuredProducts = await db.Product.findAll({
      where: { 
        is_active: true,
        is_featured: true 
      },
      order: [['created_at', 'DESC']],
      limit: 10
    });
    
    console.log(`✅ ${featuredProducts.length} productos destacados encontrados`);
    
    res.status(200).json({
      success: true,
      count: featuredProducts.length,
      products: featuredProducts
    });
    
  } catch (error) {
    console.error('❌ Error al obtener productos destacados:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener productos destacados',
      error: error.message
    });
  }
});

// ✅ DEBUG: VER TODOS LOS PRODUCTOS (incluso inactivos)
router.get('/debug/all', async (req, res) => {
  try {
    const allProducts = await db.Product.findAll({
      order: [['created_at', 'DESC']]
    });
    
    console.log(`🔍 Debug - Total productos en BD: ${allProducts.length}`);
    console.log(`   - Activos: ${allProducts.filter(p => p.is_active).length}`);
    console.log(`   - Inactivos: ${allProducts.filter(p => !p.is_active).length}`);
    
    res.json({
      success: true,
      total: allProducts.length,
      active: allProducts.filter(p => p.is_active).length,
      inactive: allProducts.filter(p => !p.is_active).length,
      products: allProducts.map(p => ({
        id: p.id,
        name: p.name,
        price: p.price,
        category: p.category,
        is_active: p.is_active,
        is_featured: p.is_featured
      }))
    });
  } catch (error) {
    console.error('❌ Error en debug:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ✅ 1. RUTAS ESPECÍFICAS PRIMERO:

router.get('/search', async (req, res) => {
  try {
    const { q } = req.query;
    
    console.log(`🔍 Búsqueda solicitada: "${q}"`);
    
    if (!q || q.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'El parámetro de búsqueda es requerido'
      });
    }
    
    const searchTerm = q.trim();
    console.log(`🔍 Término de búsqueda procesado: "${searchTerm}"`);
    
    // Búsqueda en múltiples campos usando tu estructura existente
    const sql = `
      SELECT id, name, price, price_unit, image_url, old_price, discount, 
             category, description, presentation, stock, is_active, is_featured
      FROM products 
      WHERE is_active = true 
        AND (
          LOWER(name) LIKE LOWER($1) OR 
          LOWER(description) LIKE LOWER($1) OR 
          LOWER(category) LIKE LOWER($1) OR
          LOWER(presentation) LIKE LOWER($1)
        )
      ORDER BY 
        CASE 
          WHEN LOWER(name) LIKE LOWER($2) THEN 1
          WHEN LOWER(name) LIKE LOWER($1) THEN 2
          WHEN LOWER(category) LIKE LOWER($1) THEN 3
          ELSE 4
        END,
        name ASC
      LIMIT 20
    `;
    
    const searchPattern = `%${searchTerm}%`;
    const exactNamePattern = `${searchTerm}%`;
    
    const products = await db.sequelize.query(sql, {
      bind: [searchPattern, exactNamePattern],
      type: db.sequelize.QueryTypes.SELECT
    });
    
    console.log(`✅ Búsqueda completada: ${products.length} productos encontrados`);
    
    if (products.length > 0) {
      console.log('📦 Primeros resultados de búsqueda:');
      products.slice(0, 3).forEach((product, index) => {
        console.log(`   ${index + 1}. ${product.name} (${product.category})`);
      });
    }
    
    res.status(200).json({
      success: true,
      query: searchTerm,
      products: products.map(product => ({
        id: product.id,
        name: product.name,
        price: `S/ ${product.price} ${product.price_unit || ''}`,
        imageUrl: product.image_url,
        oldPrice: product.old_price ? `S/ ${product.old_price}` : null,
        discount: product.discount,
        category: product.category,
        description: product.description,
        presentation: product.presentation,
        stock: product.stock,
        isActive: product.is_active,
        isFeatured: product.is_featured
      })),
      count: products.length
    });
    
  } catch (error) {
    console.error('❌ Error en búsqueda de productos:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor en la búsqueda',
      error: error.message
    });
  }
});

// ✅ 2. RUTAS DEBUG:
router.get('/debug/all-categories', async (req, res) => {
  try {
    const products = await db.sequelize.query(`
      SELECT DISTINCT category, COUNT(*) as count
      FROM products 
      WHERE category IS NOT NULL
      GROUP BY category
      ORDER BY category ASC
    `, {
      type: db.sequelize.QueryTypes.SELECT
    });

    console.log('📂 Categorías en productos:');
    products.forEach(cat => {
      console.log(`   - "${cat.category}" (${cat.count} productos)`);
    });

    res.json({
      success: true,
      categories: products
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ✅ 3. RUTA POR ID (DESPUÉS de las específicas):
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Validar que el ID sea un número
    if (!/^\d+$/.test(id)) {
      return res.status(400).json({
        success: false,
        message: 'ID de producto inválido'
      });
    }
    
    console.log(`🔍 Buscando producto con ID: ${id}`);
    
    const products = await db.sequelize.query(`
      SELECT id, name, price, price_unit, image_url, old_price, discount, 
             category, description, presentation, stock, is_active, is_featured
      FROM products 
      WHERE id = $1 AND is_active = true
    `, {
      bind: [parseInt(id)], // 🔧 CONVERTIR A ENTERO
      type: db.sequelize.QueryTypes.SELECT
    });

    if (products.length === 0) {
      console.log(`❌ Producto con ID ${id} no encontrado`);
      return res.status(404).json({
        success: false,
        message: 'Producto no encontrado'
      });
    }

    const product = products[0];
    console.log(`✅ Producto encontrado: ${product.name}`);
    console.log(`🖼️ Imagen del producto: ${product.image_url}`);

    res.status(200).json({
      success: true,
      product: {
        id: product.id,
        name: product.name,
        price: `S/ ${product.price} ${product.price_unit || ''}`,
        imageUrl: product.image_url,
        oldPrice: product.old_price ? `S/ ${product.old_price}` : null,
        discount: product.discount,
        category: product.category,
        description: product.description,
        presentation: product.presentation,
        stock: product.stock,
        isActive: product.is_active,
        isFeatured: product.is_featured
      }
    });
  } catch (error) {
    console.error('❌ Error al obtener producto por ID:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
});

// ✅ 4. RUTA GENERAL (AL FINAL):
router.get('/', async (req, res) => {
  try {
    const { category, featured, active = true } = req.query;
    
    console.log('🔍 Parámetros recibidos:', { category, featured, active });
    
    let sql = `
      SELECT id, name, price, price_unit, image_url, old_price, discount, 
             category, description, presentation, stock, is_active, is_featured,
             created_at
      FROM products 
      WHERE 1=1
    `;
    
    const params = [];
    
    if (category) {
      sql += ` AND category = $${params.length + 1}`;
      params.push(category);
    }
    
    if (featured !== undefined) {
      sql += ` AND is_featured = $${params.length + 1}`;
      params.push(featured === 'true');
    }
    
    if (active !== undefined) {
      sql += ` AND is_active = $${params.length + 1}`;
      params.push(active === 'true');
    }
    
    sql += ` ORDER BY created_at DESC`;

    const products = await db.sequelize.query(sql, {
      bind: params,
      type: db.sequelize.QueryTypes.SELECT
    });

    console.log(`✅ Total productos encontrados: ${products.length}`);
    
    if (category) {
      console.log(`📂 Productos para categoría "${category}":`);
      products.forEach((product, index) => {
        console.log(`   ${index + 1}. ${product.name} - imagen: ${product.image_url}`);
      });
    }

    res.status(200).json({
      success: true,
      products: products.map(product => ({
        id: product.id,
        name: product.name,
        price: `S/ ${product.price} ${product.price_unit || ''}`,
        imageUrl: product.image_url,
        oldPrice: product.old_price ? `S/ ${product.old_price}` : null,
        discount: product.discount,
        category: product.category,
        description: product.description,
        presentation: product.presentation,
        stock: product.stock,
        isActive: product.is_active,
        isFeatured: product.is_featured
      }))
    });
  } catch (error) {
    console.error('❌ Error al obtener productos:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
});

module.exports = router;