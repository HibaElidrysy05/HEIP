const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Notification = sequelize.define('Notification', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  type: { type: DataTypes.STRING, defaultValue: 'info' },
  title: { type: DataTypes.STRING, defaultValue: '' },
  message: { type: DataTypes.TEXT, defaultValue: '' },
  link: { type: DataTypes.STRING, defaultValue: '' },
  isRead: { type: DataTypes.BOOLEAN, defaultValue: false },
  forAdmin: { type: DataTypes.BOOLEAN, defaultValue: true },
  userId: { type: DataTypes.INTEGER, defaultValue: null }
}, { timestamps: true });

module.exports = Notification;
