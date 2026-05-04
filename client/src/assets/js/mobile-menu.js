/**
 * Mobile Menu Enhancement
 * Celio E-commerce Website
 */

class MobileMenu {
  constructor() {
    this.init();
  }

  init() {
    this.createMobileMenu();
    this.bindEvents();
    this.handleResize();
  }

  createMobileMenu() {
    // Create mobile menu structure
    const mobileMenu = document.createElement('div');
    mobileMenu.className = 'mobile-menu';
    mobileMenu.id = 'mobile-menu';
    mobileMenu.setAttribute('aria-hidden', 'true');
    mobileMenu.setAttribute('role', 'dialog');
    mobileMenu.setAttribute('aria-label', 'Menu de navigation mobile');

    mobileMenu.innerHTML = `
      <div class="mobile-menu-header">
        <span class="logo-placeholder">Celio</span>
        <button class="icon-btn" id="close-mobile-menu" aria-label="Fermer le menu">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>
      <div class="mobile-menu-content">
        <div class="mobile-search">
          <div class="pill-search" role="search">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="11" cy="11" r="8"></circle>
              <path d="m21 21-4.35-4.35"></path>
            </svg>
            <input type="search" placeholder="Rechercher un produit..." aria-label="Rechercher">
          </div>
        </div>
        <div class="mobile-menu-section">
          <h3>Catégories</h3>
          <ul class="mobile-menu-links">
            <li><a href="#one-piece">One Piece</a></li>
            <li><a href="#essentiels">Essentiels de la rentrée</a></li>
            <li><a href="#pokemon">Pokémon 151</a></li>
            <li><a href="#baggy">Baggy</a></li>
            <li><a href="#wwe">WWE</a></li>
            <li><a href="#mls">MLS</a></li>
            <li><a href="#t-shirts">T‑shirts</a></li>
            <li><a href="#pantalons">Pantalons</a></li>
            <li><a href="#jeans">Jeans</a></li>
            <li><a href="#shorts">Shorts</a></li>
            <li><a href="#chemises">Chemises</a></li>
          </ul>
        </div>
        <div class="mobile-menu-section">
          <h3>Mon Compte</h3>
          <ul class="mobile-menu-links">
            <li><a href="#connexion">Se connecter</a></li>
            <li><a href="#inscription">Créer un compte</a></li>
            <li><a href="#favoris">Mes favoris</a></li>
            <li><a href="#commandes">Mes commandes</a></li>
          </ul>
        </div>
        <div class="mobile-menu-section">
          <h3>Aide</h3>
          <ul class="mobile-menu-links">
            <li><a href="#contact">Nous contacter</a></li>
            <li><a href="#livraison">Livraison</a></li>
            <li><a href="#retours">Retours & échanges</a></li>
            <li><a href="#faq">FAQ</a></li>
          </ul>
        </div>
      </div>
    `;

    document.body.appendChild(mobileMenu);
  }

  bindEvents() {
    // Menu toggle button
    const menuButton = document.querySelector('.left .icon-btn');
    const mobileMenu = document.getElementById('mobile-menu');
    const closeButton = document.getElementById('close-mobile-menu');

    if (menuButton) {
      menuButton.addEventListener('click', (e) => {
        e.preventDefault();
        this.openMenu();
      });
    }

    if (closeButton) {
      closeButton.addEventListener('click', (e) => {
        e.preventDefault();
        this.closeMenu();
      });
    }

    // Close menu on escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && mobileMenu.classList.contains('active')) {
        this.closeMenu();
      }
    });

    // Close menu when clicking outside
    mobileMenu.addEventListener('click', (e) => {
      if (e.target === mobileMenu) {
        this.closeMenu();
      }
    });

    // Handle menu links
    const menuLinks = mobileMenu.querySelectorAll('.mobile-menu-links a');
    menuLinks.forEach(link => {
      link.addEventListener('click', () => {
        this.closeMenu();
      });
    });
  }

  openMenu() {
    const mobileMenu = document.getElementById('mobile-menu');
    const body = document.body;
    
    mobileMenu.classList.add('active');
    mobileMenu.setAttribute('aria-hidden', 'false');
    body.style.overflow = 'hidden';
    
    // Focus management
    const firstFocusable = mobileMenu.querySelector('button, input, a');
    if (firstFocusable) {
      firstFocusable.focus();
    }
  }

  closeMenu() {
    const mobileMenu = document.getElementById('mobile-menu');
    const body = document.body;
    
    mobileMenu.classList.remove('active');
    mobileMenu.setAttribute('aria-hidden', 'true');
    body.style.overflow = '';
    
    // Return focus to menu button
    const menuButton = document.querySelector('.left .icon-btn');
    if (menuButton) {
      menuButton.focus();
    }
  }

  handleResize() {
    window.addEventListener('resize', () => {
      if (window.innerWidth > 767) {
        this.closeMenu();
      }
    });
  }
}

