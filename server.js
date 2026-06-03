const express = require('express');
const session = require('express-session');
const flash = require('connect-flash');
const path = require('path');
const fs = require('fs');
const sequelize = require('./config/database');
const { User, Category, Banner, Product, Setting, Notification } = require('./models');
const bcrypt = require('bcryptjs');

const app = express();
const PORT = process.env.PORT || 3000;

app.set('trust proxy', 1);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

app.use(session({
  secret: 'heip-secret-key-2026',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 24 * 60 * 60 * 1000 }
}));

app.use(flash());

app.use((req, res, next) => {
  res.locals.user = req.session.userId ? { id: req.session.userId, username: req.session.username, role: req.session.userRole } : null;
  res.locals.cartCount = req.session.cart ? req.session.cart.reduce((a, i) => a + i.quantity, 0) : 0;
  res.locals.error = req.flash('error');
  res.locals.success = req.flash('success');
  res.locals.path = req.path;
  next();
});

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Load global data for all routes
app.use(async (req, res, next) => {
  try {
    const settings = await Setting.findAll();
    const s = {};
    settings.forEach(set => s[set.key] = set.value);
    res.locals.siteSettings = s;
    res.locals.categories = await Category.findAll({ where: { isActive: true }, order: [['order', 'ASC']] });
    res.locals.banners = await Banner.findAll({ where: { isActive: true }, order: [['order', 'ASC']] });
    res.locals.featuredProducts = await Product.findAll({ where: { featured: true, isActive: true }, limit: 4 });
  } catch (e) {
    res.locals.siteSettings = {};
    res.locals.categories = [];
    res.locals.banners = [];
    res.locals.featuredProducts = [];
  }
  next();
});

// Load user/notifications for navbar
app.use(async (req, res, next) => {
  try {
    if (req.session.userId) {
      const where = req.session.userRole === 'admin'
        ? { forAdmin: true }
        : { userId: req.session.userId, forAdmin: false };
      const notifications = await Notification.findAll({ where, order: [['createdAt', 'DESC']], limit: 5 });
      res.locals.userNotifications = notifications;
      res.locals.unreadNotifCount = await Notification.count({ where: { ...where, isRead: false } });
    } else {
      res.locals.userNotifications = [];
      res.locals.unreadNotifCount = 0;
    }
  } catch (e) {
    res.locals.userNotifications = [];
    res.locals.unreadNotifCount = 0;
  }
  next();
});

// Routes
app.use('/', require('./routes/index'));
app.use('/', require('./routes/auth'));
app.use('/products', require('./routes/products'));
app.use('/cart', require('./routes/cart'));
app.use('/checkout', require('./routes/checkout'));
app.use('/account/orders', require('./routes/orders'));
app.use('/support', require('./routes/support'));
app.use('/admin', require('./routes/admin'));

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).render('error', { title: 'Error - HEIP', message: 'Something went wrong', error: [] });
});

