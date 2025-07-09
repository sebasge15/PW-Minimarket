const express = require('express');
const router = express.Router();
const db = require('../models');

// ✅ ESTADÍSTICAS GENERALES DEL DASHBOARD
router.get('/stats', async (req, res) => {
  try {
    console.log('🔍 Obteniendo estadísticas del dashboard...');
    
    let totalOrders = 0;
    let newUsers = 0;
    let totalRevenue = 0;
    
    // Contar total de órdenes
    try {
      const totalOrdersResult = await db.sequelize.query(
        'SELECT COUNT(*) as count FROM orders',
        { type: db.sequelize.QueryTypes.SELECT }
      );
      totalOrders = parseInt(totalOrdersResult[0]?.count || 0);
      console.log('📊 Total órdenes:', totalOrders);
    } catch (error) {
      console.warn('⚠️ No se pudo contar órdenes:', error.message);
    }
    
    // Contar usuarios nuevos (últimos 30 días) - usando "createdAt"
    try {
      const newUsersResult = await db.sequelize.query(
        `SELECT COUNT(*) as count FROM users 
         WHERE "createdAt" >= CURRENT_DATE - INTERVAL '30 days'`,
        { type: db.sequelize.QueryTypes.SELECT }
      );
      newUsers = parseInt(newUsersResult[0]?.count || 0);
      console.log('👥 Usuarios nuevos (30 días):', newUsers);
    } catch (error) {
      console.warn('⚠️ No se pudo contar usuarios nuevos:', error.message);
      // Fallback: contar todos los usuarios
      try {
        const allUsersResult = await db.sequelize.query(
          'SELECT COUNT(*) as count FROM users',
          { type: db.sequelize.QueryTypes.SELECT }
        );
        newUsers = parseInt(allUsersResult[0]?.count || 0);
        console.log('👥 Total usuarios (fallback):', newUsers);
      } catch (fallbackError) {
        console.warn('⚠️ No se pudo contar usuarios en absoluto');
      }
    }
    
    // Calcular ingresos totales
    try {
      const revenueResult = await db.sequelize.query(
        `SELECT SUM(total_amount) as revenue FROM orders 
         WHERE status ILIKE '%entregado%' OR status ILIKE '%completado%'`,
        { type: db.sequelize.QueryTypes.SELECT }
      );
      totalRevenue = parseFloat(revenueResult[0]?.revenue || 0);
      console.log('💰 Ingresos totales (entregado/completado):', totalRevenue);
      
      // Si no hay órdenes entregadas, mostrar el total de todas las órdenes
      if (totalRevenue === 0) {
        const allRevenueResult = await db.sequelize.query(
          'SELECT SUM(total_amount) as revenue FROM orders',
          { type: db.sequelize.QueryTypes.SELECT }
        );
        totalRevenue = parseFloat(allRevenueResult[0]?.revenue || 0);
        console.log('💰 Ingresos totales (todas las órdenes):', totalRevenue);
      }
    } catch (error) {
      console.warn('⚠️ No se pudo calcular ingresos:', error.message);
    }
    
    const stats = {
      totalOrders: totalOrders,
      newUsers: newUsers,
      totalRevenue: totalRevenue
    };
    
    console.log('📊 Estadísticas finales:', stats);
    
    res.status(200).json({
      success: true,
      stats: stats
    });
    
  } catch (error) {
    console.error('❌ Error al obtener estadísticas:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener estadísticas',
      error: error.message
    });
  }
});

