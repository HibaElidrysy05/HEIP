const express = require('express');
const router = express.Router();
const { Product, Category } = require('../models');
const { Op } = require('sequelize');

router.get('/:slug', async (req, res) => {
  try {
    const product = await Product.findOne({ where: { slug: req.params.slug, isActive: true }, include: [{ model: Category }] });
    if (!product) {
      req.flash('error', 'Product not found');
      return res.redirect('/');
    }
    let productOptions = [];
    try { productOptions = JSON.parse(product.options); } catch (e) { productOptions = []; }
    const related = await Product.findAll({ where: { categoryId: product.categoryId, id: { [Op.ne]: product.id }, isActive: true }, limit: 4 });
    const categories = await Category.findAll({ where: { isActive: true }, order: [['order', 'ASC']] });
    res.render('product', { title: product.title + ' - HEIP', product, productOptions, related, categories });
  } catch (err) {
    res.redirect('/');
  }
});

module.exports = router;
