import React, { useState, useEffect } from 'react';
import { Link } from 'wouter';
import Header from '../components/Header';
import CelioFooter from '../components/CelioFooter';
import { Share2, Instagram, Copy, ChevronRight, Sparkles, ShoppingBag } from 'lucide-react';

interface OutfitProduct {
  ruolo: string;
  id: number;
  nome: string;
  prezzo: string;
  immagine: string;
  categoria: string;
}

interface Outfit {
  id: number;
  prodotti: OutfitProduct[];
  prezzoTotale: string;
  stile: string;
  stagione: string;
  captionInstagram: string;
}

interface LookbookItem {
  id: number;
  name: string;
  description: string;
  season: string;
  style: string;
  mainImage: string;
  totalPrice: string;
  instagramCaption: string;
  hashtags: string;
  prodotti: Array<{
    id: number;
    name: string;
    price: string;
    mainImage: string;
    category: string;
  }>;
}

const ROLE_LABELS: Record<string, string> = {
  top: 'Sopra',
  bottom: 'Sotto',
  giacca: 'Giacca',
  accessorio: 'Accessorio',
};

const STYLE_FILTERS = [
  { label: 'Tutti', value: '' },
  { label: 'Casual', value: 'casual' },
  { label: 'Estivo', value: 'estivo' },
  { label: 'Elegante', value: 'elegante' },
  { label: 'Invernale', value: 'invernale' },
];

