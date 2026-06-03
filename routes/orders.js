const express = require('express');
const router = express.Router();
const { Order, OrderItem, Product, Category } = require('../models');
const { isAuthenticated } = require('../middleware/auth');
const path = require('path');
const fs = require('fs');

router.get('/', isAuthenticated, async (req, res) => {
  const orders = await Order.findAll({
    where: { userId: req.session.userId },
    order: [['createdAt', 'DESC']]
  });
  const categories = await Category.findAll({ where: { isActive: true }, order: [['order', 'ASC']] });
  res.render('account/orders', { title: 'My Orders - HEIP', orders, categories });
});

router.get('/:id', isAuthenticated, async (req, res) => {
  const order = await Order.findOne({
    where: { id: req.params.id, userId: req.session.userId },
    include: [{ model: OrderItem }]
  });
  if (!order) {
    req.flash('error', 'Order not found');
    return res.redirect('/account/orders');
  }
  const categories = await Category.findAll({ where: { isActive: true }, order: [['order', 'ASC']] });
  res.render('account/order-detail', { title: 'Order #' + order.orderNumber + ' - HEIP', order, categories });
});

router.get('/:id/download/:itemId', isAuthenticated, async (req, res) => {
  try {
    const order = await Order.findOne({
      where: { id: req.params.id, userId: req.session.userId, status: 'completed' }
    });
    if (!order) {
      req.flash('error', 'Order not found or not completed');
      return res.redirect('/account/orders');
    }
    const item = await OrderItem.findOne({ where: { id: req.params.itemId, orderId: order.id } });
    if (!item) {
      req.flash('error', 'Item not found');
      return res.redirect('/account/orders/' + order.id);
    }
    const product = await Product.findByPk(item.productId);
    if (!product || !product.filePath) {
      req.flash('error', 'File not available');
      return res.redirect('/account/orders/' + order.id);
    }
    const filePath = path.join(__dirname, '..', 'public', product.filePath);
    if (!fs.existsSync(filePath)) {
      req.flash('error', 'File not found on server');
      return res.redirect('/account/orders/' + order.id);
    }
    res.download(filePath);
  } catch (err) {
    req.flash('error', 'Download failed');
    res.redirect('/account/orders');
  }
});

router.post('/:id/cancel', isAuthenticated, async (req, res) => {
  try {
    const order = await Order.findOne({
      where: { id: req.params.id, userId: req.session.userId, status: 'pending' }
    });
    if (!order) {
      req.flash('error', 'Order not found or cannot be cancelled');
      return res.redirect('/account/orders');
    }
    await order.update({ status: 'cancelled' });
    await (require('../models').Notification).create({
      type: 'order_cancelled',
      title: 'Order #' + order.orderNumber + ' Cancelled',
      message: 'Your order has been cancelled',
      link: '/account/orders/' + order.id,
      forAdmin: false,
      userId: order.userId
    });
    req.flash('success', 'Order cancelled');
    res.redirect('/account/orders/' + order.id);
  } catch (err) {
    req.flash('error', 'Failed to cancel order');
    res.redirect('/account/orders');
  }
});

router.get('/:id/receipt', isAuthenticated, async (req, res) => {
  try {
    const order = await Order.findOne({
      where: { id: req.params.id, userId: req.session.userId },
      include: [{ model: OrderItem }]
    });
    if (!order) {
      req.flash('error', 'Order not found');
      return res.redirect('/account/orders');
    }
    const categories = await Category.findAll({ where: { isActive: true }, order: [['order', 'ASC']] });
    res.render('account/receipt', { title: 'Receipt - HEIP', order, categories, layout: false });
  } catch (err) {
    res.redirect('/account/orders');
  }
});

module.exports = router;
