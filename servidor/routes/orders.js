const express = require('express');
const router = express.Router();
const db = require('../models');

// Crear nueva orden
router.post('/', async (req, res) => {
  const t = await db.sequelize.transaction();
  
  try {
    const { cliente, items, shippingAddress, totalAmount } = req.body;
    
    console.log('📦 Received order data:', {
      cliente,
      itemsCount: items?.length,
      shippingAddress,
      totalAmount
    });

    // Validate required fields
    if (!cliente?.nombre || !cliente?.correo || !cliente?.telefono) {
      throw new Error(JSON.stringify({
        type: 'ValidationError',
        errors: ['Datos del cliente incompletos']
      }));
    }

    if (!shippingAddress?.trim()) {
      throw new Error(JSON.stringify({
        type: 'ValidationError',
        errors: ['Dirección de envío es requerida']
      }));
    }

    if (!items?.length) {
      throw new Error(JSON.stringify({
        type: 'ValidationError',
        errors: ['Debe incluir al menos un producto']
      }));
    }

    // Create order with validated data
    const order = await db.Order.create({
      clientName: cliente.nombre.trim(),
      clientEmail: cliente.correo.toLowerCase().trim(),
      clientPhone: cliente.telefono.replace(/\D/g, ''),
      shippingAddress: shippingAddress.trim(),
      totalAmount: parseFloat(totalAmount),
      status: 'Procesando',
      paymentMethod: 'Tarjeta'
    }, { transaction: t });

    console.log('✅ Created order:', order.id);

    // Create order items
    await Promise.all(items.map(item =>
      db.OrderItem.create({
        orderId: order.id,
        productId: parseInt(item.id),
        quantity: parseInt(item.quantity),
        unitPrice: parseFloat(item.price),
        totalPrice: parseInt(item.quantity) * parseFloat(item.price)
      }, { transaction: t })
    ));

    await t.commit();
    console.log('✅ Transaction committed for order:', order.id);

    // Return complete order with items
    const completeOrder = await db.Order.findByPk(order.id, {
      include: [{
        model: db.OrderItem,
        as: 'items',
        include: [{
          model: db.Product,
          as: 'product'
        }]
      }]
    });

    res.status(201).json({
      success: true,
      order: completeOrder
    });

  } catch (error) {
    await t.rollback();
    console.error('❌ Error creating order:', error);

    res.status(400).json({
      success: false,
      message: 'Error al crear la orden',
      error: error.message
    });
  }
});

// Obtener orden por ID
router.get('/:id', async (req, res) => {
  try {
    const orderId = req.params.id;
    console.log('🔍 Buscando orden:', orderId);

    const order = await db.Order.findByPk(orderId, {
      include: [{
        model: db.OrderItem,
        as: 'items',
        include: [{
          model: db.Product,
          as: 'product'
        }]
      }]
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Orden no encontrada'
      });
    }

    // Convert to plain object and transform data
    const plainOrder = order.get({ plain: true });
    
    // Transform the order data
    const transformedOrder = {
      id: plainOrder.id,
      clientName: plainOrder.clientName,
      clientEmail: plainOrder.clientEmail,
      clientPhone: plainOrder.clientPhone,
      shippingAddress: plainOrder.shippingAddress,
      totalAmount: parseFloat(plainOrder.totalAmount),
      status: plainOrder.status,
      paymentMethod: plainOrder.paymentMethod,
      createdAt: new Date(plainOrder.createdAt).toISOString(),
      updatedAt: new Date(plainOrder.updatedAt).toISOString(),
      items: plainOrder.items?.map(item => ({
        id: item.id,
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: parseFloat(item.unitPrice),
        totalPrice: parseFloat(item.totalPrice),
        product: item.product ? {
          id: item.product.id,
          name: item.product.name,
          price: parseFloat(item.product.price),
          image_url: item.product.image_url,
          presentation: item.product.presentation
        } : null
      })) || []
    };

    console.log('✅ Orden encontrada y transformada:', transformedOrder.id);

    res.json({
      success: true,
      order: transformedOrder
    });

  } catch (error) {
    console.error('❌ Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error al buscar la orden',
      error: error.message
    });
  }
});

