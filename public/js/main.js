document.addEventListener('DOMContentLoaded', function() {
  const navToggle = document.getElementById('navToggle');
  const navMenu = document.getElementById('navMenu');
  if (navToggle && navMenu) {
    navToggle.addEventListener('click', function() {
      navMenu.classList.toggle('active');
    });
  }

  const adminToggle = document.getElementById('adminToggle');
  const adminSidebar = document.getElementById('adminSidebar');
  if (adminToggle && adminSidebar) {
    adminToggle.addEventListener('click', function() {
      adminSidebar.classList.toggle('active');
    });
  }

  const flashMessages = document.querySelectorAll('.flash');
  flashMessages.forEach(function(msg) {
    setTimeout(function() {
      msg.style.opacity = '0';
      msg.style.transform = 'translateY(-10px)';
      setTimeout(function() { msg.remove(); }, 300);
    }, 4000);
  });

  const addToCartForms = document.querySelectorAll('.add-to-cart-form');
  addToCartForms.forEach(function(form) {
    form.addEventListener('submit', function(e) {
      e.preventDefault();
      const formData = new FormData(form);
      const data = {};
      formData.forEach(function(v, k) { data[k] = v; });
      fetch('/cart/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
      .then(function(r) { return r.json(); })
      .then(function(resp) {
        if (resp.success) {
          const badge = document.getElementById('cartBadge');
          if (badge) badge.textContent = resp.count;
          const flash = document.createElement('div');
          flash.className = 'flash flash-success';
          flash.innerHTML = '<i class="fas fa-check-circle"></i> Added to cart!';
          document.querySelector('.main-content').prepend(flash);
          setTimeout(function() { flash.remove(); }, 3000);
        }
      });
    });
  });
});
