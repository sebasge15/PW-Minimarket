module.exports = (sequelize, DataTypes) => {
  const Order = sequelize.define('Order', {
    id: {
      type: DataTypes.STRING(50),
      primaryKey: true,
      allowNull: false,
      validate: {
        notEmpty: true
      }
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'user_id',
      references: {
        model: 'users',
        key: 'id'
      }
    },
    clientName: {
      type: DataTypes.STRING,
      allowNull: false,
      field: 'client_name'
    },
    clientEmail: {
      type: DataTypes.STRING,
      allowNull: false,
      field: 'client_email'
    },
    clientPhone: {
      type: DataTypes.STRING,
      allowNull: false,
      field: 'client_phone'
    },
    shippingAddress: {
      type: DataTypes.TEXT,
      allowNull: false,
      field: 'shipping_address'
    },
    totalAmount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      field: 'total_amount'
    },
    status: {
      type: DataTypes.STRING,
      defaultValue: 'Procesando'
    },
    paymentMethod: {
      type: DataTypes.STRING,
      field: 'payment_method',
      defaultValue: 'Tarjeta'
    }
  }, {
    tableName: 'orders',
    timestamps: true,
    underscored: true,
    hooks: {
      beforeValidate: (order) => {
        if (!order.id) {
          // Generate order ID if not provided
          order.id = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`;
        }
      }
    }
  });

  Order.associate = function(models) {
    Order.hasMany(models.OrderItem, {
      foreignKey: 'order_id',
      as: 'items'
    });
    
    Order.belongsTo(models.user, {
      foreignKey: 'user_id',
      as: 'user'
    });
  };

  return Order;
};