// ✅ USUARIOS RECIENTES (usando columnas correctas)
router.get('/users/recent', async (req, res) => {
  try {
    console.log('🔍 Obteniendo usuarios recientes...');
    
    const users = await db.user.findAll({
      attributes: [
        'id', 
        'nombre', 
        'apellido', 
        'email', 
        'dni', 
        'role', 
        'is_active',  // ✅ IMPORTANTE: Incluir este campo
        'createdAt', 
        'updatedAt'
      ],
      order: [['createdAt', 'DESC']],
      limit: 10
    });

    console.log(`✅ ${users.length} usuarios encontrados`);

    const formattedUsers = users.map(user => ({
      id: user.id,
      nombre: `${user.nombre} ${user.apellido || ''}`.trim(),
      email: user.email,
      dni: user.dni,
      role: user.role || 'user',
      is_active: user.is_active,  // ✅ INCLUIR EN LA RESPUESTA
      created_at: user.createdAt,
      updated_at: user.updatedAt
    }));
    
    res.status(200).json({
      success: true,
      users: formattedUsers,
      debug: {
        originalUsers: users,
        totalFound: users.length
      }
    });
    
  } catch (error) {
    console.error('❌ Error al obtener usuarios recientes:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener usuarios recientes',
      error: error.message
    });
  }
});

// ✅ ÓRDENES RECIENTES (usando modelos Sequelize)
router.get('/orders/recent', async (req, res) => {
  try {
    console.log('🔍 Obteniendo órdenes recientes con Sequelize...');
    
    // Usar Sequelize con include para hacer JOIN automático
    const orders = await db.Order.findAll({
      include: [{
        model: db.User,
        as: 'user',
        attributes: ['id', 'nombre', 'apellido', 'email'],
        required: false // LEFT JOIN
      }],
      order: [['created_at', 'DESC']],
      limit: 10
    });
    
    console.log(`✅ ${orders.length} órdenes encontradas con Sequelize`);
    
    // Formatear órdenes para el frontend
    const formattedOrders = orders.map(order => {
      const orderData = order.toJSON();
      
      // Asegurar que total_amount sea un número
      let totalAmount = parseFloat(orderData.totalAmount || 0);
      if (isNaN(totalAmount)) {
        totalAmount = 0;
      }
      
      // Determinar el nombre del usuario
      let userName = 'Cliente desconocido';
      if (orderData.user && orderData.user.nombre) {
        userName = `${orderData.user.nombre} ${orderData.user.apellido || ''}`.trim();
      } else if (orderData.clientName) {
        userName = orderData.clientName;
      }
      
      console.log(`📦 Orden ${orderData.id}:`);
      console.log(`   - Usuario BD: ${orderData.user ? `${orderData.user.nombre} ${orderData.user.apellido}` : 'No asociado'}`);
      console.log(`   - Cliente: ${orderData.clientName}`);
      console.log(`   - Usuario final: ${userName}`);
      console.log(`   - Total: ${totalAmount}`);
      console.log(`   - Estado: ${orderData.status}`);
      
      return {
        id: orderData.id,
        user_id: orderData.userId,
        user_name: userName,
        client_name: orderData.clientName,
        client_email: orderData.clientEmail,
        client_phone: orderData.clientPhone,
        total: totalAmount,
        total_amount: totalAmount,
        status: orderData.status || 'pendiente',
        payment_method: orderData.paymentMethod,
        created_at: orderData.created_at,
        updated_at: orderData.updated_at
      };
    });
    
    res.status(200).json({
      success: true,
      orders: formattedOrders,
      debug: {
        totalFound: orders.length,
        usingSequelize: true
      }
    });
    
  } catch (error) {
    console.error('❌ Error al obtener órdenes con Sequelize:', error);
    
    // Fallback: usar query SQL directo
    try {
      console.log('🔄 Fallback: usando query SQL directo...');
      
      const orders = await db.sequelize.query(
        `SELECT 
          o.id,
          o.client_name,
          o.client_email,
          o.client_phone,
          o.total_amount,
          o.status,
          o.payment_method,
          o.created_at,
          o.updated_at,
          o.user_id,
          u.nombre as user_nombre,
          u.apellido as user_apellido,
          u.email as user_email
         FROM orders o
         LEFT JOIN users u ON o.user_id = u.id
         ORDER BY o.created_at DESC 
         LIMIT 10`,
        { type: db.sequelize.QueryTypes.SELECT }
      );
      
      const formattedOrders = orders.map(order => ({
        id: order.id,
        user_id: order.user_id,
        user_name: order.user_nombre ? `${order.user_nombre} ${order.user_apellido || ''}`.trim() : order.client_name || 'Cliente desconocido',
        client_name: order.client_name,
        client_email: order.client_email,
        total: parseFloat(order.total_amount || 0),
        status: order.status || 'pendiente',
        payment_method: order.payment_method,
        created_at: order.created_at,
        updated_at: order.updated_at
      }));
      
      res.status(200).json({
        success: true,
        orders: formattedOrders,
        debug: {
          totalFound: orders.length,
          usingFallback: true
        }
      });
      
    } catch (fallbackError) {
      console.error('❌ Error en fallback también:', fallbackError);
      res.status(500).json({
        success: false,
        message: 'Error al obtener órdenes recientes',
        error: fallbackError.message
      });
    }
  }
});