// Obtener todas las órdenes
router.get('/', async (req, res) => {
  try {
    const orders = await db.Order.findAll({
      include: [{
        model: db.OrderItem,
        as: 'items',
        include: [{
          model: db.Product,
          as: 'product'
        }]
      }],
      order: [['createdAt', 'DESC']]
    });

    // Transformar órdenes a objetos simples
    const transformedOrders = orders.map(order => {
      const plainOrder = order.get({ plain: true });
      return {
        id: plainOrder.id,
        clientName: plainOrder.clientName,
        clientEmail: plainOrder.clientEmail,
        clientPhone: plainOrder.clientPhone,
        shippingAddress: plainOrder.shippingAddress,
        totalAmount: parseFloat(plainOrder.totalAmount),
        status: plainOrder.status,
        paymentMethod: plainOrder.paymentMethod,
        createdAt: new Date(plainOrder.createdAt).toISOString(),
        updatedAt: new Date(plainOrder.updatedAt).toISOString(),
        items: plainOrder.items?.map(item => ({
          id: item.id,
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: parseFloat(item.unitPrice),
          totalPrice: parseFloat(item.totalPrice),
          product: item.product ? {
            id: item.product.id,
            name: item.product.name,
            price: parseFloat(item.product.price),
            image_url: item.product.image_url,
            presentation: item.product.presentation
          } : null
        })) || []
      };
    });

    res.json({
      success: true,
      orders: transformedOrders
    });

  } catch (error) {
    console.error('❌ Error loading orders:', error);
    res.status(500).json({
      success: false,
      message: 'Error al cargar las órdenes',
      error: error.message
    });
  }
});

// Actualizar estado de orden
router.put('/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    console.log(`🔄 Actualizando orden ${id} a estado: ${status}`);

    // Validar que se envíe el estado
    if (!status) {
      return res.status(400).json({
        success: false,
        message: 'Estado es obligatorio'
      });
    }

    // Validar estados permitidos
    const estadosPermitidos = ['Pendiente', 'Procesando', 'Completada', 'Cancelada', 'Entregada'];
    if (!estadosPermitidos.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Estado no válido. Estados permitidos: ${estadosPermitidos.join(', ')}`
      });
    }

    // Buscar la orden
    const orden = await db.Order.findByPk(id);

    if (!orden) {
      return res.status(404).json({
        success: false,
        message: 'Orden no encontrada'
      });
    }

    // Validar transiciones de estado
    const estadoActual = orden.status;
    
    // No permitir cambios desde estados finales
    if (estadoActual === 'Completada' || estadoActual === 'Entregada') {
      if (status !== 'Cancelada') {
        return res.status(400).json({
          success: false,
          message: `No se puede cambiar el estado desde ${estadoActual} a ${status}`
        });
      }
    }

    // Actualizar la orden
    await orden.update({
      status: status,
      updatedAt: new Date()
    });

    console.log(`✅ Orden ${id} actualizada de ${estadoActual} a ${status}`);

    // Obtener la orden actualizada con sus items
    const ordenActualizada = await db.Order.findByPk(id, {
      include: [{
        model: db.OrderItem,
        as: 'items',
        include: [{
          model: db.Product,
          as: 'product'
        }]
      }]
    });

    // Transformar la respuesta
    const plainOrder = ordenActualizada.get({ plain: true });
    const transformedOrder = {
      id: plainOrder.id,
      clientName: plainOrder.clientName,
      clientEmail: plainOrder.clientEmail,
      clientPhone: plainOrder.clientPhone,
      shippingAddress: plainOrder.shippingAddress,
      totalAmount: parseFloat(plainOrder.totalAmount),
      status: plainOrder.status,
      paymentMethod: plainOrder.paymentMethod,
      createdAt: new Date(plainOrder.createdAt).toISOString(),
      updatedAt: new Date(plainOrder.updatedAt).toISOString(),
      items: plainOrder.items?.map(item => ({
        id: item.id,
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: parseFloat(item.unitPrice),
        totalPrice: parseFloat(item.totalPrice),
        product: item.product ? {
          id: item.product.id,
          name: item.product.name,
          price: parseFloat(item.product.price),
          image_url: item.product.image_url,
          presentation: item.product.presentation
        } : null
      })) || []
    };

    res.status(200).json({
      success: true,
      message: `Estado de orden actualizado exitosamente a ${status}`,
      order: transformedOrder,
      previous_status: estadoActual,
      new_status: status
    });

  } catch (error) {
    console.error('❌ Error al actualizar estado de orden:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor al actualizar estado de orden',
      error: error.message
    });
  }
});

module.exports = router;