'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    try {
      console.log('🗑️ Dropping existing tables if they exist...');
      try {
        await queryInterface.dropTable('order_items');
        await queryInterface.dropTable('orders');
      } catch (error) {
        console.log('Tables did not exist, creating new ones');
      }

      console.log('📦 Creating orders table...');
      await queryInterface.createTable('orders', {
        id: {
          type: Sequelize.STRING(50),
          primaryKey: true,
          allowNull: false,
          unique: true
        },
        client_name: {
          type: Sequelize.STRING,
          allowNull: false
        },
        client_email: Sequelize.STRING,
        client_phone: Sequelize.STRING,
        shipping_address: {
          type: Sequelize.TEXT,
          allowNull: false
        },
        total_amount: {
          type: Sequelize.DECIMAL(10, 2),
          allowNull: false
        },
        status: {
          type: Sequelize.ENUM('Procesando', 'Preparando', 'Enviado', 'Entregado', 'Cancelado'),
          defaultValue: 'Procesando'
        },
        payment_method: Sequelize.STRING,
        created_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.fn('now')
        },
        updated_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.fn('now')
        }
      });

      // Add index on orders id
      await queryInterface.addIndex('orders', ['id'], {
        name: 'orders_id_index',
        unique: true
      });

      console.log('📦 Creating order_items table...');
      await queryInterface.createTable('order_items', {
        id: {
          type: Sequelize.INTEGER,
          primaryKey: true,
          autoIncrement: true
        },
        order_id: {
          type: Sequelize.STRING(50),
          references: {
            model: 'orders',
            key: 'id'
          },
          onDelete: 'CASCADE'
        },
        product_id: {
          type: Sequelize.INTEGER,
          references: {
            model: 'products',
            key: 'id'
          }
        },
        quantity: {
          type: Sequelize.INTEGER,
          allowNull: false
        },
        unit_price: {
          type: Sequelize.DECIMAL(10, 2),
          allowNull: false
        },
        total_price: {
          type: Sequelize.DECIMAL(10, 2),
          allowNull: false
        },
        created_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.fn('now')
        },
        updated_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.fn('now')
        }
      });

      // Add indexes for order_items
      await queryInterface.addIndex('order_items', ['order_id'], {
        name: 'order_items_order_id_index'
      });

      await queryInterface.addIndex('order_items', ['product_id'], {
        name: 'order_items_product_id_index'
      });

      console.log('✅ Tables and indexes created successfully');

    } catch (error) {
      console.error('❌ Migration error:', error);
      console.error('Error details:', error.message);
      throw error;
    }
  },

  down: async (queryInterface, Sequelize) => {
    try {
      console.log('🔄 Rolling back migration...');
      // Drop indexes first
      await queryInterface.removeIndex('order_items', 'order_items_product_id_index');
      await queryInterface.removeIndex('order_items', 'order_items_order_id_index');
      await queryInterface.removeIndex('orders', 'orders_id_index');
      
      // Then drop tables
      await queryInterface.dropTable('order_items');
      await queryInterface.dropTable('orders');
      console.log('✅ Rollback complete');
    } catch (error) {
      console.error('❌ Rollback error:', error);
      throw error;
    }
  }
};