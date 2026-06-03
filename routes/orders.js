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

router.get('/:id/receipt/pdf', isAuthenticated, async (req, res) => {
  try {
    const order = await Order.findOne({
      where: { id: req.params.id, userId: req.session.userId },
      include: [{ model: OrderItem }]
    });
    if (!order) {
      req.flash('error', 'Order not found');
      return res.redirect('/account/orders');
    }

    const PDFDocument = require('pdfkit');
    const doc = new PDFDocument({ size: 'A4', margin: 50 });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="receipt-' + order.orderNumber + '.pdf"');
    doc.pipe(res);

    const font = 'Helvetica';
    const bold = 'Helvetica-Bold';
    const gray = '#666666';
    const black = '#000000';
    const ml = 50;
    let y = 50;

    // Header
    doc.font(bold, 24).fillColor(black).text('HEIP', ml, y);
    doc.font(font, 11).fillColor(gray).text('Digital Products Receipt', ml, y + 30);
    y += 55;

    // Status badge
    doc.font(bold, 10).fillColor(order.status === 'completed' ? '#0a8' : order.status === 'pending' ? '#c80' : '#c00')
      .text(order.status.toUpperCase(), ml, y);
    y += 22;

    // Meta info
    const meta = [
      ['Receipt', order.receiptNumber],
      ['Order', order.orderNumber],
      ['Date', new Date(order.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })],
      ['Payment', order.paymentMethod]
    ];
    doc.font(font, 8).fillColor(gray);
    doc.font(bold, 12).fillColor(black);
    meta.forEach((m, i) => {
      const col = i % 2;
      const row = Math.floor(i / 2);
      const x = ml + col * 200;
      const yy = y + row * 28;
      doc.font(font, 8).fillColor(gray).text(m[0], x, yy);
      doc.font(bold, 11).fillColor(black).text(m[1], x, yy + 11);
    });
    y += 65;

    // Customer info
    [['Customer', order.customerName], ['Email', order.customerEmail]].forEach((m, i) => {
      const xx = ml + i * 200;
      doc.font(font, 8).fillColor(gray).text(m[0], xx, y);
      doc.font(bold, 11).fillColor(black).text(m[1], xx, y + 11);
    });
    y += 35;

    // Table header
    doc.moveTo(ml, y).lineTo(ml + 495, y).strokeColor('#ddd').stroke();
    y += 6;
    const cols = [
      { label: 'Item', x: ml, align: 'left' },
      { label: 'Qty', x: 480, align: 'right' },
      { label: 'Price', x: 530, align: 'right' }
    ];
    doc.font(font, 9).fillColor(gray);
    cols.forEach(c => doc.text(c.label, c.x, y, { width: 60, align: c.align }));
    y += 18;

    // Items
    order.OrderItems.forEach(item => {
      doc.moveTo(ml, y).lineTo(ml + 495, y).strokeColor('#eee').stroke();
      y += 8;
      doc.font(font, 11).fillColor('#333333').text(item.productTitle, ml, y, { width: 340 });
      doc.text(item.quantity.toString(), 480, y, { width: 60, align: 'right' });
      const total = (parseFloat(item.price) * item.quantity).toFixed(2);
      doc.text('$' + total, 530, y, { width: 60, align: 'right' });
      y += 22;
    });

    // Total
    y += 6;
    doc.moveTo(ml, y).lineTo(ml + 495, y).strokeColor('#000').lineWidth(2).stroke();
    doc.lineWidth(1);
    y += 10;
    doc.font(bold, 14).fillColor(black);
    doc.text('Total', ml, y);
    doc.text('$' + parseFloat(order.total).toFixed(2), 530, y, { width: 60, align: 'right' });
    y += 40;

    // Footer
    doc.font(font, 10).fillColor(gray);
    doc.text('Thank you for your purchase!', ml, y, { align: 'center', width: 495 });
    y += 16;
    doc.text('HEIP Digital Marketplace', ml, y, { align: 'center', width: 495 });
    y += 14;
    doc.font(font, 8).fillColor(gray).text('This is a computer-generated receipt.', ml, y, { align: 'center', width: 495 });

    doc.end();
  } catch (err) {
    req.flash('error', 'Failed to generate receipt');
    res.redirect('/account/orders/' + req.params.id);
  }
});

module.exports = router;
