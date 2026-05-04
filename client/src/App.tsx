import React, { useState, useEffect } from 'react';
import { Route, Switch } from 'wouter';
import { Link } from 'wouter';
import Header from './components/Header';
import AdminLayout from './pages/AdminLayout';
import AdminDashboard from './pages/AdminDashboard';
import AdminInventory from './pages/AdminInventory';
import AdminCategories from './pages/AdminCategories';
import AdminCustomers from './pages/AdminCustomers';
import AdminOrders from './pages/AdminOrders';
import AdminSuppliers from './pages/AdminSuppliers';
import AdminSettings from './pages/AdminSettings';
import AdminDatabase from './pages/AdminDatabase';
import AdminNotifications from './pages/AdminNotifications';
import AdminImages from './pages/AdminImages';
import AdminMarketing from './pages/AdminMarketing';
import AdminDiscounts from './pages/AdminDiscounts';
import AdminPromotions from './pages/AdminPromotions';
import AdminEmailCampaigns from './pages/AdminEmailCampaigns';
import AdminReports from './pages/AdminReports';
import AdminLogin from './pages/AdminLogin';
import TeamLogin from './pages/TeamLogin';
import TeamDashboard from './pages/TeamDashboard';
import Catalog from './pages/Catalog';
import ProductDetail from './pages/ProductDetail';
import CategoryPage from './pages/CategoryPage';
import CollectionPage from './pages/CollectionPage';
import Lookbook from './pages/Lookbook';
import AdminLookbooks from './pages/AdminLookbooks';
import Stores from './pages/Stores';
import AdminStores from './pages/AdminStores';
import CustomerAuth from './pages/CustomerAuth';
import Privacy from './pages/Privacy';
import Contatti from './pages/Contatti';
import CelioFooter from './components/CelioFooter';

const NAV_CATEGORIES = [
  { label: 'Jeans', slug: 'jeans' },
  { label: 'Pantaloni', slug: 'pantaloni' },
  { label: 'Camicie', slug: 'camicie' },
  { label: 'Polo', slug: 'polo' },
  { label: 'T-Shirt', slug: 't-shirt' },
  { label: 'Maglioni & Felpe', slug: 'maglioni' },
  { label: 'Giacche', slug: 'giacche' },
  { label: 'Pantaloncini', slug: 'pantaloncini' },
  { label: 'Abiti', slug: 'abiti' },
  { label: 'Intimo', slug: 'intimo' },
  { label: 'Scarpe', slug: 'scarpe' },
  { label: 'Accessori', slug: 'accessori' },
];

const COLOR_HEX: Record<string, string> = {
  'noir': '#1a1a1a', 'blanc': '#f0f0f0', 'bleu': '#2563eb', 'rouge': '#dc2626',
  'gris': '#9ca3af', 'marine': '#1e3a5f', 'beige': '#d4b896', 'vert': '#16a34a',
  'marron': '#7c3f1e', 'kaki': '#78716c', 'ecru': '#f0ead6', 'anthracite': '#374151',
  'bordeaux': '#881337', 'camel': '#c19a6b', 'rose': '#f9a8d4', 'jaune': '#fde047',
  'orange': '#f97316', 'violet': '#7c3aed', 'denim': '#4a6fa5', 'corail': '#ff6b6b',
  'turquoise': '#06b6d4', 'stone': '#a8a29e', 'sable': '#c2b280', 'moka': '#6f4e37',
};

function getColorHex(colorName: string): string {
  const n = colorName.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  for (const [key, hex] of Object.entries(COLOR_HEX)) {
    if (n.includes(key)) return hex;
  }
  return '#d1d5db';
}

interface HomeProduct {
  id: number;
  name: string;
  price: string;
  mainImage?: string;
  colorImages?: Record<string, string[]>;
  isOnSale?: boolean;
  category: string;
}

