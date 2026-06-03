const express = require('express');
const router = express.Router();
const { Product, Order, OrderItem, Notification, Setting } = require('../models');
const { isAuthenticated } = require('../middleware/auth');
const { v4: uuidv4 } = require('uuid');

router.get('/', isAuthenticated, async (req, res) => {
  const cart = req.session.cart || [];
  if (cart.length === 0) {
    req.flash('error', 'Your cart is empty');
    return res.redirect('/cart');
  }
  const items = [];
  let subtotal = 0;
  for (const item of cart) {
    const product = await Product.findByPk(item.productId);
    if (product) {
      const total = parseFloat(product.price) * item.quantity;
      subtotal += total;
      items.push({ product, quantity: item.quantity, total });
    }
  }
  const user = await (require('../models').User).findByPk(req.session.userId);
  const categories = await (require('../models').Category).findAll({ where: { isActive: true }, order: [['order', 'ASC']] });
  res.render('checkout', { title: 'Checkout - HEIP', items, subtotal, user, categories });
});

router.post('/place', isAuthenticated, async (req, res) => {
  try {
    const cart = req.session.cart || [];
    if (cart.length === 0) {
      req.flash('error', 'Your cart is empty');
      return res.redirect('/cart');
    }
    const user = await (require('../models').User).findByPk(req.session.userId);
    const { paymentMethod, customerName, customerEmail, notes } = req.body;

    let items = [];
    let total = 0;
    for (const item of cart) {
      const product = await Product.findByPk(item.productId);
      if (product) {
        const itemTotal = parseFloat(product.price) * item.quantity;
        total += itemTotal;
        items.push({ product, quantity: item.quantity, options: item.options, total: itemTotal });
      }
    }

    const orderNumber = 'HEIP-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5).toUpperCase();
    const receiptNumber = 'RCT-' + uuidv4().substr(0, 8).toUpperCase();

    const order = await Order.create({
      orderNumber,
      userId: user.id,
      total: total.toFixed(2),
      status: 'pending',
      paymentMethod: paymentMethod || 'Bank Transfer',
      customerEmail: customerEmail || user.email,
      customerName: customerName || user.fullName || user.username,
      notes: notes || '',
      receiptNumber
    });

    for (const item of items) {
      await OrderItem.create({
        orderId: order.id,
        productId: item.product.id,
        productTitle: item.product.title,
        quantity: item.quantity,
        price: item.product.price,
        options: JSON.stringify(item.options)
      });
      await item.product.increment('salesCount', { by: item.quantity });
    }

    await Notification.create({
      type: 'new_order',
      title: 'New Order #' + orderNumber,
      message: 'Order placed by ' + user.username + ' - $' + total.toFixed(2),
      link: '/admin/orders/' + order.id,
      forAdmin: true
    });

    req.session.cart = [];
    req.flash('success', 'Order placed successfully! Order #: ' + orderNumber);
    res.redirect('/account/orders/' + order.id);
  } catch (err) {
    req.flash('error', 'Failed to place order');
    res.redirect('/checkout');
  }
});

module.exports = router;
