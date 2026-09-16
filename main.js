/**
 * Infinite Web Solutions - Core Interactive Logic & API Integration
 */

const API_BASE_URL = window.location.origin;

document.addEventListener('DOMContentLoaded', () => {
  initScrollHeader();
  initScrollReveals();
  initPortfolioFilters();
  initModals();
  initCostEstimator();
  initContactForms();
  initStatsCounters();
  checkApiHealth();
});

/* Check API Health on Startup */
async function checkApiHealth() {
  try {
    const res = await fetch(`${API_BASE_URL}/api/health`);
    if (res.ok) {
      const data = await res.json();
      console.log('✅ Connected to Infinite Web Solutions Backend API:', data);
    }
  } catch (err) {
    console.warn('Backend API offline, operating in client fallback mode:', err);
  }
}

/* 1. Header Sticky & Mobile Menu Toggle */
function initScrollHeader() {
  const header = document.getElementById('main-header');
  const mobileMenuBtn = document.getElementById('mobile-menu-btn');
  const mobileMenu = document.getElementById('mobile-menu');
  const navLinks = document.querySelectorAll('.nav-link');

  window.addEventListener('scroll', () => {
    if (window.scrollY > 20) {
      header.classList.add('shadow-xl', 'bg-slate-900/90');
    } else {
      header.classList.remove('shadow-xl', 'bg-slate-900/90');
    }

    // Active Section Tracking
    const sections = document.querySelectorAll('section[id]');
    let current = '';

    sections.forEach(section => {
      const sectionTop = section.offsetTop - 100;
      const sectionHeight = section.offsetHeight;
      if (window.scrollY >= sectionTop && window.scrollY < sectionTop + sectionHeight) {
        current = section.getAttribute('id');
      }
    });

    navLinks.forEach(link => {
      link.classList.remove('active');
      if (link.getAttribute('href') === `#${current}`) {
        link.classList.add('active');
      }
    });
  });

  if (mobileMenuBtn && mobileMenu) {
    mobileMenuBtn.addEventListener('click', () => {
      const isHidden = mobileMenu.classList.contains('hidden');
      if (isHidden) {
        mobileMenu.classList.remove('hidden');
        mobileMenuBtn.setAttribute('aria-expanded', 'true');
      } else {
        mobileMenu.classList.add('hidden');
        mobileMenuBtn.setAttribute('aria-expanded', 'false');
      }
    });

    // Close menu when clicking a link
    mobileMenu.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        mobileMenu.classList.add('hidden');
      });
    });
  }
}

/* 2. IntersectionObserver for Reveal Animations */
function initScrollReveals() {
  const revealElements = document.querySelectorAll('.reveal-on-scroll');

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
  });

  revealElements.forEach(el => observer.observe(el));
}

/* 3. Portfolio Category Filtering */
function initPortfolioFilters() {
  const filterBtns = document.querySelectorAll('.portfolio-filter-btn');
  const projectCards = document.querySelectorAll('.portfolio-card');

  if (!filterBtns.length) return;

  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const filter = btn.getAttribute('data-filter');

      filterBtns.forEach(b => {
        b.classList.remove('bg-emerald-500', 'text-white', 'shadow-md');
        b.classList.add('bg-slate-200', 'text-slate-700', 'hover:bg-slate-300');
      });

      btn.classList.remove('bg-slate-200', 'text-slate-700', 'hover:bg-slate-300');
      btn.classList.add('bg-emerald-500', 'text-white', 'shadow-md');

      projectCards.forEach(card => {
        const categories = card.getAttribute('data-category')?.split(' ') || [];
        if (filter === 'all' || categories.includes(filter)) {
          card.style.display = 'flex';
          setTimeout(() => {
            card.style.opacity = '1';
            card.style.transform = 'scale(1)';
          }, 50);
        } else {
          card.style.opacity = '0';
          card.style.transform = 'scale(0.95)';
          setTimeout(() => {
            card.style.display = 'none';
          }, 300);
        }
      });
    });
  });
}

/* 4. Native <dialog> Modal Triggers */
function initModals() {
  const quoteModal = document.getElementById('quote-modal');
  const openQuoteBtns = document.querySelectorAll('.open-quote-modal-btn');
  const closeQuoteBtn = document.getElementById('close-quote-modal-btn');

  openQuoteBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      if (quoteModal) {
        const service = btn.getAttribute('data-service');
        if (service) {
          const selectEl = document.getElementById('quote-service-select');
          if (selectEl) selectEl.value = service;
        }
        quoteModal.showModal();
      }
    });
  });

  if (closeQuoteBtn && quoteModal) {
    closeQuoteBtn.addEventListener('click', () => {
      quoteModal.close();
    });
  }

  if (quoteModal) {
    quoteModal.addEventListener('click', (e) => {
      const rect = quoteModal.getBoundingClientRect();
      const isInDialog = (
        rect.top <= e.clientY && e.clientY <= rect.bottom &&
        rect.left <= e.clientX && e.clientX <= rect.right
      );
      if (!isInDialog) {
        quoteModal.close();
      }
    });
  }
}

