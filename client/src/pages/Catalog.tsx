import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'wouter';
import Header from '@/components/Header';
import CelioFooter from '@/components/CelioFooter';

interface Product {
  id: number;
  sku: string;
  name: string;
  category: string;
  price: string;
  mainImage?: string;
  colorImages?: Record<string, string[]>;
  isOnSale: boolean;
  isFeatured: boolean;
}

const CATEGORY_TABS = [
  { label: 'Tous', value: '' },
  { label: 'Jeans', value: 'Jeans' },
  { label: 'Pantalons', value: 'Pantalons' },
  { label: 'Chemises', value: 'Chemises' },
  { label: 'Polos', value: 'Polos' },
  { label: 'T-Shirts', value: 'T-Shirts' },
  { label: 'Pulls & Sweat', value: 'Pulls & Sweat' },
  { label: 'Vestes', value: 'Vestes' },
  { label: 'Shorts', value: 'Shorts' },
  { label: 'Costumes', value: 'Costumes' },
  { label: 'Sous-vêtements', value: 'Sous-vêtements' },
  { label: 'Chaussures', value: 'Chaussures' },
  { label: 'Accessoires', value: 'Accessoires' },
];

const SORT_OPTIONS = [
  { label: 'Rilevanza', value: 'default' },
  { label: 'Nome A→Z', value: 'name_asc' },
];

export default function Catalog() {
  const [activeCategory, setActiveCategory] = useState('');
  const [sortBy, setSortBy] = useState('default');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 48;

  const { data: products = [], isLoading } = useQuery<Product[]>({
    queryKey: ['/api/products', { limit: 1000 }],
    queryFn: () => fetch('/api/products?limit=1000').then(r => r.json()),
    staleTime: 5 * 60 * 1000,
  });

  const filtered = useMemo(() => {
    let list = [...products];

    if (activeCategory) {
      const cat = activeCategory.toLowerCase();
      list = list.filter(p => p.category?.toLowerCase() === cat);
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(p =>
        p.name?.toLowerCase().includes(q) ||
        p.category?.toLowerCase().includes(q)
      );
    }

    switch (sortBy) {
      case 'name_asc':
        list.sort((a, b) => a.name.localeCompare(b.name));
        break;
    }

    return list;
  }, [products, activeCategory, sortBy, search]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleCategoryChange = (cat: string) => {
    setActiveCategory(cat);
    setPage(1);
  };

  return (
    <div className="min-h-screen bg-white">
      <Header />

      <main className="max-w-[1200px] mx-auto px-4 py-6">
        {/* Page title */}
        <h1 className="text-2xl font-semibold text-gray-900 mb-6">
          Tutti i prodotti
          {!isLoading && (
            <span className="text-base font-normal text-gray-500 ml-3">
              {filtered.length} articol{filtered.length !== 1 ? 'i' : 'o'}
            </span>
          )}
        </h1>

        {/* Category tabs */}
        <div className="flex gap-2 overflow-x-auto pb-3 mb-6 no-scrollbar">
          {CATEGORY_TABS.map(tab => (
            <button
              key={tab.value}
              onClick={() => handleCategoryChange(tab.value)}
              className={`flex-shrink-0 px-4 py-1.5 rounded-full text-sm border transition-colors ${
                activeCategory === tab.value
                  ? 'bg-black text-white border-black'
                  : 'bg-white text-gray-700 border-gray-300 hover:border-gray-500'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Sort + search bar */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <input
            type="search"
            placeholder="Cerca un prodotto…"
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            className="flex-1 border border-gray-200 rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-300"
          />
          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value)}
            className="border border-gray-200 rounded-full px-4 py-2 text-sm focus:outline-none"
          >
            {SORT_OPTIONS.map(o => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>

        {/* Loading skeleton */}
        {isLoading && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="bg-gray-200 rounded-lg aspect-[3/4] mb-3" />
                <div className="bg-gray-200 h-4 rounded mb-2 w-3/4" />
                <div className="bg-gray-200 h-4 rounded w-1/3" />
              </div>
            ))}
          </div>
        )}

        {/* Products grid */}
        {!isLoading && paginated.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-8">
            {paginated.map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}

        {/* Empty state */}
        {!isLoading && filtered.length === 0 && (
          <div className="text-center py-20 text-gray-500">
            <p className="text-lg">Nessun prodotto trovato.</p>
            <button
              className="mt-4 text-sm underline"
              onClick={() => { setActiveCategory(''); setSearch(''); }}
            >
              Reimposta i filtri
            </button>
          </div>
        )}

        {/* Pagination */}
        {!isLoading && totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-12">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-4 py-2 border border-gray-300 rounded-full text-sm disabled:opacity-40 hover:bg-gray-50"
            >
              ←
            </button>
            {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
              const p = totalPages <= 7 ? i + 1 : Math.max(1, page - 3) + i;
              if (p > totalPages) return null;
              return (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`w-9 h-9 rounded-full text-sm ${
                    page === p ? 'bg-black text-white' : 'border border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {p}
                </button>
              );
            })}
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-4 py-2 border border-gray-300 rounded-full text-sm disabled:opacity-40 hover:bg-gray-50"
            >
              →
            </button>
          </div>
        )}
      </main>

      <CelioFooter />
    </div>
  );
}

