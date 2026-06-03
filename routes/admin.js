const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { User, Product, Category, Order, OrderItem, Banner, SupportTicket, Setting, Notification } = require('../models');
const { isAdmin } = require('../middleware/auth');
const { uploadProductImage, uploadBannerImage, uploadLogo, uploadDigitalFile } = require('../middleware/upload');
const { Op } = require('sequelize');
const path = require('path');
const fs = require('fs');

// Notification AJAX routes (must be before isAdmin for regular user access)
router.post('/notifications/mark-read/:id', async (req, res) => {
  try {
    const where = { id: req.params.id };
    if (req.session.userRole !== 'admin') {
      where.userId = req.session.userId;
      where.forAdmin = false;
    }
    await Notification.update({ isRead: true }, { where });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false });
  }
});

router.post('/notifications/mark-all-read', async (req, res) => {
  try {
    const where = req.session.userRole === 'admin' ? { forAdmin: true } : { userId: req.session.userId, forAdmin: false };
    await Notification.update({ isRead: true }, { where });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false });
  }
});

router.use(isAdmin);

router.get('/', async (req, res) => {
  const stats = {
    products: await Product.count(),
    orders: await Order.count(),
    users: await User.count({ where: { role: 'user' } }),
    revenue: await Order.sum('total', { where: { status: 'completed' } }) || 0,
    pendingOrders: await Order.count({ where: { status: 'pending' } }),
    tickets: await SupportTicket.count({ where: { status: 'open' } }),
    unreadNotifications: await Notification.count({ where: { forAdmin: true, isRead: false } })
  };
  const recentOrders = await Order.findAll({ order: [['createdAt', 'DESC']], limit: 5, include: [{ model: User }] });
  const recentNotifications = await Notification.findAll({ where: { forAdmin: true }, order: [['createdAt', 'DESC']], limit: 10 });
  res.render('admin/dashboard', { title: 'Admin Dashboard - HEIP', stats, recentOrders, recentNotifications });
});

// Notifications
router.get('/notifications', async (req, res) => {
  const notifications = await Notification.findAll({ where: { forAdmin: true }, order: [['createdAt', 'DESC']] });
  res.render('admin/notifications', { title: 'Notifications - HEIP Admin', notifications });
});

router.post('/notifications/read/:id', async (req, res) => {
  await Notification.update({ isRead: true }, { where: { id: req.params.id } });
  res.redirect('/admin/notifications');
});

router.post('/notifications/read-all', async (req, res) => {
  await Notification.update({ isRead: true }, { where: { forAdmin: true } });
  res.redirect('/admin/notifications');
});

router.post('/notifications/delete/:id', async (req, res) => {
  await Notification.destroy({ where: { id: req.params.id } });
  res.redirect('/admin/notifications');
});

// Products
router.get('/products', async (req, res) => {
  const products = await Product.findAll({ order: [['createdAt', 'DESC']], include: [{ model: Category }] });
  res.render('admin/products', { title: 'Products - HEIP Admin', products });
});

router.get('/products/new', async (req, res) => {
  const categories = await Category.findAll({ order: [['name', 'ASC']] });
  res.render('admin/product-form', { title: 'New Product - HEIP Admin', product: null, categories });
});

router.get('/products/edit/:id', async (req, res) => {
  const product = await Product.findByPk(req.params.id);
  const categories = await Category.findAll({ order: [['name', 'ASC']] });
  if (!product) { req.flash('error', 'Product not found'); return res.redirect('/admin/products'); }
  res.render('admin/product-form', { title: 'Edit Product - HEIP Admin', product, categories });
});

router.post('/products/save', uploadProductImage.fields([{ name: 'image', maxCount: 1 }, { name: 'digitalFile', maxCount: 1 }]), async (req, res) => {
  try {
    const { id, title, description, shortDescription, price, previousPrice, categoryId, featured, isActive, options, downloadLimit } = req.body;
    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') + '-' + Date.now();
    const data = {
      title, description, shortDescription, price, previousPrice: previousPrice || null,
      categoryId: categoryId || null, featured: featured ? true : false, isActive: isActive ? true : false,
      options: options || '[]', downloadLimit: downloadLimit || 0
    };
    if (req.files && req.files['image'] && req.files['image'].length > 0) data.image = '/uploads/products/' + req.files['image'][0].filename;
    else if (req.body.existing_image) data.image = req.body.existing_image;
    if (req.files && req.files['digitalFile'] && req.files['digitalFile'].length > 0) {
      const file = req.files['digitalFile'][0];
      data.filePath = '/uploads/products/' + file.filename;
      data.fileSize = (file.size / 1024 / 1024).toFixed(2) + ' MB';
      data.fileType = path.extname(file.originalname).replace('.', '').toUpperCase();
    }

    if (id) {
      const product = await Product.findByPk(id);
      data.slug = product.slug;
      await product.update(data);
      req.flash('success', 'Product updated');
    } else {
      data.slug = slug;
      await Product.create(data);
      req.flash('success', 'Product created');
    }
    res.redirect('/admin/products');
  } catch (err) {
    req.flash('error', 'Failed to save product: ' + err.message);
    res.redirect('/admin/products');
  }
});