// Sync database and start server
async function autoSeed() {
  const userCount = await User.count();
  if (userCount > 0) return;
  console.log('Empty database — seeding default data...');
  const { Category, Product, Banner, Setting } = require('./models');
  const hashed = await bcrypt.hash('admin123', 10);
  await User.create({ username: 'admin', email: 'admin@heip.com', password: hashed, fullName: 'Admin', role: 'admin' });
  await User.create({ username: 'demo', email: 'demo@heip.com', password: await bcrypt.hash('user123', 10), fullName: 'Demo User', role: 'user' });
  const cats = await Category.bulkCreate([
    { name: 'E-books', slug: 'ebooks', order: 1 }, { name: 'Templates', slug: 'templates', order: 2 },
    { name: 'Software', slug: 'software', order: 3 }, { name: 'Graphics', slug: 'graphics', order: 4 },
    { name: 'Courses', slug: 'courses', order: 5 }
  ]);
  await Product.bulkCreate([
    { title: 'Ultimate Design Bundle', slug: 'ultimate-design-bundle', description: '500+ icons, 50 templates, 20 mockups. Premium design assets for web and mobile.', shortDescription: '500+ icons, 50 templates', price: 49.99, previousPrice: 99.99, categoryId: cats[1].id, featured: true, options: JSON.stringify([{ name: 'License', type: 'select', values: ['Personal', 'Commercial', 'Extended'] }]), salesCount: 127 },
    { title: 'Mastering React - Complete Guide', slug: 'mastering-react-guide', description: 'Complete React e-book. Hooks, Redux, Next.js, testing, deployment. 20h video + 100 exercises.', shortDescription: '20h video, 100+ exercises', price: 29.99, previousPrice: 59.99, categoryId: cats[0].id, featured: true, salesCount: 89 },
    { title: 'Photo Editing Presets Pack', slug: 'photo-editing-presets', description: '200 professional Lightroom & Photoshop presets. Portrait, landscape, wedding, street.', shortDescription: '200 presets for LR & PS', price: 19.99, previousPrice: 39.99, categoryId: cats[3].id, featured: true, salesCount: 245 },
    { title: 'SEO Mastery Course', slug: 'seo-mastery-course', description: 'Complete SEO course: on-page, off-page, technical, local SEO. Certification included.', shortDescription: 'SEO course with certification', price: 39.99, previousPrice: 79.99, categoryId: cats[4].id, featured: true, options: JSON.stringify([{ name: 'Access Level', type: 'select', values: ['Basic', 'Premium', 'Enterprise'] }]), salesCount: 56 },
    { title: 'Project Management Software', slug: 'project-management-software', description: 'Self-hosted PM software. Task management, Gantt charts, time tracking, unlimited users.', shortDescription: 'Self-hosted, unlimited users', price: 99.99, previousPrice: 199.99, categoryId: cats[2].id, salesCount: 34 },
    { title: 'Font Collection - 500 Premium', slug: 'font-collection-premium', description: '500 premium fonts for commercial use. Serif, sans-serif, script, display, handwritten.', shortDescription: '500 premium fonts', price: 14.99, previousPrice: 29.99, categoryId: cats[3].id, salesCount: 412 },
    { title: 'JS Advanced Concepts', slug: 'javascript-advanced-concepts', description: 'Deep dive: closures, prototypes, async/await, event loop, design patterns.', shortDescription: 'Advanced JS deep dive', price: 24.99, previousPrice: 49.99, categoryId: cats[0].id, salesCount: 178 },
    { title: 'WordPress Premium Theme', slug: 'wordpress-premium-theme', description: 'Modern responsive WP theme. Page builder, WooCommerce, lifetime updates.', shortDescription: 'Modern WP theme', price: 34.99, previousPrice: 69.99, categoryId: cats[1].id, options: JSON.stringify([{ name: 'License', type: 'select', values: ['Regular', 'Extended'] }]), salesCount: 67 }
  ]);
  await Banner.bulkCreate([
    { type: 'text', title: 'Welcome to HEIP', content: 'Premium digital products for creators and professionals.', link: '/search', linkText: 'Browse Products', bgColor: '#0a0a0a', order: 1 },
    { type: 'text', title: 'Summer Sale - 50% Off', content: 'Limited time offer on all products.', link: '/search', linkText: 'Shop Now', bgColor: '#1a1a1a', order: 2 }
  ]);
  await Setting.bulkCreate([
    { key: 'site_name', value: 'HEIP' }, { key: 'site_description', value: 'Premium digital products marketplace.' },
    { key: 'footer_email', value: 'support@heip.com' }, { key: 'contact_email', value: 'hello@heip.com' }
  ]);
  console.log('Default data created!');
}

async function start() {
  try {
    await sequelize.sync({ force: false });
    console.log('Database synced');
    await autoSeed();
    app.listen(PORT, () => {
      console.log('HEIP server running on http://localhost:' + PORT);
    });
  } catch (err) {
    console.error('Failed to start:', err);
  }
}

start();
