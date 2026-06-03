const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Order = sequelize.define('Order', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  orderNumber: { type: DataTypes.STRING, allowNull: false, unique: true },
  userId: { type: DataTypes.INTEGER, allowNull: false },
  total: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
  status: { type: DataTypes.ENUM('pending', 'completed', 'cancelled'), defaultValue: 'pending' },
  paymentMethod: { type: DataTypes.STRING, defaultValue: '' },
  paymentDetails: { type: DataTypes.TEXT, defaultValue: '' },
  customerEmail: { type: DataTypes.STRING, defaultValue: '' },
  customerName: { type: DataTypes.STRING, defaultValue: '' },
  notes: { type: DataTypes.TEXT, defaultValue: '' },
  receiptNumber: { type: DataTypes.STRING, defaultValue: '' }
}, { timestamps: true });

module.exports = Order;