const HomePage = () => {
  const [products, setProducts] = useState<HomeProduct[]>([]);

  useEffect(() => {
    fetch('/api/products?limit=8')
      .then(r => r.json())
      .then(data => setProducts(Array.isArray(data) ? data.slice(0, 8) : []))
      .catch(() => {});
  }, []);

  return (
    <div className="min-h-screen bg-white">
      <Header />

      {/* Hero — clean text banner */}
      <section className="bg-[#f5f3f0] py-14 px-4 text-center">
        <p className="text-xs tracking-widest uppercase text-gray-500 mb-3">Nuova collezione</p>
        <h1 className="text-4xl md:text-6xl font-bold text-gray-900 leading-tight mb-4">
          gli essenziali<br />
          <span className="font-light">della stagione</span>
        </h1>
        <a
          href="/catalog"
          className="inline-block mt-4 px-8 py-3 bg-gray-900 text-white text-sm font-medium rounded-full hover:bg-black transition-colors"
        >
          Scopri
        </a>
      </section>

      {/* Category pills row */}
      <nav className="border-b border-gray-100 bg-white">
        <div className="max-w-[1200px] mx-auto px-4 py-4 flex gap-2 overflow-x-auto no-scrollbar">
          {NAV_CATEGORIES.map(cat => (
            <a
              key={cat.slug}
              href={`/category/${cat.slug}`}
              className="flex-shrink-0 px-4 py-1.5 border border-gray-300 rounded-full text-sm text-gray-700 hover:border-gray-900 hover:text-gray-900 transition-colors whitespace-nowrap"
            >
              {cat.label}
            </a>
          ))}
        </div>
      </nav>

      <main className="max-w-[1200px] mx-auto px-4 py-10">

        {/* Novità */}
        <div className="flex items-baseline justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Novità</h2>
          <a href="/catalog" className="text-sm text-gray-500 hover:text-gray-900 underline underline-offset-2">
            Vedi tutto
          </a>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-8 mb-14">
          {products.map(product => (
            <Link key={product.id} href={`/products/${product.id}`} className="group block">
              <div className="relative aspect-[3/4] bg-gray-100 rounded-lg overflow-hidden mb-3">
                {product.mainImage ? (
                  <img
                    src={product.mainImage}
                    alt={product.name}
                    loading="lazy"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                    {product.category}
                  </div>
                )}
              </div>
              <div>
                {product.colorImages && Object.keys(product.colorImages).length > 0 && (
                  <div className="flex items-center gap-1 mb-1 flex-wrap">
                    {Object.keys(product.colorImages).slice(0, 5).map(color => (
                      <span
                        key={color}
                        title={color}
                        className="w-4 h-4 rounded-full border border-gray-300 flex-shrink-0 inline-block"
                        style={{ background: getColorHex(color) }}
                      />
                    ))}
                    {Object.keys(product.colorImages).length > 5 && (
                      <span className="text-[10px] text-gray-400">+{Object.keys(product.colorImages).length - 5}</span>
                    )}
                  </div>
                )}
                <h3 className="text-sm text-gray-900 leading-snug mb-1 line-clamp-2">{product.name}</h3>
              </div>
            </Link>
          ))}
        </div>

        {/* View all CTA */}
        <div className="text-center mb-16">
          <a
            href="/catalog"
            className="inline-block px-8 py-3 border border-gray-900 rounded-full text-sm font-medium text-gray-900 hover:bg-gray-900 hover:text-white transition-colors"
          >
            Vedi tutti i prodotti
          </a>
        </div>
      </main>

      <CelioFooter />
    </div>
  );
};


function App() {
  return (
    <Switch>
      <Route path="/" component={HomePage} />
      <Route path="/catalog" component={Catalog} />
      <Route path="/category/:categorySlug">
        {(params) => <CategoryPage categorySlug={params.categorySlug || ''} />}
      </Route>
      <Route path="/collezione" component={CollectionPage} />
      <Route path="/collection" component={CollectionPage} />
      <Route path="/novità" component={() => <CategoryPage categorySlug="novità" />} />
      <Route path="/baggy-party" component={() => <CategoryPage categorySlug="baggy-party" />} />
      <Route path="/one-piece" component={() => <CategoryPage categorySlug="one-piece" />} />
      <Route path="/collabs" component={() => <CategoryPage categorySlug="collabs" />} />
      <Route path="/lookbook" component={Lookbook} />
      <Route path="/negozi" component={Stores} />
      <Route path="/privacy" component={Privacy} />
      <Route path="/contatti" component={Contatti} />
      <Route path="/products/:id" component={ProductDetail} />
      <Route path="/account" component={CustomerAuth} />
      <Route path="/admin/login" component={AdminLogin} />
      <Route path="/team/login" component={TeamLogin} />
      <Route path="/team/dashboard" component={TeamDashboard} />
      <Route path="/admin" component={() => <AdminLayout><AdminDashboard /></AdminLayout>} />
      <Route path="/admin/inventory" component={() => <AdminLayout><AdminInventory /></AdminLayout>} />
      <Route path="/admin/categories" component={() => <AdminLayout><AdminCategories /></AdminLayout>} />
      <Route path="/admin/customers" component={() => <AdminLayout><AdminCustomers /></AdminLayout>} />
      <Route path="/admin/orders" component={() => <AdminLayout><AdminOrders /></AdminLayout>} />
      <Route path="/admin/suppliers" component={() => <AdminLayout><AdminSuppliers /></AdminLayout>} />
      <Route path="/admin/database" component={() => <AdminLayout><AdminDatabase /></AdminLayout>} />
      <Route path="/admin/notifications" component={() => <AdminLayout><AdminNotifications /></AdminLayout>} />
      <Route path="/admin/images" component={() => <AdminLayout><AdminImages /></AdminLayout>} />
      <Route path="/admin/marketing" component={() => <AdminLayout><AdminMarketing /></AdminLayout>} />
      <Route path="/admin/discounts" component={() => <AdminLayout><AdminDiscounts /></AdminLayout>} />
      <Route path="/admin/promotions" component={() => <AdminLayout><AdminPromotions /></AdminLayout>} />
      <Route path="/admin/email-campaigns" component={() => <AdminLayout><AdminEmailCampaigns /></AdminLayout>} />
      <Route path="/admin/reports" component={() => <AdminLayout><AdminReports /></AdminLayout>} />
      <Route path="/admin/lookbooks" component={() => <AdminLayout><AdminLookbooks /></AdminLayout>} />
      <Route path="/admin/stores" component={() => <AdminLayout><AdminStores /></AdminLayout>} />
      <Route path="/admin/settings" component={() => <AdminLayout><AdminSettings /></AdminLayout>} />
    </Switch>
  );
}

export default App;