router.post('/products/delete/:id', async (req, res) => {
  const product = await Product.findByPk(req.params.id);
  if (product) {
    if (product.image && fs.existsSync(path.join(__dirname, '..', 'public', product.image))) {
      fs.unlinkSync(path.join(__dirname, '..', 'public', product.image));
    }
    if (product.filePath && fs.existsSync(path.join(__dirname, '..', 'public', product.filePath))) {
      fs.unlinkSync(path.join(__dirname, '..', 'public', product.filePath));
    }
    await product.destroy();
  }
  res.redirect('/admin/products');
});

// Categories
router.get('/categories', async (req, res) => {
  const categories = await Category.findAll({ order: [['order', 'ASC']], include: [{ model: Product }] });
  res.render('admin/categories', { title: 'Categories - HEIP Admin', categories });
});

router.post('/categories/save', async (req, res) => {
  try {
    const { id, name, description, order, isActive } = req.body;
    if (id) {
      const cat = await Category.findByPk(id);
      if (cat) await cat.update({ name, description, order: order || 0, isActive: isActive ? true : false });
    } else {
      const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') + '-' + Date.now();
      await Category.create({ name, slug, description, order: order || 0, isActive: isActive ? true : false });
    }
    req.flash('success', 'Category saved');
  } catch (err) { req.flash('error', 'Failed to save category'); }
  res.redirect('/admin/categories');
});

router.post('/categories/delete/:id', async (req, res) => {
  await Category.destroy({ where: { id: req.params.id } });
  res.redirect('/admin/categories');
});

// Orders
router.get('/orders', async (req, res) => {
  const status = req.query.status || '';
  const where = {};
  if (status) where.status = status;
  const orders = await Order.findAll({ where, order: [['createdAt', 'DESC']], include: [{ model: User }] });
  res.render('admin/orders', { title: 'Orders - HEIP Admin', orders, status });
});

router.get('/orders/:id', async (req, res) => {
  const order = await Order.findByPk(req.params.id, { include: [{ model: OrderItem }, { model: User }] });
  if (!order) { req.flash('error', 'Order not found'); return res.redirect('/admin/orders'); }
  res.render('admin/order-detail', { title: 'Order #' + order.orderNumber + ' - HEIP Admin', order });
});

router.post('/orders/update-status/:id', async (req, res) => {
  const { status } = req.body;
  const order = await Order.findByPk(req.params.id);
  if (order) {
    await order.update({ status });
    await Notification.create({
      type: 'order_status',
      title: 'Order #' + order.orderNumber + ' ' + status,
      message: 'Your order has been ' + status,
      link: '/account/orders/' + order.id,
      forAdmin: false,
      userId: order.userId
    });
    req.flash('success', 'Order status updated');
  }
  res.redirect('/admin/orders/' + req.params.id);
});



router.get('/users', async (req, res) => {
  const users = await User.findAll({ order: [['createdAt', 'DESC']] });
  res.render('admin/users', { title: 'Users - HEIP Admin', users });
});

router.get('/users/new', async (req, res) => {
  res.render('admin/user-form', { title: 'New User - HEIP Admin', user: null });
});

router.get('/users/edit/:id', async (req, res) => {
  const user = await User.findByPk(req.params.id);
  if (!user) { req.flash('error', 'User not found'); return res.redirect('/admin/users'); }
  res.render('admin/user-form', { title: 'Edit User - HEIP Admin', user });
});

router.post('/users/save', async (req, res) => {
  try {
    const { id, username, email, fullName, phone, address, role, isActive, password } = req.body;
    if (id) {
      const user = await User.findByPk(id);
      if (user) {
        const update = { username, email, fullName, phone, address, role, isActive: isActive ? true : false };
        if (password && password.length >= 6) update.password = await bcrypt.hash(password, 10);
        await user.update(update);
        req.flash('success', 'User updated');
      }
    } else {
      if (!password || password.length < 6) {
        req.flash('error', 'Password required (min 6 chars)');
        return res.redirect('/admin/users/new');
      }
      const existing = await User.findOne({ where: { email } });
      if (existing) { req.flash('error', 'Email already taken'); return res.redirect('/admin/users/new'); }
      const existingU = await User.findOne({ where: { username } });
      if (existingU) { req.flash('error', 'Username already taken'); return res.redirect('/admin/users/new'); }
      await User.create({
        username, email, password: await bcrypt.hash(password, 10),
        fullName, phone, address, role: role || 'user', isActive: isActive !== undefined ? true : false
      });
      req.flash('success', 'User created');
    }
  } catch (err) { req.flash('error', 'Failed to save user'); }
  res.redirect('/admin/users');
});

