const express = require('express');
const router = express.Router();
const { SupportTicket, Notification, Category } = require('../models');
const { isAuthenticated } = require('../middleware/auth');

router.get('/', isAuthenticated, async (req, res) => {
  const tickets = await SupportTicket.findAll({
    where: { userId: req.session.userId },
    order: [['createdAt', 'DESC']]
  });
  const categories = await Category.findAll({ where: { isActive: true }, order: [['order', 'ASC']] });
  res.render('support/index', { title: 'Support - HEIP', tickets, categories });
});

router.get('/new', isAuthenticated, async (req, res) => {
  const categories = await Category.findAll({ where: { isActive: true }, order: [['order', 'ASC']] });
  res.render('support/new', { title: 'New Ticket - HEIP', categories });
});

router.post('/new', isAuthenticated, async (req, res) => {
  try {
    const { subject, message, priority } = req.body;
    if (!subject || !message) {
      req.flash('error', 'Subject and message are required');
      return res.redirect('/support/new');
    }
    await SupportTicket.create({
      userId: req.session.userId,
      subject,
      message,
      priority: priority || 'medium'
    });
    await Notification.create({
      type: 'new_ticket',
      title: 'New Support Ticket',
      message: 'Ticket from ' + req.session.username + ': ' + subject,
      link: '/admin/tickets',
      forAdmin: true
    });
    req.flash('success', 'Ticket submitted. We will respond shortly.');
    res.redirect('/support');
  } catch (err) {
    req.flash('error', 'Failed to submit ticket');
    res.redirect('/support/new');
  }
});

router.get('/:id', isAuthenticated, async (req, res) => {
  const ticket = await SupportTicket.findOne({
    where: { id: req.params.id, userId: req.session.userId }
  });
  if (!ticket) {
    req.flash('error', 'Ticket not found');
    return res.redirect('/support');
  }
  const categories = await Category.findAll({ where: { isActive: true }, order: [['order', 'ASC']] });
  res.render('support/detail', { title: 'Ticket - HEIP', ticket, categories });
});

module.exports = router;