// Enhanced form validation
class FormEnhancer {
  constructor() {
    this.init();
  }

  init() {
    this.enhanceNewsletterForm();
    this.enhanceSearchForms();
  }

  enhanceNewsletterForm() {
    const newsletterForm = document.querySelector('.newsletter form');
    if (!newsletterForm) return;

    const emailInput = newsletterForm.querySelector('input[type="email"]');
    const submitButton = newsletterForm.querySelector('button[type="submit"]');

    if (emailInput) {
      emailInput.setAttribute('required', '');
      emailInput.setAttribute('aria-describedby', 'email-error');
      
      // Create error message element
      const errorElement = document.createElement('div');
      errorElement.id = 'email-error';
      errorElement.className = 'error-message';
      errorElement.style.display = 'none';
      errorElement.setAttribute('role', 'alert');
      newsletterForm.appendChild(errorElement);

      // Real-time validation
      emailInput.addEventListener('blur', () => {
        this.validateEmail(emailInput, errorElement);
      });

      emailInput.addEventListener('input', () => {
        if (errorElement.style.display !== 'none') {
          this.validateEmail(emailInput, errorElement);
        }
      });
    }

    newsletterForm.addEventListener('submit', (e) => {
      e.preventDefault();
      
      if (emailInput && this.validateEmail(emailInput, document.getElementById('email-error'))) {
        this.handleNewsletterSubmission(emailInput, submitButton);
      }
    });
  }

  validateEmail(input, errorElement) {
    const email = input.value.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!email) {
      this.showError(input, errorElement, 'Veuillez saisir votre adresse email.');
      return false;
    }

    if (!emailRegex.test(email)) {
      this.showError(input, errorElement, 'Veuillez saisir une adresse email valide.');
      return false;
    }

    this.hideError(input, errorElement);
    return true;
  }

  showError(input, errorElement, message) {
    input.classList.add('error');
    input.setAttribute('aria-invalid', 'true');
    errorElement.textContent = message;
    errorElement.style.display = 'block';
  }

  hideError(input, errorElement) {
    input.classList.remove('error');
    input.setAttribute('aria-invalid', 'false');
    errorElement.style.display = 'none';
  }

  handleNewsletterSubmission(emailInput, submitButton) {
    const originalText = submitButton.textContent;
    
    // Show loading state
    submitButton.textContent = 'Inscription...';
    submitButton.disabled = true;
    submitButton.classList.add('loading');

    // Simulate API call
    setTimeout(() => {
      // Show success state
      submitButton.textContent = '✓ Inscrit';
      submitButton.classList.remove('loading');
      submitButton.classList.add('success');
      
      // Create success message
      const successElement = document.createElement('div');
      successElement.className = 'success-message';
      successElement.textContent = 'Merci ! Vous êtes maintenant inscrit à notre newsletter.';
      successElement.setAttribute('role', 'status');
      
      const form = emailInput.closest('form');
      form.appendChild(successElement);
      
      // Clear form
      emailInput.value = '';
      
      // Reset button after delay
      setTimeout(() => {
        submitButton.textContent = originalText;
        submitButton.disabled = false;
        submitButton.classList.remove('success');
        successElement.remove();
      }, 3000);
    }, 1500);
  }

  enhanceSearchForms() {
    const searchInputs = document.querySelectorAll('input[type="search"]');
    
    searchInputs.forEach(input => {
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          this.handleSearch(input.value.trim());
        }
      });
    });
  }

  handleSearch(query) {
    if (!query) return;
    
    // Simulate search functionality
    console.log('Recherche:', query);
    
    // In a real application, this would trigger actual search
    // For now, we'll just show a simple alert
    const searchResults = document.createElement('div');
    searchResults.className = 'success-message';
    searchResults.textContent = `Recherche pour "${query}" - Fonctionnalité à implémenter`;
    searchResults.style.position = 'fixed';
    searchResults.style.top = '20px';
    searchResults.style.right = '20px';
    searchResults.style.zIndex = '1000';
    
    document.body.appendChild(searchResults);
    
    setTimeout(() => {
      searchResults.remove();
    }, 3000);
  }
}