const COLOR_HEX: Record<string, string> = {
  'noir': '#1a1a1a',
  'blanc': '#f0f0f0',
  'bleu': '#2563eb',
  'rouge': '#dc2626',
  'gris': '#9ca3af',
  'marine': '#1e3a5f',
  'beige': '#d4b896',
  'vert': '#16a34a',
  'marron': '#7c3f1e',
  'kaki': '#78716c',
  'ecru': '#f0ead6',
  'anthracite': '#374151',
  'bordeaux': '#881337',
  'camel': '#c19a6b',
  'rose': '#f9a8d4',
  'jaune': '#fde047',
  'orange': '#f97316',
  'violet': '#7c3aed',
  'taupe': '#8b7d6b',
  'ivoire': '#f8f4e8',
  'denim': '#4a6fa5',
  'corail': '#ff6b6b',
  'turquoise': '#06b6d4',
  'lilas': '#c4b5fd',
  'stone': '#a8a29e',
  'sable': '#c2b280',
  'naturel': '#d4c4a8',
  'creme': '#f5f0dc',
  'moka': '#6f4e37',
  'safran': '#f4a416',
  'multicolore': 'conic-gradient(red, yellow, lime, aqua, blue, magenta, red)',
};

function getColorHex(colorName: string): string {
  const n = colorName.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  for (const [key, hex] of Object.entries(COLOR_HEX)) {
    if (n.includes(key)) return hex;
  }
  return '#d1d5db';
}

function ColorDots({ colorImages }: { colorImages: Record<string, string[]> }) {
  const colors = Object.keys(colorImages);
  const MAX = 5;
  const shown = colors.slice(0, MAX);
  const extra = colors.length - MAX;
  return (
    <div className="flex items-center gap-1 mb-1 flex-wrap">
      {shown.map(color => (
        <span
          key={color}
          title={color}
          className="w-4 h-4 rounded-full border border-gray-300 flex-shrink-0 inline-block"
          style={{ background: getColorHex(color) }}
        />
      ))}
      {extra > 0 && (
        <span className="text-[10px] text-gray-400">+{extra}</span>
      )}
    </div>
  );
}

function ProductCard({ product }: { product: Product }) {
  const colorImages = product.colorImages && Object.keys(product.colorImages).length > 0
    ? product.colorImages
    : null;

  return (
    <Link href={`/products/${product.id}`} className="group block">
      {/* Image */}
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

      {/* Info */}
      <div>
        {colorImages && <ColorDots colorImages={colorImages} />}
        <h3 className="text-sm text-gray-900 leading-snug mb-1 line-clamp-2">
          {product.name}
        </h3>
      </div>
    </Link>
  );
}
