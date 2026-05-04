import { useState, useEffect, useMemo } from 'react';
import { useParams, useLocation, Link } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import Header from '@/components/Header';
import CelioFooter from '@/components/CelioFooter';
import VirtualTryOn from '@/components/VirtualTryOn';
import { ChevronLeft, Heart, Truck, Store, Sparkles } from 'lucide-react';

interface ProductVariant {
  id?: string;
  sku?: string;
  size: string;
  color: string | null;
  quantity: number;
  price?: string;
}

interface Product {
  id: number;
  sku: string;
  name: string;
  description?: string;
  category: string;
  subcategory?: string;
  price: string;
  salePrice?: string;
  stock: number;
  isActive: boolean;
  isSoldOut: boolean;
  isOnSale: boolean;
  isFeatured: boolean;
  mainImage?: string;
  images?: string[];
  colorImages?: Record<string, string[]>;
  variants?: ProductVariant[];
  material?: string;
  rating?: number;
  reviewCount?: number;
}

export default function ProductDetail() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const [selectedColor, setSelectedColor] = useState<string>('');
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [showTryOn, setShowTryOn] = useState(false);

  const { data: product, isLoading, error } = useQuery<Product>({
    queryKey: ['/api/products', id],
    queryFn: () => fetch(`/api/products/${id}`).then(r => {
      if (!r.ok) throw new Error('Product not found');
      return r.json();
    }),
    enabled: !!id,
  });

  const { data: similarProducts = [] } = useQuery<Product[]>({
    queryKey: ['/api/products/similar', product?.category],
    queryFn: () => fetch('/api/products?limit=8').then(r => r.json()).then((all: Product[]) =>
      all.filter(p => p.id !== product?.id && p.mainImage).slice(0, 4)
    ),
    enabled: !!product,
  });

  // Colors: from variants or colorImages
  const availableColors = useMemo<string[]>(() => {
    if (!product) return [];
    if (product.variants && product.variants.length > 0) {
      const cols = Array.from(new Set(
        product.variants
          .filter(v => v.color && v.quantity > 0)
          .map(v => v.color as string)
      ));
      if (cols.length > 0) return cols;
    }
    if (product.colorImages && Object.keys(product.colorImages).length > 0) {
      return Object.keys(product.colorImages);
    }
    return [];
  }, [product]);

  // Sizes: from variants
  const availableSizes = useMemo<string[]>(() => {
    if (!product?.variants || product.variants.length === 0) return [];
    const sizesForColor = selectedColor
      ? product.variants.filter(v => v.color === selectedColor && v.quantity > 0).map(v => v.size)
      : product.variants.filter(v => v.quantity > 0).map(v => v.size);
    const unique = Array.from(new Set(sizesForColor.length > 0 ? sizesForColor : product.variants.map(v => v.size)));
    const order = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL'];
    return unique.sort((a, b) => {
      const ia = order.indexOf(a), ib = order.indexOf(b);
      if (ia >= 0 && ib >= 0) return ia - ib;
      return a.localeCompare(b);
    });
  }, [product, selectedColor]);

  // Images
  const productImages = useMemo<string[]>(() => {
    if (!product) return [];
    const seen = new Set<string>();
    const add = (url: string | undefined | null) => {
      if (url && !seen.has(url)) { seen.add(url); }
    };

    if (selectedColor && product.colorImages?.[selectedColor]) {
      product.colorImages[selectedColor].forEach(add);
    }

    if (product.mainImage) add(product.mainImage);
    if (Array.isArray(product.images)) product.images.forEach(add);

    return Array.from(seen);
  }, [product, selectedColor]);

  const currentImage = productImages[activeImageIndex] || product?.mainImage || '';

  const hasColors = availableColors.length > 0;

  // Set defaults when product loads
  useEffect(() => {
    if (product) {
      if (availableColors.length > 0 && !selectedColor) setSelectedColor(availableColors[0]);
      if (availableSizes.length > 0 && !selectedSize) setSelectedSize(availableSizes[0]);
    }
  }, [product, availableColors, availableSizes]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white">
        <Header />
        <div className="max-w-[1200px] mx-auto px-4 py-8 animate-pulse">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <div className="aspect-[3/4] bg-gray-200 rounded-lg" />
            <div className="space-y-4 pt-4">
              <div className="h-6 bg-gray-200 rounded w-1/2" />
              <div className="h-8 bg-gray-200 rounded w-3/4" />
              <div className="h-6 bg-gray-200 rounded w-1/4" />
              <div className="h-32 bg-gray-200 rounded mt-4" />
            </div>
          </div>
        </div>
        <CelioFooter />
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-white">
        <Header />
        <div className="max-w-4xl mx-auto px-4 py-16 text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Prodotto non trovato</h1>
          <button
            onClick={() => setLocation('/catalog')}
            className="mt-2 px-6 py-2 bg-black text-white rounded-full text-sm"
          >
            Torna al catalogo
          </button>
        </div>
        <CelioFooter />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <Header />

      <main className="max-w-[1200px] mx-auto px-4 py-6">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-xs text-gray-500 mb-6">
          <button onClick={() => setLocation('/')} className="hover:text-gray-700">Home</button>
          <span>/</span>
          <Link href={`/category/${categoryToSlug(product.category)}`} className="hover:text-gray-700">{product.category}</Link>
          <span>/</span>
          <span className="text-gray-900 line-clamp-1">{product.name}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 xl:gap-16">

          {/* Left: Images */}
          <div>
            <div className="aspect-[3/4] bg-gray-100 rounded-xl overflow-hidden mb-3">
              {currentImage ? (
                <img
                  key={currentImage}
                  src={currentImage}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400">
                  {product.category}
                </div>
              )}
            </div>

            {productImages.length > 1 && (
              <div className="flex gap-2 overflow-x-auto no-scrollbar">
                {productImages.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveImageIndex(i)}
                    className={`flex-shrink-0 w-16 h-20 rounded-lg overflow-hidden border-2 transition-colors ${
                      activeImageIndex === i ? 'border-black' : 'border-gray-200 hover:border-gray-400'
                    }`}
                  >
                    <img src={img} alt={`vista ${i + 1}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right: Info */}
          <div className="space-y-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-widest mb-1">
                  {product.subcategory || product.category}
                </p>
                <h1 className="text-xl font-semibold text-gray-900 leading-snug">
                  {product.name}
                </h1>
              </div>
              <button className="p-2 rounded-full hover:bg-gray-100 flex-shrink-0" aria-label="Aggiungi ai preferiti">
                <Heart size={20} />
              </button>
            </div>

            <hr className="border-gray-100" />

            {/* Colors */}
            {hasColors && (
              <div>
                <p className="text-sm font-medium text-gray-900 mb-2">
                  Colore: <span className="font-normal text-gray-600">{selectedColor}</span>
                </p>
                <div className="flex gap-2 flex-wrap">
                  {availableColors.map(color => (
                    <button
                      key={color}
                      onClick={() => { setSelectedColor(color); setActiveImageIndex(0); }}
                      title={color}
                      className={`w-8 h-8 rounded-full border-2 transition-all ${
                        selectedColor === color
                          ? 'border-black scale-110'
                          : 'border-gray-300 hover:border-gray-500'
                      }`}
                      style={{ backgroundColor: colorHex(color) }}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Sizes */}
            {availableSizes.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium text-gray-900">Taglia</p>
                  <button className="text-xs text-gray-500 underline">Guida alle taglie</button>
                </div>
                <div className="flex gap-2 flex-wrap">
                  {availableSizes.map(size => {
                    const inStock = !product.variants ||
                      product.variants.some(v => v.size === size && (v.color === selectedColor || !v.color) && v.quantity > 0);
                    const isSelected = selectedSize === size;
                    return (
                      <button
                        key={size}
                        onClick={() => inStock && setSelectedSize(size)}
                        disabled={!inStock}
                        className={`min-w-[48px] h-10 px-3 text-sm border rounded transition-all ${
                          isSelected
                            ? 'border-black bg-black text-white'
                            : inStock
                              ? 'border-gray-300 hover:border-gray-700 text-gray-900'
                              : 'border-gray-200 text-gray-300 cursor-not-allowed line-through'
                        }`}
                      >
                        {size}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Find in store CTA */}
            <div className="space-y-3 pt-2">
              <button className="w-full flex items-center justify-center gap-2 py-3.5 rounded-full text-sm font-semibold border border-gray-300 hover:border-gray-700 transition-all">
                <Store size={18} />
                Verifica disponibilità in negozio
              </button>
              <button
                onClick={() => setShowTryOn(true)}
                className="w-full flex items-center justify-center gap-2 py-3.5 rounded-full text-sm font-semibold bg-gradient-to-r from-purple-600 to-indigo-600 text-white hover:from-purple-700 hover:to-indigo-700 transition-all shadow-md"
              >
                <Sparkles size={18} />
                Prova Virtuale AI
              </button>
            </div>

            {/* Services */}
            <div className="space-y-2 border-t pt-4">
              <div className="flex items-center gap-3 text-sm text-gray-600">
                <Truck size={16} className="flex-shrink-0" />
                <span>Disponibile nei nostri negozi</span>
              </div>
            </div>

            {/* Description */}
            {product.description && (
              <details className="border-t pt-4 group">
                <summary className="text-sm font-medium text-gray-900 cursor-pointer list-none flex items-center justify-between">
                  Descrizione
                  <span className="text-gray-500 group-open:rotate-180 transition-transform">▾</span>
                </summary>
                <p className="mt-3 text-sm text-gray-600 leading-relaxed">{product.description}</p>
              </details>
            )}

            {product.material && (
              <details className="border-t pt-4 group">
                <summary className="text-sm font-medium text-gray-900 cursor-pointer list-none flex items-center justify-between">
                  Composizione e cura
                  <span className="text-gray-500 group-open:rotate-180 transition-transform">▾</span>
                </summary>
                <div className="mt-3 text-sm text-gray-600 space-y-1">
                  <p><strong>Composizione:</strong> {product.material}</p>
                  <p><strong>Cura:</strong> Lavaggio in lavatrice a 30°C · Non usare asciugatrice · Ferro a bassa temperatura</p>
                </div>
              </details>
            )}
          </div>
        </div>

        {/* Similar products */}
        {similarProducts.length > 0 && (
          <section className="mt-16 border-t pt-10">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">Potrebbe piacerti anche</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {similarProducts.map(p => (
                <Link key={p.id} href={`/products/${p.id}`} className="group block">
                  <div className="aspect-[3/4] bg-gray-100 rounded-lg overflow-hidden mb-2">
                    {p.mainImage && (
                      <img
                        src={p.mainImage}
                        alt={p.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    )}
                  </div>
                  <h3 className="text-sm text-gray-900 line-clamp-2 leading-snug mb-1">{p.name}</h3>
                </Link>
              ))}
            </div>
          </section>
        )}
      </main>

      <CelioFooter />

      {/* Virtual Try-On Modal */}
      {product && (
        <VirtualTryOn
          isOpen={showTryOn}
          onClose={() => setShowTryOn(false)}
          productImage={product.mainImage || (product.images && product.images[0]) || ''}
          productName={product.name}
          productCategory={product.category}
          productId={product.id}
        />
      )}
    </div>
  );
}

function categoryToSlug(category: string): string {
  const map: Record<string, string> = {
    'Maglioni & Felpe': 'maglioni',
    'Intimo': 'intimo',
  };
  return map[category] ?? category.toLowerCase();
}

function colorHex(name: string): string {
  const map: Record<string, string> = {
    nero: '#111111', noir: '#111111', black: '#111111',
    bianco: '#f8f8f8', blanc: '#f8f8f8', white: '#f8f8f8',
    blu: '#1e3a8a', marine: '#1e3a8a', navy: '#1e3a8a',
    azzurro: '#2563eb', bleu: '#2563eb', blue: '#2563eb',
    grigio: '#6b7280', gris: '#6b7280', grey: '#6b7280', gray: '#6b7280',
    rosso: '#dc2626', rouge: '#dc2626', red: '#dc2626',
    verde: '#16a34a', vert: '#16a34a', green: '#16a34a',
    giallo: '#facc15', jaune: '#facc15', yellow: '#facc15',
    arancione: '#f97316', orange: '#f97316',
    rosa: '#fb7185', rose: '#fb7185', pink: '#fb7185',
    viola: '#7c3aed', violet: '#7c3aed', purple: '#7c3aed',
    marrone: '#92400e', marron: '#92400e', brown: '#92400e',
    beige: '#d6b896',
    cammello: '#c19a6b', camel: '#c19a6b',
    kaki: '#78716c', khaki: '#78716c',
    bordeaux: '#7f1d1d',
  };
  return map[name.toLowerCase()] ?? '#cccccc';
}
