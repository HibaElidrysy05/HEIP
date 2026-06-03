document.addEventListener('DOMContentLoaded', function() {

  // Mobile Nav
  var navToggle = document.getElementById('navToggle');
  var navMenu = document.getElementById('navMenu');
  var navOverlay = null;

  if (navToggle && navMenu) {
    navOverlay = document.createElement('div');
    navOverlay.className = 'nav-overlay';
    document.body.appendChild(navOverlay);

    navToggle.addEventListener('click', function(e) {
      e.stopPropagation();
      navMenu.classList.toggle('active');
      navOverlay.classList.toggle('active');
      document.body.style.overflow = navMenu.classList.contains('active') ? 'hidden' : '';
      var icon = navToggle.querySelector('i');
      if (icon) icon.className = navMenu.classList.contains('active') ? 'fas fa-times' : 'fas fa-bars';
    });

    navOverlay.addEventListener('click', function() {
      closeNav();
    });

    var navLinks = navMenu.querySelectorAll('a');
    navLinks.forEach(function(link) {
      link.addEventListener('click', function() {
        closeNav();
      });
    });
  }

  function closeNav() {
    if (navMenu && navOverlay) {
      navMenu.classList.remove('active');
      navOverlay.classList.remove('active');
      document.body.style.overflow = '';
      var icon = navToggle.querySelector('i');
      if (icon) icon.className = 'fas fa-bars';
    }
  }

  // Mobile dropdowns (touch)
  var dropdowns = document.querySelectorAll('.nav-dropdown');
  dropdowns.forEach(function(dd) {
    dd.addEventListener('click', function(e) {
      if (window.innerWidth <= 768) {
        e.preventDefault();
        dd.classList.toggle('active');
      }
    });
  });

  // Admin sidebar toggle
  var adminToggle = document.getElementById('adminToggle');
  var adminSidebar = document.getElementById('adminSidebar');
  if (adminToggle && adminSidebar) {
    adminToggle.addEventListener('click', function() {
      adminSidebar.classList.toggle('active');
      var overlay = document.querySelector('.admin-sidebar-overlay');
      if (!overlay) {
        overlay = document.createElement('div');
        overlay.className = 'admin-sidebar-overlay';
        overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.7);z-index:998;opacity:0;pointer-events:none;transition:opacity 0.3s';
        document.body.appendChild(overlay);
        overlay.addEventListener('click', function() {
          adminSidebar.classList.remove('active');
          overlay.style.opacity = '0';
          overlay.style.pointerEvents = 'none';
        });
      }
      if (adminSidebar.classList.contains('active')) {
        overlay.style.opacity = '1';
        overlay.style.pointerEvents = 'all';
      } else {
        overlay.style.opacity = '0';
        overlay.style.pointerEvents = 'none';
      }
    });
  }

  // Flash messages
  var flashMessages = document.querySelectorAll('.flash');
  flashMessages.forEach(function(msg) {
    msg.style.cursor = 'pointer';
    msg.addEventListener('click', function() { msg.remove(); });
    setTimeout(function() {
      msg.style.opacity = '0';
      msg.style.transform = 'translateY(-10px)';
      setTimeout(function() { if (msg.parentNode) msg.remove(); }, 300);
    }, 5000);
  });

  // Add to cart (AJAX)
  var addToCartForms = document.querySelectorAll('.add-to-cart-form');
  addToCartForms.forEach(function(form) {
    form.addEventListener('submit', function(e) {
      e.preventDefault();
      var formData = new FormData(form);
      var data = {};
      formData.forEach(function(v, k) { data[k] = v; });
      fetch('/cart/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
      .then(function(r) { return r.json(); })
      .then(function(resp) {
        if (resp.success) {
          var badge = document.getElementById('cartBadge');
          if (badge) {
            badge.textContent = resp.count;
            badge.style.transform = 'scale(1.4)';
            setTimeout(function() { badge.style.transform = 'scale(1)'; }, 200);
          }
          var flash = document.createElement('div');
          flash.className = 'flash flash-success';
          flash.innerHTML = '<i class="fas fa-check-circle"></i> Added to cart!';
          var main = document.querySelector('.main-content');
          if (main) main.prepend(flash);
          setTimeout(function() {
            flash.style.opacity = '0';
            flash.style.transform = 'translateY(-10px)';
            setTimeout(function() { if (flash.parentNode) flash.remove(); }, 300);
          }, 3000);
        }
      });
    });
  });
});
