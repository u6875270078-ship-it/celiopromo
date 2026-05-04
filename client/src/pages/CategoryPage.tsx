import { useState, useMemo } from 'react';
import { useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'wouter';
import Header from '@/components/Header';
import CelioFooter from '@/components/CelioFooter';

const COLOR_HEX: Record<string, string> = {
  'noir': '#1a1a1a', 'blanc': '#f0f0f0', 'bleu': '#2563eb', 'rouge': '#dc2626',
  'gris': '#9ca3af', 'marine': '#1e3a5f', 'beige': '#d4b896', 'vert': '#16a34a',
  'marron': '#7c3f1e', 'kaki': '#78716c', 'ecru': '#f0ead6', 'anthracite': '#374151',
  'bordeaux': '#881337', 'camel': '#c19a6b', 'rose': '#f9a8d4', 'jaune': '#fde047',
  'orange': '#f97316', 'violet': '#7c3aed', 'taupe': '#8b7d6b', 'ivoire': '#f8f4e8',
  'denim': '#4a6fa5', 'corail': '#ff6b6b', 'turquoise': '#06b6d4', 'lilas': '#c4b5fd',
  'stone': '#a8a29e', 'sable': '#c2b280', 'naturel': '#d4c4a8', 'moka': '#6f4e37',
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
      {extra > 0 && <span className="text-[10px] text-gray-400">+{extra}</span>}
    </div>
  );
}

interface Product {
  id: number;
  name: string;
  price: string;
  isOnSale?: boolean;
  mainImage?: string;
  category: string;
  subcategory?: string;
  colorImages?: Record<string, string[]>;
}

interface CategoryPageProps {
  categorySlug: string;
}

// Maps URL slug → display title
const categoryTitles: Record<string, string> = {
  'jeans': 'Jeans uomo',
  'pantaloni': 'Pantaloni uomo',
  'pantalons': 'Pantaloni uomo',
  'camicie': 'Camicie uomo',
  'chemises': 'Camicie uomo',
  'polo': 'Polo uomo',
  'polos': 'Polo uomo',
  'maglioni': 'Maglioni & Felpe uomo',
  'pulls': 'Maglioni & Felpe uomo',
  'giacche': 'Giacche uomo',
  'vestes': 'Giacche uomo',
  'shorts': 'Shorts uomo',
  'abiti': 'Abiti uomo',
  'costumes': 'Abiti uomo',
  'intimo': 'Intimo uomo',
  'sous-vetements': 'Intimo uomo',
  'accessori': 'Accessori uomo',
  'accessoires': 'Accessori uomo',
  'novità': 'Novità',
  'nouveautés': 'Novità',
  'baggy-party': 'Baggy Party',
  'one-piece': 'Collezione One Piece',
  'collabs': 'Collaborazioni',
};

const categoryDescriptions: Record<string, string> = {
  'jeans': 'Scopri la nostra collezione di jeans uomo: slim, dritti, baggy.',
  'pantaloni': 'Pantaloni chino, eleganti e casual per ogni occasione.',
  'pantalons': 'Pantaloni chino, eleganti e casual per ogni occasione.',
  'camicie': 'Camicie casual ed eleganti per un look curato.',
  'chemises': 'Camicie casual ed eleganti per un look curato.',
  'polo': 'Polo classiche e moderne per uno stile rilassato.',
  'polos': 'Polo classiche e moderne per uno stile rilassato.',
  'maglioni': 'Maglioni e felpe comode per le giornate fresche.',
  'pulls': 'Maglioni e felpe comode per le giornate fresche.',
  'giacche': 'Giacche leggere, blazer e giacche a vento per tutte le stagioni.',
  'vestes': 'Giacche leggere, blazer e giacche a vento per tutte le stagioni.',
  'shorts': 'Shorts e bermuda per l\'estate e le attività all\'aperto.',
  'abiti': 'Abiti e completi per le occasioni speciali.',
  'costumes': 'Abiti e completi per le occasioni speciali.',
  'intimo': 'Intimo comodo e resistente per tutti i giorni.',
  'sous-vetements': 'Intimo comodo e resistente per tutti i giorni.',
  'accessori': 'Accessori per completare il tuo stile: cinture, cappelli, sciarpe.',
  'accessoires': 'Accessori per completare il tuo stile: cinture, cappelli, sciarpe.',
  'novità': 'Tutte le nostre ultime novità e collezioni.',
  'nouveautés': 'Tutte le nostre ultime novità e collezioni.',
  'baggy-party': 'Tagli larghi e silhouette decontracté: la nostra selezione baggy.',
  'one-piece': 'La collezione ufficiale ispirata a One Piece.',
  'collabs': 'Le nostre collaborazioni esclusive.',
};

const SORT_OPTIONS = [
  { label: 'Rilevanza', value: 'default' },
  { label: 'Nome A→Z', value: 'name_asc' },
];

export default function CategoryPage({ categorySlug }: CategoryPageProps) {
  const [, setLocation] = useLocation();
  const [sortBy, setSortBy] = useState('default');
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 48;

  const { data: products = [], isLoading } = useQuery<Product[]>({
    queryKey: ['/api/products/category', categorySlug],
    queryFn: async () => {
      const response = await fetch(`/api/products/category/${categorySlug}`);
      if (!response.ok) throw new Error('Failed to fetch products');
      return response.json();
    },
  });

  const sorted = useMemo(() => {
    const list = [...products];
    switch (sortBy) {
      case 'name_asc': list.sort((a, b) => a.name.localeCompare(b.name)); break;
    }
    return list;
  }, [products, sortBy]);

  const totalPages = Math.ceil(sorted.length / PAGE_SIZE);
  const paginated = sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const title = categoryTitles[categorySlug] || categorySlug;
  const description = categoryDescriptions[categorySlug] || '';

  return (
    <div className="min-h-screen bg-white">
      <Header />

      <main className="max-w-[1200px] mx-auto px-4 py-6">
        {/* Breadcrumb */}
        <nav className="text-xs text-gray-500 mb-4">
          <span className="hover:text-gray-700 cursor-pointer" onClick={() => setLocation('/')}>
            Home
          </span>
          <span className="mx-2">/</span>
          <span className="text-gray-900">{title}</span>
        </nav>

        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-gray-900 mb-1">
            {title}
            {!isLoading && (
              <span className="text-base font-normal text-gray-500 ml-3">
                {sorted.length} articol{sorted.length !== 1 ? 'i' : 'o'}
              </span>
            )}
          </h1>
          {description && <p className="text-sm text-gray-500">{description}</p>}
        </div>

        {/* Sort bar */}
        <div className="flex items-center justify-end gap-3 mb-6">
          <select
            value={sortBy}
            onChange={e => { setSortBy(e.target.value); setPage(1); }}
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
            {Array.from({ length: 8 }).map((_, i) => (
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
                    <ColorDots colorImages={product.colorImages} />
                  )}
                  <h3 className="text-sm text-gray-900 leading-snug mb-1 line-clamp-2">{product.name}</h3>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Empty state */}
        {!isLoading && sorted.length === 0 && (
          <div className="text-center py-20 text-gray-500">
            <p className="text-lg">Nessun prodotto in questa categoria.</p>
            <button className="mt-4 text-sm underline" onClick={() => setLocation('/catalog')}>
              Vedi tutti i prodotti
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