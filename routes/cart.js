const express = require('express');
const router = express.Router();
const { Product } = require('../models');

router.get('/', async (req, res) => {
  const cart = req.session.cart || [];
  const items = [];
  let subtotal = 0;
  for (const item of cart) {
    const product = await Product.findByPk(item.productId);
    if (product) {
      const total = parseFloat(product.price) * item.quantity;
      subtotal += total;
      items.push({ product, quantity: item.quantity, options: item.options || [], total });
    }
  }
  const categories = await (require('../models').Category).findAll({ where: { isActive: true }, order: [['order', 'ASC']] });
  res.render('cart', { title: 'Cart - HEIP', items, subtotal, categories });
});

router.post('/add', async (req, res) => {
  try {
    const { productId, quantity, options } = req.body;
    const product = await Product.findByPk(productId);
    if (!product || !product.isActive) {
      return res.status(404).json({ error: 'Product not found' });
    }
    if (!req.session.cart) req.session.cart = [];
    const existing = req.session.cart.findIndex(i => i.productId == productId);
    if (existing >= 0) {
      req.session.cart[existing].quantity += parseInt(quantity) || 1;
      if (options) req.session.cart[existing].options = options;
    } else {
      req.session.cart.push({ productId: parseInt(productId), quantity: parseInt(quantity) || 1, options: options || [] });
    }
    res.json({ success: true, count: req.session.cart.reduce((a, i) => a + i.quantity, 0) });
  } catch (err) {
    res.status(500).json({ error: 'Failed to add to cart' });
  }
});

router.post('/update', async (req, res) => {
  const { productId, quantity } = req.body;
  if (!req.session.cart) req.session.cart = [];
  const idx = req.session.cart.findIndex(i => i.productId == productId);
  if (idx >= 0) {
    if (quantity <= 0) {
      req.session.cart.splice(idx, 1);
    } else {
      req.session.cart[idx].quantity = parseInt(quantity);
    }
  }
  res.redirect('/cart');
});

router.post('/remove', (req, res) => {
  const { productId } = req.body;
  if (req.session.cart) {
    req.session.cart = req.session.cart.filter(i => i.productId != productId);
  }
  res.redirect('/cart');
});

module.exports = router;