export default function Lookbook() {
  const [outfits, setOutfits] = useState<Outfit[]>([]);
  const [savedLookbooks, setSavedLookbooks] = useState<LookbookItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeStyle, setActiveStyle] = useState('');
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<'generati' | 'curati'>('generati');

  useEffect(() => {
    loadData();
  }, [activeStyle]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [outfitRes, lookbookRes] = await Promise.all([
        fetch(`/api/outfits/generate?limit=12${activeStyle ? `&style=${activeStyle}` : ''}`),
        fetch('/api/lookbooks'),
      ]);
      const outfitData = await outfitRes.json();
      const lookbookData = await lookbookRes.json();
      setOutfits(outfitData.outfits || []);
      setSavedLookbooks(Array.isArray(lookbookData) ? lookbookData : []);
    } catch (e) {
      console.error('Errore caricamento lookbook:', e);
    }
    setLoading(false);
  };

  const copyCaption = (caption: string, id: number) => {
    navigator.clipboard.writeText(caption);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const shareInstagram = (outfit: Outfit) => {
    const text = encodeURIComponent(outfit.captionInstagram);
    window.open(`https://www.instagram.com/`, '_blank');
  };

  return (
    <div className="min-h-screen bg-white">
      <Header />

      {/* Hero */}
      <section className="bg-[#f5f3f0] py-14 px-4 text-center">
        <p className="text-xs tracking-widest uppercase text-gray-500 mb-3">Celio Italia</p>
        <h1 className="text-4xl md:text-6xl font-bold text-gray-900 leading-tight mb-4">
          Lookbook<br />
          <span className="font-light">i nostri look</span>
        </h1>
        <p className="text-gray-600 max-w-md mx-auto">
          Outfit completi pronti da indossare. Trova il tuo stile e condividilo su Instagram.
        </p>
      </section>

      {/* Tabs */}
      <div className="border-b border-gray-200 bg-white sticky top-0 z-10">
        <div className="max-w-[1200px] mx-auto px-4 flex gap-6">
          <button
            onClick={() => setActiveTab('generati')}
            className={`py-4 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'generati'
                ? 'border-gray-900 text-gray-900'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <Sparkles className="inline w-4 h-4 mr-1" />
            Outfit Generati
          </button>
          {savedLookbooks.length > 0 && (
            <button
              onClick={() => setActiveTab('curati')}
              className={`py-4 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'curati'
                  ? 'border-gray-900 text-gray-900'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <ShoppingBag className="inline w-4 h-4 mr-1" />
              Look Curati ({savedLookbooks.length})
            </button>
          )}
        </div>
      </div>

      <main className="max-w-[1200px] mx-auto px-4 py-8">

        {/* Filtri stile */}
        {activeTab === 'generati' && (
          <div className="flex gap-2 mb-8 overflow-x-auto no-scrollbar">
            {STYLE_FILTERS.map(f => (
              <button
                key={f.value}
                onClick={() => setActiveStyle(f.value)}
                className={`flex-shrink-0 px-5 py-2 rounded-full text-sm font-medium transition-colors ${
                  activeStyle === f.value
                    ? 'bg-gray-900 text-white'
                    : 'border border-gray-300 text-gray-700 hover:border-gray-900'
                }`}
              >
                {f.label}
              </button>
            ))}

            <button
              onClick={loadData}
              className="flex-shrink-0 px-5 py-2 rounded-full text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 transition-colors ml-auto"
            >
              <Sparkles className="inline w-4 h-4 mr-1" />
              Genera nuovi
            </button>
          </div>
        )}

        {loading ? (
          <div className="text-center py-20">
            <div className="animate-spin w-8 h-8 border-2 border-gray-900 border-t-transparent rounded-full mx-auto mb-4" />
            <p className="text-gray-500">Caricamento outfit...</p>
          </div>
        ) : activeTab === 'generati' ? (
          /* Outfit generati automaticamente */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {outfits.map(outfit => (
              <div key={outfit.id} className="bg-white border border-gray-200 rounded-2xl overflow-hidden hover:shadow-lg transition-shadow">
                {/* Immagini prodotto griglia */}
                <div className="grid grid-cols-2 gap-0.5 bg-gray-100">
                  {outfit.prodotti.slice(0, 4).map((p, i) => (
                    <Link key={p.id} href={`/products/${p.id}`}>
                      <div className="aspect-[3/4] relative overflow-hidden cursor-pointer group">
                        <img
                          src={p.immagine}
                          alt={p.nome}
                          loading="lazy"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2">
                          <span className="text-white text-[10px] font-medium uppercase tracking-wider">
                            {ROLE_LABELS[p.ruolo] || p.ruolo}
                          </span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>

                {/* Info outfit */}
                <div className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium px-2 py-0.5 bg-gray-100 rounded-full text-gray-600">
                      {outfit.stile} - {outfit.stagione}
                    </span>
                    <span className="text-lg font-bold text-gray-900">{outfit.prezzoTotale} EUR</span>
                  </div>

                  {/* Lista prodotti */}
                  <div className="space-y-1 mb-3">
                    {outfit.prodotti.map(p => (
                      <Link key={p.id} href={`/products/${p.id}`}>
                        <div className="flex justify-between items-center text-sm hover:bg-gray-50 rounded px-1 py-0.5 cursor-pointer">
                          <span className="text-gray-700 truncate flex-1">{p.nome}</span>
                          <span className="text-gray-500 ml-2 flex-shrink-0">{p.prezzo} EUR</span>
                        </div>
                      </Link>
                    ))}
                  </div>

                  {/* Azioni */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => copyCaption(outfit.captionInstagram, outfit.id)}
                      className="flex-1 flex items-center justify-center gap-1 py-2 px-3 text-xs font-medium border border-gray-300 rounded-full hover:bg-gray-50 transition-colors"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      {copiedId === outfit.id ? 'Copiato!' : 'Copia Caption'}
                    </button>
                    <button
                      onClick={() => shareInstagram(outfit)}
                      className="flex items-center justify-center gap-1 py-2 px-3 text-xs font-medium bg-gradient-to-r from-purple-600 to-pink-500 text-white rounded-full hover:opacity-90 transition-opacity"
                    >
                      <Instagram className="w-3.5 h-3.5" />
                      Condividi
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* Lookbook curati dall'admin */
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {savedLookbooks.map(lb => (
              <div key={lb.id} className="bg-white border border-gray-200 rounded-2xl overflow-hidden hover:shadow-lg transition-shadow">
                {/* Immagine principale */}
                {lb.mainImage && (
                  <div className="aspect-[16/9] overflow-hidden">
                    <img src={lb.mainImage} alt={lb.name} className="w-full h-full object-cover" />
                  </div>
                )}

                <div className="p-6">
                  <div className="flex items-center gap-2 mb-2">
                    {lb.style && (
                      <span className="text-xs font-medium px-2 py-0.5 bg-gray-100 rounded-full text-gray-600">
                        {lb.style}
                      </span>
                    )}
                    {lb.season && (
                      <span className="text-xs font-medium px-2 py-0.5 bg-blue-50 rounded-full text-blue-600">
                        {lb.season}
                      </span>
                    )}
                  </div>

                  <h3 className="text-xl font-bold text-gray-900 mb-1">{lb.name}</h3>
                  {lb.description && <p className="text-sm text-gray-600 mb-4">{lb.description}</p>}

                  {/* Prodotti del lookbook */}
                  <div className="flex gap-3 overflow-x-auto no-scrollbar mb-4">
                    {lb.prodotti.map(p => (
                      <Link key={p.id} href={`/products/${p.id}`}>
                        <div className="flex-shrink-0 w-24 cursor-pointer group">
                          <div className="aspect-[3/4] rounded-lg overflow-hidden bg-gray-100 mb-1">
                            <img
                              src={p.mainImage}
                              alt={p.name}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                            />
                          </div>
                          <p className="text-[11px] text-gray-700 truncate">{p.name}</p>
                          <p className="text-[11px] font-medium">{p.price} EUR</p>
                        </div>
                      </Link>
                    ))}
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-lg font-bold">{lb.totalPrice} EUR</span>
                    <div className="flex gap-2">
                      {lb.instagramCaption && (
                        <button
                          onClick={() => copyCaption(lb.instagramCaption, lb.id)}
                          className="flex items-center gap-1 py-2 px-3 text-xs font-medium border border-gray-300 rounded-full hover:bg-gray-50"
                        >
                          <Copy className="w-3.5 h-3.5" />
                          {copiedId === lb.id ? 'Copiato!' : 'Caption'}
                        </button>
                      )}
                      <button
                        onClick={() => window.open('https://www.instagram.com/', '_blank')}
                        className="flex items-center gap-1 py-2 px-3 text-xs font-medium bg-gradient-to-r from-purple-600 to-pink-500 text-white rounded-full hover:opacity-90"
                      >
                        <Instagram className="w-3.5 h-3.5" />
                        Condividi
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

      </main>

      <CelioFooter />
    </div>
  );
}
