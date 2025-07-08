const express = require('express');
const router = express.Router();
const db = require('../models');

// Obtener todas las categorías activas
router.get('/', async (req, res) => {
  try {
    console.log('🔍 Obteniendo todas las categorías...');
    
    // Primero intentar obtener de la tabla categories
    let categoriesFromTable = [];
    try {
      const sql = `
        SELECT c.id, c.name, c.description, c.image_url, c.is_active,
               COUNT(p.id) as product_count
        FROM categories c
        LEFT JOIN products p ON LOWER(c.name) = LOWER(p.category) AND p.is_active = true
        WHERE c.is_active = true 
        GROUP BY c.id, c.name, c.description, c.image_url, c.is_active
        ORDER BY c.name ASC
      `;
      
      categoriesFromTable = await db.sequelize.query(sql, {
        type: db.sequelize.QueryTypes.SELECT
      });
      
      console.log(`📊 Categorías desde tabla categories: ${categoriesFromTable.length}`);
    } catch (error) {
      console.log('⚠️ No se pudo acceder a tabla categories, usando products...');
    }
    
    // Si no hay categorías en la tabla categories, usar las de products
    let finalCategories = [];
    
    if (categoriesFromTable.length > 0) {
      finalCategories = categoriesFromTable.map(category => ({
        id: category.id,
        name: category.name,
        imageUrl: category.image_url,
        description: category.description || `${category.product_count} productos disponibles`,
        isActive: category.is_active,
        productCount: parseInt(category.product_count) || 0
      }));
    } else {
      // Fallback: usar categorías de la tabla products
      console.log('📦 Usando categorías desde tabla products...');
      
      const categoriesFromProducts = await db.sequelize.query(`
        SELECT 
          ROW_NUMBER() OVER (ORDER BY category) as id,
          category as name,
          COUNT(*) as product_count,
          MIN(image_url) as image_url
        FROM products 
        WHERE is_active = true 
          AND category IS NOT NULL 
          AND category != ''
        GROUP BY category
        ORDER BY category ASC
      `, {
        type: db.sequelize.QueryTypes.SELECT
      });
      
      finalCategories = categoriesFromProducts.map(category => ({
        id: category.id,
        name: category.name,
        imageUrl: category.image_url,
        description: `${category.product_count} productos disponibles`,
        isActive: true,
        productCount: parseInt(category.product_count) || 0
      }));
    }

    console.log(`✅ Total categorías finales: ${finalCategories.length}`);
    
    finalCategories.forEach((cat, index) => {
      console.log(`   ${index + 1}. ${cat.name} (${cat.productCount} productos)`);
    });

    res.status(200).json({
      success: true,
      count: finalCategories.length,
      categories: finalCategories
    });

  } catch (error) {
    console.error('❌ Error al obtener categorías:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
});

// Obtener productos por categoría específica
router.get('/:categoryName', async (req, res) => {
  try {
    const { categoryName } = req.params;
    
    console.log(`🔍 Buscando productos para categoría: "${categoryName}"`);
    
    // Buscar productos que coincidan con el nombre de la categoría
    const sql = `
      SELECT p.id, p.name, p.price, p.price_unit, p.image_url, p.old_price, 
             p.discount, p.category, p.description, p.presentation, p.stock
      FROM products p
      WHERE p.is_active = true 
        AND LOWER(p.category) = LOWER($1)
      ORDER BY p.name ASC
    `;

    const products = await db.sequelize.query(sql, {
      bind: [categoryName],
      type: db.sequelize.QueryTypes.SELECT
    });

    console.log(`✅ Productos encontrados en categoría "${categoryName}": ${products.length}`);
    
    if (products.length > 0) {
      console.log('📦 Primeros productos:');
      products.slice(0, 3).forEach((product, index) => {
        console.log(`   ${index + 1}. ${product.name} - ${product.category}`);
      });
    }

    // También obtener información de la categoría desde la tabla categories
    const categoryInfoSql = `
      SELECT id, name, description, image_url 
      FROM categories 
      WHERE LOWER(name) = LOWER($1) AND is_active = true
    `;
    
    const categoryInfo = await db.sequelize.query(categoryInfoSql, {
      bind: [categoryName],
      type: db.sequelize.QueryTypes.SELECT
    });

    res.status(200).json({
      success: true,
      category: categoryName,
      categoryInfo: categoryInfo.length > 0 ? {
        id: categoryInfo[0].id,
        name: categoryInfo[0].name,
        description: categoryInfo[0].description,
        imageUrl: categoryInfo[0].image_url
      } : null,
      products: products.map(product => ({
        id: product.id,
        name: product.name,
        price: product.price,
        priceUnit: product.price_unit,
        imageUrl: product.image_url,
        oldPrice: product.old_price,
        discount: product.discount,
        category: product.category,
        description: product.description,
        presentation: product.presentation,
        stock: product.stock
      })),
      count: products.length
    });

  } catch (error) {
    console.error('❌ Error al obtener productos por categoría:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
});

// Ruta debug para verificar productos por categoría
router.get('/debug/products/:categoryName', async (req, res) => {
  try {
    const { categoryName } = req.params;
    
    // Ver todos los valores únicos de category en products
    const categoriesInProducts = await db.sequelize.query(`
      SELECT DISTINCT category, COUNT(*) as count
      FROM products 
      WHERE is_active = true
      GROUP BY category
      ORDER BY category
    `, {
      type: db.sequelize.QueryTypes.SELECT
    });
    
    // Ver productos específicos de la categoría solicitada
    const productsInCategory = await db.sequelize.query(`
      SELECT name, category
      FROM products 
      WHERE LOWER(category) = LOWER($1) AND is_active = true
      LIMIT 10
    `, {
      bind: [categoryName],
      type: db.sequelize.QueryTypes.SELECT
    });
    
    res.json({
      success: true,
      requestedCategory: categoryName,
      allCategoriesInProducts: categoriesInProducts,
      productsInRequestedCategory: productsInCategory
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 🔍 DEBUG: Verificar datos en ambas tablas
router.get('/debug/tables', async (req, res) => {
  try {
    // Ver todas las categorías en la tabla categories
    const categoriesTable = await db.sequelize.query(`
      SELECT id, name, description, is_active 
      FROM categories 
      ORDER BY name ASC
    `, {
      type: db.sequelize.QueryTypes.SELECT
    });
    
    // Ver todas las categorías únicas en la tabla products
    const productsCategories = await db.sequelize.query(`
      SELECT DISTINCT category, COUNT(*) as product_count
      FROM products 
      WHERE is_active = true AND category IS NOT NULL AND category != ''
      GROUP BY category
      ORDER BY category ASC
    `, {
      type: db.sequelize.QueryTypes.SELECT
    });
    
    console.log('📊 TABLA CATEGORIES:');
    categoriesTable.forEach(cat => {
      console.log(`   - ID: ${cat.id}, Nombre: "${cat.name}", Activa: ${cat.is_active}`);
    });
    
    console.log('📦 CATEGORÍAS EN PRODUCTS:');
    productsCategories.forEach(cat => {
      console.log(`   - Categoría: "${cat.category}", Productos: ${cat.product_count}`);
    });
    
    res.json({
      success: true,
      categoriesTable: categoriesTable,
      productsCategories: productsCategories,
      tableCount: categoriesTable.length,
      productCategoriesCount: productsCategories.length
    });
    
  } catch (error) {
    console.error('❌ Error en debug:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;