const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Banner = sequelize.define('Banner', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  type: { type: DataTypes.ENUM('image', 'text'), defaultValue: 'image' },
  title: { type: DataTypes.STRING, defaultValue: '' },
  content: { type: DataTypes.TEXT, defaultValue: '' },
  image: { type: DataTypes.STRING, defaultValue: '' },
  link: { type: DataTypes.STRING, defaultValue: '' },
  linkText: { type: DataTypes.STRING, defaultValue: 'Learn More' },
  bgColor: { type: DataTypes.STRING, defaultValue: '#1a1a1a' },
  textColor: { type: DataTypes.STRING, defaultValue: '#ffffff' },
  order: { type: DataTypes.INTEGER, defaultValue: 0 },
  isActive: { type: DataTypes.BOOLEAN, defaultValue: true }
}, { timestamps: true });

module.exports = Banner;
