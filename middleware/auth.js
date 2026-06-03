module.exports = {
  isAuthenticated: (req, res, next) => {
    if (req.session && req.session.userId) {
      return next();
    }
    req.flash('error', 'Please log in to continue');
    res.redirect('/login');
  },

  isNotAuthenticated: (req, res, next) => {
    if (!req.session || !req.session.userId) {
      return next();
    }
    res.redirect('/');
  },

  isAdmin: (req, res, next) => {
    if (req.session && req.session.userId && req.session.userRole === 'admin') {
      return next();
    }
    req.flash('error', 'Admin access required');
    res.redirect('/login');
  }
};