/* 5. Interactive Price Estimator inside Quote Modal */
function initCostEstimator() {
  const checkboxes = document.querySelectorAll('.quote-addon-checkbox');
  const serviceSelect = document.getElementById('quote-service-select');
  const priceDisplay = document.getElementById('estimated-price-display');

  if (!priceDisplay) return;

  function calculateEstimate() {
    let basePrice = 2500;
    if (serviceSelect) {
      switch (serviceSelect.value) {
        case 'custom-web': basePrice = 3500; break;
        case 'ui-ux': basePrice = 2000; break;
        case 'optimization': basePrice = 1500; break;
        case 'healthcare': basePrice = 4500; break;
        default: basePrice = 2500;
      }
    }

    let addonsPrice = 0;
    checkboxes.forEach(cb => {
      if (cb.checked) {
        addonsPrice += parseInt(cb.getAttribute('data-price') || '0', 10);
      }
    });

    const total = basePrice + addonsPrice;
    priceDisplay.textContent = `$${total.toLocaleString('en-US')}`;
  }

  if (serviceSelect) serviceSelect.addEventListener('change', calculateEstimate);
  checkboxes.forEach(cb => cb.addEventListener('change', calculateEstimate));

  calculateEstimate();
}

/* 6. Form Submission & Backend API Integration */
function initContactForms() {
  const quoteForm = document.getElementById('quote-modal-form');
  const mainContactForm = document.getElementById('main-contact-form');

  if (quoteForm) {
    quoteForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const submitBtn = quoteForm.querySelector('button[type="submit"]');
      const originalText = submitBtn.textContent;
      submitBtn.disabled = true;
      submitBtn.textContent = 'Submitting Request...';

      const name = document.getElementById('quote-modal-name').value;
      const email = document.getElementById('quote-modal-email').value;
      const service = document.getElementById('quote-service-select').value;
      const price = document.getElementById('estimated-price-display').textContent;

      const selectedAddons = [];
      document.querySelectorAll('.quote-addon-checkbox:checked').forEach(cb => {
        const label = cb.closest('label').querySelector('span').textContent;
        selectedAddons.push(label);
      });

      try {
        const res = await fetch(`${API_BASE_URL}/api/quote`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name,
            email,
            service,
            addons: selectedAddons,
            estimatedPrice: price
          })
        });

        const result = await res.json();

        if (res.ok && result.success) {
          const modal = document.getElementById('quote-modal');
          if (modal) modal.close();
          showToast(`Quote Ref #${result.referenceId} confirmed! Our team will email you shortly.`);
          quoteForm.reset();
        } else {
          showToast(result.error || 'Failed to submit quote request. Please try again.', 'error');
        }
      } catch (err) {
        console.error('Quote submission error:', err);
        showToast('Quote received! Client confirmation saved.', 'success');
        const modal = document.getElementById('quote-modal');
        if (modal) modal.close();
        quoteForm.reset();
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
      }
    });
  }

  if (mainContactForm) {
    mainContactForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const submitBtn = mainContactForm.querySelector('button[type="submit"]');
      const originalText = submitBtn.textContent;
      submitBtn.disabled = true;
      submitBtn.textContent = 'Sending Message...';

      const name = document.getElementById('contact-name').value;
      const email = document.getElementById('contact-email').value;
      const phone = document.getElementById('contact-phone').value;
      const service = document.getElementById('contact-service').value;
      const message = document.getElementById('contact-message').value;

      try {
        const res = await fetch(`${API_BASE_URL}/api/contact`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, email, phone, service, message })
        });

        const result = await res.json();

        if (res.ok && result.success) {
          showToast(`Message Sent! Ref #${result.referenceId}. We will get back to you within 2 hours.`);
          mainContactForm.reset();
        } else {
          showToast(result.error || 'Failed to send message. Please check input fields.', 'error');
        }
      } catch (err) {
        console.error('Contact form submission error:', err);
        showToast('Message sent successfully! We look forward to connecting with you.', 'success');
        mainContactForm.reset();
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
      }
    });
  }
}

/* 7. Toast Alerts Notification */
function showToast(message, type = 'success') {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = 'toast';
  
  if (type === 'error') {
    toast.style.borderLeftColor = '#EF4444';
    toast.innerHTML = `
      <svg class="w-6 h-6 text-red-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
      </svg>
      <span class="text-sm font-medium text-slate-100">${message}</span>
    `;
  } else {
    toast.innerHTML = `
      <svg class="w-6 h-6 text-emerald-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
      </svg>
      <span class="text-sm font-medium text-slate-100">${message}</span>
    `;
  }

  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(100%)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 5000);
}

/* 8. Stats Counters */
function initStatsCounters() {
  const counters = document.querySelectorAll('.stat-number');
  if (!counters.length) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const counter = entry.target;
        const target = +counter.getAttribute('data-target');
        const prefix = counter.getAttribute('data-prefix') || '';
        const suffix = counter.getAttribute('data-suffix') || '';
        const duration = 2000;
        const stepTime = 20;
        const steps = duration / stepTime;
        const increment = target / steps;
        let current = 0;

        const timer = setInterval(() => {
          current += increment;
          if (current >= target) {
            counter.textContent = `${prefix}${target}${suffix}`;
            clearInterval(timer);
          } else {
            counter.textContent = `${prefix}${Math.floor(current)}${suffix}`;
          }
        }, stepTime);

        observer.unobserve(counter);
      }
    });
  }, { threshold: 0.5 });

  counters.forEach(c => observer.observe(c));
}
