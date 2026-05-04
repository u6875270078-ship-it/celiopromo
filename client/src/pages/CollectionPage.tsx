import { useState } from 'react';
import { useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import type { Category } from '@shared/schema';
import Header from '@/components/Header';
import CelioFooter from '@/components/CelioFooter';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { ChevronRight, Grid2X2, List, Star } from 'lucide-react';

interface CollectionSection {
  id: string;
  title: string;
  items: string[];
  isSpecial?: boolean;
  promotion?: string;
}

const collectionSections: CollectionSection[] = [
  {
    id: 'hauts',
    title: 'Maglie',
    items: [
      'T-shirt',
      'Camicie', 
      'Camicie a maniche corte',
      'Polo',
      'Canottiere',
      'Gilet e cardigan',
      'Felpe',
      'Maglioni'
    ]
  },
  {
    id: 'vestes-blousons',
    title: 'Giacche e giubbotti',
    items: [
      'Giacche',
      'Giubbotti', 
      'Parka',
      'Cappotti',
      'Piumini',
      'Completi'
    ]
  },
  {
    id: 'bas',
    title: 'Pantaloni',
    items: [
      'Jeans',
      'Pantaloni',
      'Pantaloni in lino',
      'Pantaloni chino', 
      'Pantaloni 24h',
      'Short e bermuda'
    ]
  },
  {
    id: 'jeans',
    title: 'Jeans',
    items: [
      'Jeans 3 lunghezze',
      'C.5 | Jeans Regular',
      'C.15 | Jeans Straight',
      'C.25 | Jeans Slim',
      'C.35 | Jeans Straight Maglia',
      'C.95 | Jeans Loose',
      'Guida denim'
    ]
  },
  {
    id: 'costumes',
    title: 'Abiti',
    items: [
      'Tutti gli abiti',
      'Giacche da abito',
      'Pantaloni da abito',
      'Camicie eleganti'
    ]
  },
  {
    id: 'sous-vetements',
    title: 'Intimo',
    items: [
      'Mutande',
      'Boxer',
      'Calze',
      'Pigiami',
      'Abbigliamento sportivo'
    ]
  },
  {
    id: 'accessoires',
    title: 'Accessori',
    items: [
      'Cappellini',
      'Costumi da bagno',
      'Cinture',
      'Borse',
      'Cravatte',
      'Papillon',
      'Scarpe',
      'Sciarpe',
      'Guida alle taglie'
    ]
  },
  {
    id: 'offres',
    title: 'Le Offerte',
    items: [
      'Set 3 t-shirt',
      'Set 3 boxer',
      'Set calzini'
    ],
    isSpecial: true
  },
  {
    id: 'en-ce-moment',
    title: 'In questo momento',
    items: [
      'Baggy party',
      'Gli Essenziali del rientro',
      'I Completi',
      'Selezione lino',
      'Cerimonia',
      'Le Novità',
      'I Più Venduti',
      'Gli Essenziali',
      'La Selezione 3XL'
    ],
    isSpecial: true
  },
  {
    id: 'services',
    title: 'Servizi',
    items: [
      'Carta regalo',
      'Guida alle taglie',
      'Normal.* per trovare la tua taglia',
      'Il programma fedeltà dei più fedeli.*'
    ]
  }
];

interface Product {
  id: number;
  name: string;
  price: string;
  mainImage?: string;
  category: string;
  subcategory?: string;
  isOnSale?: boolean;
  salePrice?: string;
  rating?: number;
}

export default function CollectionPage() {
  const [, setLocation] = useLocation();
  const [selectedSection, setSelectedSection] = useState<string | null>(null);

  // Fetch all categories from database
  const { data: categories = [], isLoading: categoriesLoading } = useQuery<Category[]>({
    queryKey: ['/api/categories'],
  });

  // Fetch featured products for the collection page
  const { data: featuredProducts = [], isLoading } = useQuery<Product[]>({
    queryKey: ['/api/products', 'featured'],
    queryFn: async () => {
      const response = await fetch('/api/products?limit=12');
      if (!response.ok) throw new Error('Failed to fetch products');
      return response.json();
    },
  });

  const handleSectionClick = (sectionId: string) => {
    // For now, redirect to category page or show products
    const categoryMap: Record<string, string> = {
      'hauts': 'abbigliamento',
      'bas': 'pantaloni', 
      'jeans': 'pantaloni',
      'costumes': 'abbigliamento',
      'sous-vetements': 'accessori',
      'accessoires': 'accessori',
      'vestes-blousons': 'abbigliamento'
    };
    
    const targetCategory = categoryMap[sectionId] || 'catalog';
    setLocation(`/${targetCategory}`);
  };

  const handleItemClick = (sectionId: string, item: string) => {
    // Handle specific item navigation
    const slug = item.toLowerCase().replace(/[^a-z0-9]/g, '-');
    setLocation(`/category/${slug}`);
  };

  return (
    <div className="min-h-screen bg-white">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* Secondary Navigation for Categories */}
        <div className="mb-8">
          <nav className="flex justify-center flex-wrap gap-4 py-4 bg-gray-50 rounded-lg">
            {categoriesLoading ? (
              // Loading state
              <div className="flex space-x-4">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="h-8 w-24 bg-gray-300 rounded-full animate-pulse"></div>
                ))}
              </div>
            ) : (
              categories.map((category) => (
                <a
                  key={category.id}
                  href={`/${category.slug}`}
                  className="text-sm font-medium text-gray-700 hover:text-black transition-colors px-4 py-2 rounded-full hover:bg-white"
                  data-testid={`nav-secondary-${category.slug}`}
                >
                  {category.name}
                </a>
              ))
            )}
          </nav>
        </div>

        {/* Page Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4" data-testid="heading-collection-title">
            Collezione
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Scopri la nostra collezione completa uomo: dai basici ai capi di tendenza, 
            trova tutto quello di cui hai bisogno per comporre il tuo stile.
          </p>
        </div>

        {/* Collection Sections Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          {collectionSections.map((section) => (
            <Card 
              key={section.id} 
              className={`group cursor-pointer transition-all duration-200 hover:shadow-lg ${
                section.isSpecial ? 'border-2 border-red-200 bg-red-50' : 'border border-gray-200'
              }`}
              onClick={() => handleSectionClick(section.id)}
              data-testid={`card-section-${section.id}`}
            >
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className={`text-xl font-bold ${
                    section.isSpecial ? 'text-red-700' : 'text-gray-900'
                  }`} data-testid={`heading-${section.id}`}>
                    {section.title}
                  </h2>
                  {section.isSpecial && (
                    <Badge variant="destructive" className="text-xs">
                      OFFRE
                    </Badge>
                  )}
                  <ChevronRight className={`w-5 h-5 transition-transform group-hover:translate-x-1 ${
                    section.isSpecial ? 'text-red-700' : 'text-gray-400'
                  }`} />
                </div>
                
                <div className="space-y-2">
                  {section.items.map((item, index) => (
                    <button
                      key={index}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleItemClick(section.id, item);
                      }}
                      className={`block w-full text-left text-sm transition-colors hover:font-medium ${
                        section.isSpecial 
                          ? 'text-red-600 hover:text-red-800' 
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                      data-testid={`link-${section.id}-${item.toLowerCase().replace(/[^a-z0-9]/g, '-')}`}
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Featured Products Section */}
        <section className="mb-16">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl font-bold text-gray-900">Le Novità</h2>
            <Button 
              variant="outline" 
              onClick={() => setLocation('/catalog')}
              data-testid="button-view-all-products"
            >
              Vedi tutto
            </Button>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="aspect-[3/4] bg-gray-200 rounded-lg mb-3"></div>
                  <div className="h-4 bg-gray-200 rounded mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {featuredProducts.slice(0, 8).map((product) => (
                <Card
                  key={product.id}
                  className="group cursor-pointer border-0 shadow-none hover:shadow-lg transition-all"
                  onClick={() => setLocation(`/products/${product.id}`)}
                  data-testid={`card-featured-product-${product.id}`}
                >
                  <CardContent className="p-0">
                    <div className="aspect-[3/4] bg-gray-100 rounded-lg overflow-hidden mb-3">
                      {product.mainImage ? (
                        <img
                          src={product.mainImage}
                          alt={product.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                          <span className="text-sm">Nessuna immagine</span>
                        </div>
                      )}
                    </div>
                    
                    <h3 className="font-medium text-sm text-gray-900 mb-1 line-clamp-2" data-testid={`text-product-name-${product.id}`}>
                      {product.name}
                    </h3>
                    
                    {product.rating && (
                      <div className="flex items-center space-x-1 mb-1">
                        <div className="flex">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`w-3 h-3 ${i < Math.floor(product.rating!) ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
                            />
                          ))}
                        </div>
                        <span className="text-xs text-gray-500">{product.rating}</span>
                      </div>
                    )}
                    
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </section>


        {/* Services Section */}
        <section className="text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-8">Servizi Celio</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center" data-testid="service-gift-card">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                🎁
              </div>
              <h3 className="font-medium text-gray-900 mb-1">Carta regalo</h3>
              <p className="text-sm text-gray-600">Il regalo perfetto</p>
            </div>
            
            <div className="text-center" data-testid="service-size-guide">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                📏
              </div>
              <h3 className="font-medium text-gray-900 mb-1">Guida alle taglie</h3>
              <p className="text-sm text-gray-600">Trova la tua taglia</p>
            </div>
            
            <div className="text-center" data-testid="service-loyalty">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                ⭐
              </div>
              <h3 className="font-medium text-gray-900 mb-1">Programma fedeltà</h3>
              <p className="text-sm text-gray-600">Accumula punti</p>
            </div>
            
            <div className="text-center" data-testid="service-normal">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                🎯
              </div>
              <h3 className="font-medium text-gray-900 mb-1">Normal.*</h3>
              <p className="text-sm text-gray-600">Trova il tuo stile</p>
            </div>
          </div>
        </section>
      </main>

      <CelioFooter />
    </div>
  );
}