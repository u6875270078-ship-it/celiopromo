import React, { useState, useEffect } from 'react';
import { Menu, Search, User, LogOut } from 'lucide-react';

const Header: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [currentPromoIndex, setCurrentPromoIndex] = useState(0);

  const promoBanners = [
    {
      text: 'Novità: scopri la nostra selezione per la stagione',
      textMobile: 'Nuova collezione',
      link: '/novità',
      bgColor: 'bg-black'
    },
    {
      text: 'Essenziali per la stagione • Nuova collezione disponibile ora',
      textMobile: 'Nuova collezione',
      link: '/novità',
      bgColor: 'bg-gray-900'
    },
    {
      text: 'Baggy Party Collection • Stile urban per il tuo look',
      textMobile: 'Baggy Party Collection',
      link: '/baggy-party',
      bgColor: 'bg-blue-900'
    },
    {
      text: 'Collaborazione WWE • Edizione limitata disponibile',
      textMobile: 'Collaborazione WWE',
      link: '/novità',
      bgColor: 'bg-red-900'
    }
  ];

  const categories = [
    { label: 'Jeans', href: '/category/jeans' },
    { label: 'Pantaloni', href: '/category/pantaloni' },
    { label: 'Camicie', href: '/category/camicie' },
    { label: 'Polo', href: '/category/polo' },
    { label: 'Maglioni & Felpe', href: '/category/maglioni' },
    { label: 'Giacche', href: '/category/giacche' },
    { label: 'Shorts', href: '/category/shorts' },
    { label: 'Abiti', href: '/category/abiti' },
    { label: 'Intimo', href: '/category/intimo' },
    { label: 'Accessori', href: '/category/accessori' },
    { label: 'Lookbook', href: '/lookbook' },
    { label: 'I Nostri Negozi', href: '/negozi' },
  ];

  // Auto-rotate promotional banners
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentPromoIndex((prevIndex) =>
        (prevIndex + 1) % promoBanners.length
      );
    }, 4000);

    return () => clearInterval(interval);
  }, [promoBanners.length]);

  return (
    <header className="bg-white border-b border-gray-100 sticky top-0 z-50">
      {/* Animated Promotional Top Bar */}
      <div className={`${promoBanners[currentPromoIndex].bgColor} text-white relative transition-all duration-500`}>
        <a
          href={promoBanners[currentPromoIndex].link}
          className="block text-center py-1 sm:py-2 overflow-hidden hover:opacity-90"
        >
          <div className="animate-scroll whitespace-nowrap">
            <p className="text-xs sm:text-sm inline-block px-4">
              <span className="hidden sm:inline">{promoBanners[currentPromoIndex].text}</span>
              <span className="sm:hidden">{promoBanners[currentPromoIndex].textMobile}</span>
            </p>
          </div>
        </a>

        {/* Progress indicators */}
        <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 flex space-x-1 pb-0.5">
          {promoBanners.map((_, index) => (
            <div
              key={index}
              className={`w-1 h-0.5 transition-all duration-300 ${
                index === currentPromoIndex ? 'bg-white' : 'bg-white bg-opacity-30'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Main Header */}
      <div className="max-w-6xl mx-auto px-2 sm:px-4">
        <div className="flex items-center justify-between h-14 sm:h-16">
          {/* Left Section - Menu */}
          <div className="flex items-center space-x-2 min-w-0">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 hover:bg-gray-100 rounded-lg"
              aria-label="Menu"
              data-testid="button-menu"
            >
              <Menu size={20} />
            </button>
          </div>

          {/* Center - Logo/Brand */}
          <div className="flex-1 text-center min-w-0">
            <a href="/" className="text-xl sm:text-2xl font-bold text-gray-900 hover:text-gray-700 whitespace-nowrap">
              celio
            </a>
          </div>

          {/* Right Section - Search + Account */}
          <div className="flex items-center space-x-1 min-w-0">
            <a href="/catalog" className="p-2 hover:bg-gray-100 rounded-lg" aria-label="Cerca" data-testid="button-search">
              <Search size={20} />
            </a>
            {(() => {
              const auth = typeof window !== 'undefined' ? localStorage.getItem('customerAuth') : null;
              const user = auth ? JSON.parse(auth) : null;
              if (user) {
                return (
                  <div className="flex items-center gap-1">
                    <a href="/account" className="p-2 hover:bg-gray-100 rounded-lg flex items-center gap-1" title={user.firstName || user.email}>
                      {user.profilePhoto ? (
                        <img src={user.profilePhoto} alt="" className="w-6 h-6 rounded-full object-cover" />
                      ) : (
                        <User size={20} />
                      )}
                    </a>
                    <button
                      onClick={() => { localStorage.removeItem('customerAuth'); window.location.reload(); }}
                      className="p-2 hover:bg-gray-100 rounded-lg text-gray-500"
                      title="Esci"
                    >
                      <LogOut size={16} />
                    </button>
                  </div>
                );
              }
              return (
                <a href="/account" className="p-2 hover:bg-gray-100 rounded-lg" aria-label="Account">
                  <User size={20} />
                </a>
              );
            })()}
          </div>
        </div>

        {/* Search Bar */}
        <div className="pb-3">
          <div className="max-w-md mx-auto relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="search"
              placeholder="Cerca un prodotto, una categoria o una collab…"
              className="w-full pl-10 pr-4 py-3 bg-gray-50 border-0 rounded-full focus:outline-none focus:ring-2 focus:ring-gray-300 focus:bg-white transition-all text-sm"
              autoComplete="off"
              data-testid="input-header-search"
            />
          </div>
        </div>

      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="bg-white border-t border-gray-100 shadow-lg">
          <div className="px-4 py-2">
            {categories.map((cat, index) => (
              <a
                key={index}
                href={cat.href}
                className="block py-3 text-sm font-medium text-gray-700 hover:text-black border-b border-gray-100 last:border-b-0"
                onClick={() => setMobileMenuOpen(false)}
                data-testid={`mobile-nav-${cat.label.toLowerCase().replace(/\s+/g, '-')}`}
              >
                {cat.label}
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Navigation Categories - Desktop */}
      <nav className="hidden md:block bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex items-center justify-center space-x-8 py-3 overflow-x-auto">
            {categories.map((cat, index) => (
              <a
                key={index}
                href={cat.href}
                className="text-sm font-medium text-gray-700 hover:text-black whitespace-nowrap py-2 border-b-2 border-transparent hover:border-gray-900 transition-colors"
                data-testid={`nav-category-${cat.label.toLowerCase().replace(/\s+/g, '-')}`}
              >
                {cat.label}
              </a>
            ))}
          </div>
        </div>
      </nav>
    </header>
  );
};

export default Header;