// Accessibility enhancements
class AccessibilityEnhancer {
  constructor() {
    this.init();
  }

  init() {
    this.enhanceKeyboardNavigation();
    this.addSkipLinks();
    this.improveAnnouncements();
  }

  enhanceKeyboardNavigation() {
    // Add keyboard navigation to carousel
    const carousel = document.querySelector('.carousel');
    const navButtons = document.querySelectorAll('.nav-btn');
    
    if (carousel) {
      carousel.setAttribute('role', 'region');
      carousel.setAttribute('aria-label', 'Carrousel de produits');
      
      navButtons.forEach((button, index) => {
        button.addEventListener('keydown', (e) => {
          if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
            e.preventDefault();
            const direction = e.key === 'ArrowLeft' ? -1 : 1;
            const nextButton = navButtons[index + direction];
            if (nextButton) {
              nextButton.focus();
            }
          }
        });
      });
    }

    // Enhance tab navigation
    const tabs = document.querySelectorAll('.tab');
    tabs.forEach((tab, index) => {
      tab.setAttribute('role', 'tab');
      tab.setAttribute('tabindex', index === 0 ? '0' : '-1');
      
      tab.addEventListener('keydown', (e) => {
        let newIndex = index;
        
        switch (e.key) {
          case 'ArrowLeft':
            newIndex = index > 0 ? index - 1 : tabs.length - 1;
            break;
          case 'ArrowRight':
            newIndex = index < tabs.length - 1 ? index + 1 : 0;
            break;
          case 'Home':
            newIndex = 0;
            break;
          case 'End':
            newIndex = tabs.length - 1;
            break;
          default:
            return;
        }
        
        e.preventDefault();
        tabs[index].setAttribute('tabindex', '-1');
        tabs[newIndex].setAttribute('tabindex', '0');
        tabs[newIndex].focus();
      });
    });
  }

  addSkipLinks() {
    const skipLink = document.createElement('a');
    skipLink.href = '#main-content';
    skipLink.textContent = 'Aller au contenu principal';
    skipLink.className = 'skip-link';
    skipLink.style.cssText = `
      position: absolute;
      top: -40px;
      left: 6px;
      background: var(--primary-black);
      color: white;
      padding: 8px;
      text-decoration: none;
      border-radius: 4px;
      z-index: 1000;
      transition: top 0.3s;
    `;
    
    skipLink.addEventListener('focus', () => {
      skipLink.style.top = '6px';
    });
    
    skipLink.addEventListener('blur', () => {
      skipLink.style.top = '-40px';
    });
    
    document.body.insertBefore(skipLink, document.body.firstChild);
    
    // Add main content ID
    const main = document.querySelector('main');
    if (main) {
      main.id = 'main-content';
      main.setAttribute('tabindex', '-1');
    }
  }

  improveAnnouncements() {
    // Create live region for dynamic content
    const liveRegion = document.createElement('div');
    liveRegion.setAttribute('aria-live', 'polite');
    liveRegion.setAttribute('aria-atomic', 'true');
    liveRegion.className = 'sr-only';
    liveRegion.style.cssText = `
      position: absolute;
      width: 1px;
      height: 1px;
      padding: 0;
      margin: -1px;
      overflow: hidden;
      clip: rect(0, 0, 0, 0);
      white-space: nowrap;
      border: 0;
    `;
    
    document.body.appendChild(liveRegion);
    
    // Store reference for other scripts to use
    window.announceToScreenReader = (message) => {
      liveRegion.textContent = message;
      setTimeout(() => {
        liveRegion.textContent = '';
      }, 1000);
    };
  }
}

// Initialize all enhancements when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  new MobileMenu();
  new FormEnhancer();
  new AccessibilityEnhancer();
  
  // Add loading complete announcement
  setTimeout(() => {
    if (window.announceToScreenReader) {
      window.announceToScreenReader('Page chargée');
    }
  }, 500);
});

// Handle page visibility changes
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    // Close mobile menu when page becomes hidden
    const mobileMenu = document.getElementById('mobile-menu');
    if (mobileMenu && mobileMenu.classList.contains('active')) {
      mobileMenu.classList.remove('active');
      document.body.style.overflow = '';
    }
  }
});