// ✅ DEBUG: VER ESTRUCTURA DE TABLAS Y DATOS
router.get('/debug/tables', async (req, res) => {
  try {
    console.log('🔍 Ejecutando debug completo de tablas...');
    
    // Ver estructura de tabla users
    const usersStructure = await db.sequelize.query(
      'SELECT column_name, data_type FROM information_schema.columns WHERE table_name = \'users\' ORDER BY ordinal_position',
      { type: db.sequelize.QueryTypes.SELECT }
    );
    
    // Ver estructura de tabla orders
    const ordersStructure = await db.sequelize.query(
      'SELECT column_name, data_type FROM information_schema.columns WHERE table_name = \'orders\' ORDER BY ordinal_position',
      { type: db.sequelize.QueryTypes.SELECT }
    );
    
    // Contar registros
    const usersCount = await db.sequelize.query(
      'SELECT COUNT(*) as count FROM users',
      { type: db.sequelize.QueryTypes.SELECT }
    );
    
    const ordersCount = await db.sequelize.query(
      'SELECT COUNT(*) as count FROM orders',
      { type: db.sequelize.QueryTypes.SELECT }
    );
    
    // Obtener algunos datos de ejemplo
    const sampleUsers = await db.sequelize.query(
      'SELECT id, nombre, apellido, email, role FROM users LIMIT 3',
      { type: db.sequelize.QueryTypes.SELECT }
    );
    
    const sampleOrders = await db.sequelize.query(
      'SELECT id, client_name, total_amount, status FROM orders LIMIT 3',
      { type: db.sequelize.QueryTypes.SELECT }
    );
    
    console.log('📊 Resultados del debug:');
    console.log(`   - Users: ${usersCount[0].count} registros`);
    console.log(`   - Orders: ${ordersCount[0].count} registros`);
    
    res.json({
      success: true,
      tables: {
        users: {
          structure: usersStructure,
          count: parseInt(usersCount[0].count),
          sample: sampleUsers
        },
        orders: {
          structure: ordersStructure,
          count: parseInt(ordersCount[0].count),
          sample: sampleOrders
        }
      },
      summary: {
        totalUsers: parseInt(usersCount[0].count),
        totalOrders: parseInt(ordersCount[0].count),
        userColumns: usersStructure.map(col => col.column_name),
        orderColumns: ordersStructure.map(col => col.column_name)
      }
    });
    
  } catch (error) {
    console.error('❌ Error en debug de tablas:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      details: 'Error al obtener información de debug de las tablas'
    });
  }
});

