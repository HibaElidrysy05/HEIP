const express = require('express');
const session = require('express-session');
const flash = require('connect-flash');
const path = require('path');
const fs = require('fs');
const sequelize = require('./config/database');
const { Category, Banner, Product, Setting } = require('./models');

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
async function start() {
  try {
    await sequelize.sync({ force: false });
    console.log('Database synced');
    app.listen(PORT, () => {
      console.log('HEIP server running on http://localhost:' + PORT);
    });
  } catch (err) {
    console.error('Failed to start:', err);
  }
}

start();
