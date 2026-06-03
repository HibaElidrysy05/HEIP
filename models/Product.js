const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Product = sequelize.define('Product', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  title: { type: DataTypes.STRING, allowNull: false },
  slug: { type: DataTypes.STRING, allowNull: false, unique: true },
  description: { type: DataTypes.TEXT, defaultValue: '' },
  shortDescription: { type: DataTypes.STRING, defaultValue: '' },
  price: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
  previousPrice: { type: DataTypes.DECIMAL(10, 2), defaultValue: null },
  image: { type: DataTypes.STRING, defaultValue: '' },
  filePath: { type: DataTypes.STRING, defaultValue: '' },
  fileSize: { type: DataTypes.STRING, defaultValue: '' },
  fileType: { type: DataTypes.STRING, defaultValue: '' },
  categoryId: { type: DataTypes.INTEGER, defaultValue: null },
  featured: { type: DataTypes.BOOLEAN, defaultValue: false },
  isActive: { type: DataTypes.BOOLEAN, defaultValue: true },
  options: { type: DataTypes.TEXT, defaultValue: '[]' },
  downloadLimit: { type: DataTypes.INTEGER, defaultValue: 0 },
  salesCount: { type: DataTypes.INTEGER, defaultValue: 0 }
}, { timestamps: true });

module.exports = Product;
