'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    try {
      // Drop existing foreign keys and indexes
      await queryInterface.sequelize.query(
        'ALTER TABLE order_items DROP CONSTRAINT IF EXISTS order_items_order_id_fkey'
      );

      // Modify orders table first
      await queryInterface.changeColumn('orders', 'id', {
        type: Sequelize.STRING(50),
        allowNull: false,
        primaryKey: true
      });

      // Modify order_items table
      await queryInterface.changeColumn('order_items', 'order_id', {
        type: Sequelize.STRING(50),
        allowNull: false
      });

      // Recreate foreign key
      await queryInterface.addConstraint('order_items', {
        fields: ['order_id'],
        type: 'foreign key',
        name: 'order_items_order_id_fkey',
        references: {
          table: 'orders',
          field: 'id'
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
      });

    } catch (error) {
      console.error('Migration failed:', error);
      throw error;
    }
  },

  down: async (queryInterface, Sequelize) => {
    try {
      // Drop foreign key first
      await queryInterface.removeConstraint('order_items', 'order_items_order_id_fkey');

      // Revert order_items changes
      await queryInterface.changeColumn('order_items', 'order_id', {
        type: Sequelize.INTEGER,
        allowNull: false
      });

      // Revert orders changes
      await queryInterface.changeColumn('orders', 'id', {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true
      });

      // Recreate foreign key
      await queryInterface.addConstraint('order_items', {
        fields: ['order_id'],
        type: 'foreign key',
        name: 'order_items_order_id_fkey',
        references: {
          table: 'orders',
          field: 'id'
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
      });

    } catch (error) {
      console.error('Migration rollback failed:', error);
      throw error;
    }
  }
};