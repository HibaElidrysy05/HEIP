const express = require('express');
const router = express.Router();
const { Product, Category, Banner } = require('../models');
const { Op } = require('sequelize');

router.get('/', async (req, res) => {
  try {
    const products = await Product.findAll({ where: { isActive: true }, order: [['createdAt', 'DESC']] });
    const categories = await Category.findAll({ where: { isActive: true }, order: [['order', 'ASC']] });
    const banners = await Banner.findAll({ where: { isActive: true }, order: [['order', 'ASC']] });
    res.render('index', {
      title: 'Home - HEIP',
      products,
      categories,
      banners
    });
  } catch (err) {
    res.render('index', { title: 'Home - HEIP', products: [], categories: [], banners: [] });
  }
});

router.get('/category/:slug', async (req, res) => {
  try {
    const category = await Category.findOne({ where: { slug: req.params.slug, isActive: true } });
    if (!category) {
      req.flash('error', 'Category not found');
      return res.redirect('/');
    }
    const products = await Product.findAll({ where: { categoryId: category.id, isActive: true } });
    const categories = await Category.findAll({ where: { isActive: true }, order: [['order', 'ASC']] });
    res.render('category', { title: category.name + ' - HEIP', products, category, categories });
  } catch (err) {
    res.redirect('/');
  }
});

router.get('/search', async (req, res) => {
  try {
    const q = req.query.q || '';
    const products = await Product.findAll({
      where: { title: { [Op.like]: '%' + q + '%' }, isActive: true }
    });
    const categories = await Category.findAll({ where: { isActive: true }, order: [['order', 'ASC']] });
    res.render('search', { title: 'Search: ' + q + ' - HEIP', products, query: q, categories });
  } catch (err) {
    res.redirect('/');
  }
});

module.exports = router;
