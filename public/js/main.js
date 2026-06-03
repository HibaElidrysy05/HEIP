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

  // Notification bell dropdown
  var notifBell = document.getElementById('notifBell');
  var notifDropdown = document.getElementById('notifDropdown');
  var notifWrap = document.getElementById('notifDropdownWrap');

  if (notifBell && notifDropdown && notifWrap) {
    notifBell.addEventListener('click', function(e) {
      e.preventDefault();
      e.stopPropagation();
      notifWrap.classList.toggle('active');
    });

    document.addEventListener('click', function(e) {
      if (!notifWrap.contains(e.target)) {
        notifWrap.classList.remove('active');
      }
    });

    // Mark notification as read on click
    var notifItems = notifDropdown.querySelectorAll('.notif-dd-item');
    notifItems.forEach(function(item) {
      item.addEventListener('click', function(e) {
        var id = this.getAttribute('data-id');
        if (id) {
          fetch('/admin/notifications/mark-read/' + id, { method: 'POST', headers: { 'Content-Type': 'application/json' } })
            .then(function(r) { return r.json(); })
            .then(function(resp) {
              if (resp.success) {
                item.classList.remove('unread');
                var badge = document.getElementById('notifBadge');
                if (badge) {
                  var count = parseInt(badge.textContent) - 1;
                  badge.textContent = count > 0 ? count : 0;
                  if (count <= 0) badge.style.display = 'none';
                }
              }
            });
        }
      });
    });

    // Mark all as read
    var markAllBtn = document.getElementById('markAllNotifRead');
    if (markAllBtn) {
      markAllBtn.addEventListener('click', function(e) {
        e.preventDefault();
        fetch('/admin/notifications/mark-all-read', { method: 'POST', headers: { 'Content-Type': 'application/json' } })
          .then(function(r) { return r.json(); })
          .then(function(resp) {
            if (resp.success) {
              notifItems.forEach(function(item) { item.classList.remove('unread'); });
              var badge = document.getElementById('notifBadge');
              if (badge) { badge.textContent = '0'; badge.style.display = 'none'; }
              if (markAllBtn.parentNode) markAllBtn.parentNode.removeChild(markAllBtn);
            }
          });
      });
    }
  }

  // Confirm Modal
  var modalOverlay = null;

  function showConfirmModal(message, callback) {
    if (!modalOverlay) {
      modalOverlay = document.createElement('div');
      modalOverlay.className = 'modal-overlay';
      modalOverlay.innerHTML = '<div class="modal"><div class="modal-icon"><i class="fas fa-exclamation-triangle"></i></div><h3>Are you sure?</h3><p id="confirmModalMsg"></p><div class="modal-actions"><button class="btn btn-outline" id="confirmCancel">Cancel</button><button class="btn btn-danger" id="confirmOk">Delete</button></div></div>';
      document.body.appendChild(modalOverlay);

      modalOverlay.addEventListener('click', function(e) {
        if (e.target === modalOverlay) closeModal();
      });

      document.getElementById('confirmCancel').addEventListener('click', closeModal);
      document.getElementById('confirmOk').addEventListener('click', function() {
        closeModal();
        if (window._confirmCallback) window._confirmCallback();
      });
    }
    document.getElementById('confirmModalMsg').textContent = message;
    modalOverlay.style.display = 'flex';
    window._confirmCallback = callback;
  }

  function closeModal() {
    if (modalOverlay) {
      modalOverlay.style.display = 'none';
      window._confirmCallback = null;
    }
  }

  // Replace native confirm with modal
  document.addEventListener('click', function(e) {
    var target = e.target.closest('[data-confirm]');
    if (target) {
      e.preventDefault();
      var message = target.getAttribute('data-confirm') || 'Are you sure?';
      showConfirmModal(message, function() {
        var form = target.closest('form');
        if (form) { form.submit(); }
        else {
          var link = target.getAttribute('href');
          if (link) window.location.href = link;
        }
      });
    }
  });

  // Quantity increment/decrement
  document.querySelectorAll('.qty-wrapper').forEach(function(wrapper) {
    var form = wrapper.closest('.cart-qty-form') || wrapper.closest('form');
    var input = wrapper.querySelector('input');
    var minus = wrapper.querySelector('.qty-minus');
    var plus = wrapper.querySelector('.qty-plus');
    var debounceTimer;

    function submitQty() {
      if (form && form.classList.contains('cart-qty-form')) {
        var val = parseInt(input.value) || 0;
        if (val <= 0) {
          var removeForm = form.parentNode.querySelector('form[action*="/cart/remove"]');
          if (removeForm) removeForm.submit();
          return;
        }
        var fd = new FormData(form);
        fetch(form.action, { method: 'POST', body: new URLSearchParams(fd) })
          .then(function() { window.location.reload(); });
      }
    }

    if (minus && input) {
      minus.addEventListener('click', function() {
        var val = parseInt(input.value) || 1;
        if (val > 1) {
          input.value = val - 1;
          clearTimeout(debounceTimer);
          debounceTimer = setTimeout(submitQty, 300);
        }
      });
    }

    if (plus && input) {
      plus.addEventListener('click', function() {
        var val = parseInt(input.value) || 1;
        input.value = val + 1;
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(submitQty, 300);
      });
    }

    if (input) {
      input.addEventListener('change', function() {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(submitQty, 300);
      });
    }
  });

  // Add to cart (AJAX)
  var addToCartForms = document.querySelectorAll('.add-to-cart-form');
  addToCartForms.forEach(function(form) {
    form.addEventListener('submit', function(e) {
      e.preventDefault();
      var btn = form.querySelector('.btn-submit') || form.querySelector('button[type="submit"]');
      if (btn && btn.classList.contains('loading')) return;
      var formData = new FormData(form);
      var data = {};
      formData.forEach(function(v, k) { data[k] = v; });

      if (btn) {
        var originalHtml = btn.innerHTML;
        btn.classList.add('loading');
        btn.innerHTML = '<span class="spinner"></span> Adding...';
      }

      fetch('/cart/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
      .then(function(r) { return r.json(); })
      .then(function(resp) {
        if (btn) { btn.classList.remove('loading'); btn.innerHTML = originalHtml; }
        if (resp.success) {
          var badge = document.getElementById('cartBadge');
          if (badge) {
            badge.textContent = resp.count;
            badge.style.transform = 'scale(1.4)';
            setTimeout(function() { badge.style.transform = 'scale(1)'; }, 200);
          }
          showToast('Added to cart!', 'success');
        }
      })
      .catch(function() {
        if (btn) { btn.classList.remove('loading'); btn.innerHTML = originalHtml; }
        showToast('Failed to add to cart', 'error');
      });
    });
  });

  // Toast notification system
  function showToast(message, type) {
    var toast = document.createElement('div');
    toast.className = 'flash flash-' + (type || 'success');
    var icon = type === 'error' ? 'fa-exclamation-circle' : 'fa-check-circle';
    toast.innerHTML = '<i class="fas ' + icon + '"></i> ' + message;
    toast.style.cssText = 'position:fixed;top:90px;right:24px;max-width:360px;z-index:9999;margin:0;box-shadow:var(--shadow-lg);animation:flashIn 0.3s ease;';
    document.body.appendChild(toast);
    toast.addEventListener('click', function() { toast.remove(); });
    setTimeout(function() {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(-10px)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(function() { if (toast.parentNode) toast.remove(); }, 300);
    }, 4000);
  }
});