router.post('/users/delete/:id', async (req, res) => {
  await User.destroy({ where: { id: req.params.id, role: 'user' } });
  res.redirect('/admin/users');
});

// Banners
router.get('/banners', async (req, res) => {
  const banners = await Banner.findAll({ order: [['order', 'ASC']] });
  res.render('admin/banners', { title: 'Banners - HEIP Admin', banners });
});

router.post('/banners/save', uploadBannerImage.single('image'), async (req, res) => {
  try {
    const { id, type, title, content, link, linkText, bgColor, textColor, order, isActive } = req.body;
    const data = { type, title, content, link, linkText, bgColor, textColor, order: order || 0, isActive: isActive ? true : false };
    if (req.file) data.image = '/uploads/banners/' + req.file.filename;
    else if (req.body.existing_image) data.image = req.body.existing_image;
    if (id) {
      await Banner.update(data, { where: { id } });
    } else {
      await Banner.create(data);
    }
    req.flash('success', 'Banner saved');
  } catch (err) { req.flash('error', 'Failed to save banner'); }
  res.redirect('/admin/banners');
});

router.post('/banners/delete/:id', async (req, res) => {
  try {
    const banner = await Banner.findByPk(req.params.id);
    if (!banner) {
      req.flash('error', 'Banner not found');
      return res.redirect('/admin/banners');
    }
    if (banner.image && fs.existsSync(path.join(__dirname, '..', 'public', banner.image))) {
      fs.unlinkSync(path.join(__dirname, '..', 'public', banner.image));
    }
    await Banner.destroy({ where: { id: req.params.id } });
    req.flash('success', 'Banner deleted');
  } catch (err) {
    req.flash('error', 'Failed to delete banner');
  }
  res.redirect('/admin/banners');
});

// Support Tickets
router.get('/tickets', async (req, res) => {
  const status = req.query.status || '';
  const where = {};
  if (status) where.status = status;
  const tickets = await SupportTicket.findAll({ where, order: [['createdAt', 'DESC']], include: [{ model: User }] });
  res.render('admin/tickets', { title: 'Support Tickets - HEIP Admin', tickets, status });
});

router.get('/tickets/:id', async (req, res) => {
  const ticket = await SupportTicket.findByPk(req.params.id, { include: [{ model: User }] });
  if (!ticket) { req.flash('error', 'Ticket not found'); return res.redirect('/admin/tickets'); }
  res.render('admin/ticket-detail', { title: 'Ticket - HEIP Admin', ticket });
});

router.post('/tickets/reply/:id', async (req, res) => {
  try {
    const { adminReply } = req.body;
    const ticket = await SupportTicket.findByPk(req.params.id);
    if (ticket) {
      await ticket.update({ adminReply, status: 'replied', repliedAt: new Date() });
      await Notification.create({
        type: 'ticket_reply',
        title: 'Ticket #' + ticket.id + ' Replied',
        message: 'Your support ticket has been answered',
        link: '/support/' + ticket.id,
        forAdmin: false,
        userId: ticket.userId
      });
      req.flash('success', 'Reply sent');
    }
  } catch (err) { req.flash('error', 'Failed to send reply'); }
  res.redirect('/admin/tickets/' + req.params.id);
});

router.post('/tickets/close/:id', async (req, res) => {
  await SupportTicket.update({ status: 'closed' }, { where: { id: req.params.id } });
  res.redirect('/admin/tickets');
});

// Settings
router.get('/settings', async (req, res) => {
  const settings = await Setting.findAll();
  const settingsMap = {};
  settings.forEach(s => settingsMap[s.key] = s.value);
  res.render('admin/settings', { title: 'Settings - HEIP Admin', settings: settingsMap });
});

router.post('/settings', uploadLogo.single('logo'), async (req, res) => {
  try {
    const allowedKeys = ['site_name', 'site_description', 'footer_text', 'footer_email', 'footer_phone', 'footer_address', 'social_facebook', 'social_twitter', 'social_instagram', 'currency', 'about_text', 'terms_text', 'privacy_text', 'contact_email'];
    for (const key of allowedKeys) {
      if (req.body[key] !== undefined) {
        const [setting, created] = await Setting.findOrCreate({ where: { key }, defaults: { key, value: req.body[key] } });
        if (!created) await setting.update({ value: req.body[key] });
      }
    }
    if (req.file) {
      const [setting, created] = await Setting.findOrCreate({ where: { key: 'logo' }, defaults: { key: 'logo', value: '/logos/' + req.file.filename } });
      if (!created) await setting.update({ value: '/logos/' + req.file.filename });
    }
    req.flash('success', 'Settings saved');
  } catch (err) { req.flash('error', 'Failed to save settings: ' + err.message); }
  res.redirect('/admin/settings');
});

module.exports = router;
