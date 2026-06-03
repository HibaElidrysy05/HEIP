const express = require('express');
const bcrypt = require('bcryptjs');
const router = express.Router();
const { User } = require('../models');
const { isNotAuthenticated, isAuthenticated } = require('../middleware/auth');
const { uploadAvatar } = require('../middleware/upload');

router.get('/login', isNotAuthenticated, (req, res) => {
  res.render('login', { title: 'Login - HEIP' });
});

router.post('/login', isNotAuthenticated, async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ where: { email } });
    if (!user) {
      req.flash('error', 'Invalid email or password');
      return res.redirect('/login');
    }
    if (!user.isActive) {
      req.flash('error', 'Account is deactivated. Contact admin.');
      return res.redirect('/login');
    }
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      req.flash('error', 'Invalid email or password');
      return res.redirect('/login');
    }
    req.session.userId = user.id;
    req.session.userRole = user.role;
    req.session.username = user.username;
    req.flash('success', 'Welcome back, ' + user.username + '!');
    res.redirect(user.role === 'admin' ? '/admin' : '/');
  } catch (err) {
    req.flash('error', 'Something went wrong');
    res.redirect('/login');
  }
});

router.get('/register', isNotAuthenticated, (req, res) => {
  res.render('register', { title: 'Register - HEIP' });
});

router.post('/register', isNotAuthenticated, async (req, res) => {
  try {
    const { username, email, password, confirmPassword } = req.body;
    if (password !== confirmPassword) {
      req.flash('error', 'Passwords do not match');
      return res.redirect('/register');
    }
    if (password.length < 6) {
      req.flash('error', 'Password must be at least 6 characters');
      return res.redirect('/register');
    }
    const existing = await User.findOne({ where: { email } });
    if (existing) {
      req.flash('error', 'Email already registered');
      return res.redirect('/register');
    }
    const existingUser = await User.findOne({ where: { username } });
    if (existingUser) {
      req.flash('error', 'Username already taken');
      return res.redirect('/register');
    }
    const hashed = await bcrypt.hash(password, 10);
    await User.create({ username, email, password: hashed });
    req.flash('success', 'Account created! Please log in.');
    res.redirect('/login');
  } catch (err) {
    req.flash('error', 'Something went wrong');
    res.redirect('/register');
  }
});

router.get('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/');
});

router.get('/account', isAuthenticated, async (req, res) => {
  const user = await User.findByPk(req.session.userId);
  res.render('account/profile', { title: 'My Account - HEIP', user });
});

router.post('/account', isAuthenticated, uploadAvatar.single('avatar'), async (req, res) => {
  try {
    const user = await User.findByPk(req.session.userId);
    const { fullName, phone, address, email } = req.body;
    const update = { fullName, phone, address, email };
    if (req.file) update.avatar = '/uploads/products/' + req.file.filename;
    await user.update(update);
    req.flash('success', 'Profile updated');
    res.redirect('/account');
  } catch (err) {
    req.flash('error', 'Update failed');
    res.redirect('/account');
  }
});

router.post('/account/password', isAuthenticated, async (req, res) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;
    const user = await User.findByPk(req.session.userId);
    const valid = await bcrypt.compare(currentPassword, user.password);
    if (!valid) {
      req.flash('error', 'Current password is incorrect');
      return res.redirect('/account');
    }
    if (newPassword !== confirmPassword || newPassword.length < 6) {
      req.flash('error', 'Passwords do not match or too short');
      return res.redirect('/account');
    }
    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();
    req.flash('success', 'Password changed');
    res.redirect('/account');
  } catch (err) {
    req.flash('error', 'Something went wrong');
    res.redirect('/account');
  }
});

module.exports = router;