// ✅ CREAR DATOS DE PRUEBA (útil para testing)
router.post('/debug/create-test-data', async (req, res) => {
  try {
    console.log('🔧 Creando datos de prueba...');
    
    // Crear usuario de prueba si no existe
    const testUser = await db.sequelize.query(
      `INSERT INTO users (nombre, apellido, email, dni, password, role, "createdAt", "updatedAt") 
       VALUES ('Admin', 'Test', 'admin@test.com', '12345678', 'password123', 'admin', NOW(), NOW())
       ON CONFLICT (email) DO NOTHING
       RETURNING id`,
      { type: db.sequelize.QueryTypes.INSERT }
    );
    
    // Crear orden de prueba
    const testOrder = await db.sequelize.query(
      `INSERT INTO orders (id, client_name, client_email, client_phone, total_amount, status, payment_method, created_at, updated_at)
       VALUES ('TEST-001', 'Cliente Test', 'cliente@test.com', '987654321', 150.50, 'entregado', 'efectivo', NOW(), NOW())
       ON CONFLICT (id) DO NOTHING`,
      { type: db.sequelize.QueryTypes.INSERT }
    );
    
    console.log('✅ Datos de prueba creados');
    
    res.json({
      success: true,
      message: 'Datos de prueba creados exitosamente',
      created: {
        user: testUser,
        order: testOrder
      }
    });
    
  } catch (error) {
    console.error('❌ Error al crear datos de prueba:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ✅ RUTA ADICIONAL: Obtener estadísticas de órdenes
router.get('/stats/summary', async (req, res) => {
  try {
    console.log('📊 Obteniendo estadísticas de órdenes...');

    const stats = await db.sequelize.query(`
      SELECT 
        COUNT(*) as total_ordenes,
        COUNT(CASE WHEN status = 'Pendiente' THEN 1 END) as pendientes,
        COUNT(CASE WHEN status = 'Procesando' THEN 1 END) as procesando,
        COUNT(CASE WHEN status = 'Completada' THEN 1 END) as completadas,
        COUNT(CASE WHEN status = 'Cancelada' THEN 1 END) as canceladas,
        COUNT(CASE WHEN status = 'Entregada' THEN 1 END) as entregadas,
        COALESCE(SUM(CASE WHEN status IN ('Completada', 'Entregada') THEN totalAmount END), 0) as ventas_totales,
        COALESCE(AVG(CASE WHEN status IN ('Completada', 'Entregada') THEN totalAmount END), 0) as promedio_venta
      FROM orders
    `, {
      type: db.sequelize.QueryTypes.SELECT
    });

    const estadisticas = stats[0];

    res.status(200).json({
      success: true,
      stats: {
        total_ordenes: parseInt(estadisticas.total_ordenes),
        pendientes: parseInt(estadisticas.pendientes),
        procesando: parseInt(estadisticas.procesando),
        completadas: parseInt(estadisticas.completadas),
        canceladas: parseInt(estadisticas.canceladas),
        entregadas: parseInt(estadisticas.entregadas),
        ventas_totales: parseFloat(estadisticas.ventas_totales),
        promedio_venta: parseFloat(estadisticas.promedio_venta)
      }
    });

  } catch (error) {
    console.error('❌ Error al obtener estadísticas:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener estadísticas de órdenes',
      error: error.message
    });
  }
});

// ✅ RUTA ADICIONAL: Cancelar múltiples órdenes
router.put('/bulk/cancel', async (req, res) => {
  try {
    const { order_ids } = req.body;

    if (!order_ids || !Array.isArray(order_ids) || order_ids.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Se requiere un array de IDs de órdenes'
      });
    }

    console.log(`🔄 Cancelando ${order_ids.length} órdenes...`);

    const [updatedCount] = await db.sequelize.query(`
      UPDATE orders 
      SET status = 'Cancelada', updatedAt = NOW()
      WHERE id IN (:orderIds) AND status NOT IN ('Completada', 'Entregada', 'Cancelada')
    `, {
      replacements: { orderIds: order_ids },
      type: db.sequelize.QueryTypes.UPDATE
    });

    console.log(`✅ ${updatedCount} órdenes canceladas`);

    res.status(200).json({
      success: true,
      message: `${updatedCount} órdenes canceladas exitosamente`,
      cancelled_count: updatedCount
    });

  } catch (error) {
    console.error('❌ Error al cancelar órdenes:', error);
    res.status(500).json({
      success: false,
      message: 'Error al cancelar órdenes',
      error: error.message
    });
  }
});

module.exports = router;