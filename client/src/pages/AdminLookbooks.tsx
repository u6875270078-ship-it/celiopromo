import React, { useState, useEffect } from 'react';
import { Sparkles, Plus, Trash2, Eye, EyeOff, Save, Star, Instagram, Copy, RefreshCw, Search } from 'lucide-react';

interface Product {
  id: number;
  name: string;
  price: string;
  mainImage: string;
  category: string;
}

interface LookbookItem {
  id: number;
  name: string;
  description: string;
  season: string;
  style: string;
  productIds: number[];
  mainImage: string;
  totalPrice: string;
  isPublished: boolean;
  isFeatured: boolean;
  instagramCaption: string;
  hashtags: string;
  prodotti: Product[];
}

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

const AdminLookbooks: React.FC = () => {
  const [lookbooks, setLookbooks] = useState<LookbookItem[]>([]);
  const [generatedOutfits, setGeneratedOutfits] = useState<Outfit[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProducts, setSelectedProducts] = useState<number[]>([]);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    season: '',
    style: '',
    instagramCaption: '',
    hashtags: '#celio #celioitalia #modauomo #outfit #ootd',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [lbRes, prodRes] = await Promise.all([
        fetch('/api/admin/lookbooks'),
        fetch('/api/products?limit=2000'),
      ]);
      setLookbooks(await lbRes.json());
      const allProds = await prodRes.json();
      setProducts(Array.isArray(allProds) ? allProds : []);
    } catch (e) {
      console.error('Errore:', e);
    }
    setLoading(false);
  };

  const generateOutfits = async () => {
    setGenerating(true);
    try {
      const res = await fetch('/api/outfits/generate?limit=8');
      const data = await res.json();
      setGeneratedOutfits(data.outfits || []);
    } catch (e) {
      console.error('Errore generazione:', e);
    }
    setGenerating(false);
  };

  const saveOutfitAsLookbook = async (outfit: Outfit) => {
    try {
      const res = await fetch('/api/admin/lookbooks/from-outfit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          outfit,
          name: `Look ${outfit.stile} - ${outfit.stagione}`,
          description: `Outfit ${outfit.stile} composto da ${outfit.prodotti.length} capi`,
        }),
      });
      if (res.ok) {
        await loadData();
        setGeneratedOutfits(prev => prev.filter(o => o.id !== outfit.id));
      }
    } catch (e) {
      console.error('Errore salvataggio:', e);
    }
  };

  const createLookbook = async () => {
    if (!formData.name || selectedProducts.length === 0) return;
    try {
      const res = await fetch('/api/admin/lookbooks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          productIds: selectedProducts,
          mainImage: products.find(p => p.id === selectedProducts[0])?.mainImage || null,
        }),
      });
      if (res.ok) {
        setShowCreateForm(false);
        setSelectedProducts([]);
        setFormData({ name: '', description: '', season: '', style: '', instagramCaption: '', hashtags: '#celio #celioitalia #modauomo #outfit #ootd' });
        await loadData();
      }
    } catch (e) {
      console.error('Errore creazione:', e);
    }
  };

  const togglePublish = async (lb: LookbookItem) => {
    try {
      await fetch(`/api/admin/lookbooks/${lb.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isPublished: !lb.isPublished }),
      });
      await loadData();
    } catch (e) {
      console.error('Errore:', e);
    }
  };

  const toggleFeatured = async (lb: LookbookItem) => {
    try {
      await fetch(`/api/admin/lookbooks/${lb.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isFeatured: !lb.isFeatured }),
      });
      await loadData();
    } catch (e) {
      console.error('Errore:', e);
    }
  };

  const deleteLookbook = async (id: number) => {
    if (!confirm('Sei sicuro di voler eliminare questo lookbook?')) return;
    try {
      await fetch(`/api/admin/lookbooks/${id}`, { method: 'DELETE' });
      await loadData();
    } catch (e) {
      console.error('Errore eliminazione:', e);
    }
  };

  const copyCaption = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-gray-900 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-[1400px] mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Lookbook & Outfit</h1>
          <p className="text-sm text-gray-500">Gestisci outfit e look per Instagram e il sito</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={generateOutfits}
            disabled={generating}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {generating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            Genera Outfit
          </button>
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-black"
          >
            <Plus className="w-4 h-4" />
            Nuovo Lookbook
          </button>
        </div>
      </div>

      {/* Form creazione manuale */}
      {showCreateForm && (
        <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Crea Nuovo Lookbook</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nome</label>
              <input
                type="text"
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                placeholder="es. Look Estivo Casual"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Stile</label>
              <select
                value={formData.style}
                onChange={e => setFormData({ ...formData, style: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              >
                <option value="">Seleziona stile</option>
                <option value="Casual">Casual</option>
                <option value="Elegante">Elegante</option>
                <option value="Estivo">Estivo</option>
                <option value="Invernale">Invernale</option>
                <option value="Sportivo">Sportivo</option>
                <option value="Business">Business</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Stagione</label>
              <input
                type="text"
                value={formData.season}
                onChange={e => setFormData({ ...formData, season: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                placeholder="es. Estate 2025"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Descrizione</label>
              <input
                type="text"
                value={formData.description}
                onChange={e => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                placeholder="Descrizione breve"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Caption Instagram</label>
              <textarea
                value={formData.instagramCaption}
                onChange={e => setFormData({ ...formData, instagramCaption: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                rows={3}
                placeholder="Caption per Instagram..."
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Hashtag</label>
              <input
                type="text"
                value={formData.hashtags}
                onChange={e => setFormData({ ...formData, hashtags: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              />
            </div>
          </div>

          {/* Seleziona prodotti */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Prodotti selezionati ({selectedProducts.length})
            </label>
            <div className="flex gap-2 flex-wrap mb-3">
              {selectedProducts.map(pid => {
                const p = products.find(pr => pr.id === pid);
                if (!p) return null;
                return (
                  <div key={pid} className="flex items-center gap-2 bg-gray-100 rounded-lg px-2 py-1 text-sm">
                    {p.mainImage && <img src={p.mainImage} className="w-8 h-8 rounded object-cover" />}
                    <span className="truncate max-w-[150px]">{p.name}</span>
                    <button onClick={() => setSelectedProducts(prev => prev.filter(id => id !== pid))} className="text-red-500 hover:text-red-700">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>
            <div className="relative mb-2">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm"
                placeholder="Cerca prodotti per nome o categoria..."
              />
            </div>
            <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-lg">
              {filteredProducts.slice(0, 50).map(p => (
                <button
                  key={p.id}
                  onClick={() => {
                    if (!selectedProducts.includes(p.id)) {
                      setSelectedProducts(prev => [...prev, p.id]);
                    }
                  }}
                  disabled={selectedProducts.includes(p.id)}
                  className="w-full flex items-center gap-3 px-3 py-2 hover:bg-gray-50 text-left text-sm border-b border-gray-100 last:border-0 disabled:opacity-50"
                >
                  {p.mainImage && <img src={p.mainImage} className="w-10 h-10 rounded object-cover flex-shrink-0" />}
                  <div className="flex-1 min-w-0">
                    <p className="truncate font-medium">{p.name}</p>
                    <p className="text-xs text-gray-500">{p.category} - {p.price} EUR</p>
                  </div>
                  {selectedProducts.includes(p.id) && <span className="text-green-600 text-xs">Aggiunto</span>}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={createLookbook}
              disabled={!formData.name || selectedProducts.length === 0}
              className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-black disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              Salva Lookbook
            </button>
            <button
              onClick={() => { setShowCreateForm(false); setSelectedProducts([]); }}
              className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Annulla
            </button>
          </div>
        </div>
      )}

      {/* Outfit generati */}
      {generatedOutfits.length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-blue-600" />
            Outfit Generati Automaticamente ({generatedOutfits.length})
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {generatedOutfits.map(outfit => (
              <div key={outfit.id} className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <div className="flex gap-1 mb-3">
                  {outfit.prodotti.slice(0, 3).map(p => (
                    <div key={p.id} className="flex-1 aspect-[3/4] rounded overflow-hidden">
                      <img src={p.immagine} alt={p.nome} className="w-full h-full object-cover" />
                    </div>
                  ))}
                </div>
                <div className="text-sm font-medium mb-1">{outfit.stile} - {outfit.stagione}</div>
                <div className="text-xs text-gray-600 mb-1">
                  {outfit.prodotti.map(p => p.nome).join(' + ')}
                </div>
                <div className="text-sm font-bold mb-3">{outfit.prezzoTotale} EUR</div>
                <button
                  onClick={() => saveOutfitAsLookbook(outfit)}
                  className="w-full flex items-center justify-center gap-1 py-2 text-xs font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  <Save className="w-3.5 h-3.5" />
                  Salva come Lookbook
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Lookbook salvati */}
      <h2 className="text-lg font-semibold mb-4">Lookbook Salvati ({lookbooks.length})</h2>
      {lookbooks.length === 0 ? (
        <div className="bg-gray-50 rounded-xl p-8 text-center">
          <p className="text-gray-500 mb-2">Nessun lookbook ancora</p>
          <p className="text-sm text-gray-400">Genera degli outfit e salvali, oppure crea un lookbook manualmente</p>
        </div>
      ) : (
        <div className="space-y-4">
          {lookbooks.map(lb => (
            <div key={lb.id} className="bg-white border border-gray-200 rounded-xl p-4 flex gap-4">
              {/* Anteprima immagini */}
              <div className="flex gap-1 flex-shrink-0">
                {lb.prodotti.slice(0, 3).map(p => (
                  <div key={p.id} className="w-16 h-20 rounded overflow-hidden">
                    <img src={p.mainImage} alt={p.name} className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold text-gray-900 truncate">{lb.name}</h3>
                  {lb.isPublished && (
                    <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded-full">Pubblicato</span>
                  )}
                  {lb.isFeatured && (
                    <span className="text-xs px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded-full">In evidenza</span>
                  )}
                </div>
                <p className="text-sm text-gray-500 mb-1">
                  {lb.style && `${lb.style} `}{lb.season && `- ${lb.season} `}
                  - {lb.prodotti.length} prodotti - {lb.totalPrice} EUR
                </p>
                <p className="text-xs text-gray-400 truncate">
                  {lb.prodotti.map(p => p.name).join(', ')}
                </p>
              </div>

              {/* Azioni */}
              <div className="flex items-center gap-1 flex-shrink-0">
                <button
                  onClick={() => togglePublish(lb)}
                  className={`p-2 rounded-lg transition-colors ${lb.isPublished ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
                  title={lb.isPublished ? 'Nascondi' : 'Pubblica'}
                >
                  {lb.isPublished ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                </button>
                <button
                  onClick={() => toggleFeatured(lb)}
                  className={`p-2 rounded-lg transition-colors ${lb.isFeatured ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
                  title={lb.isFeatured ? 'Rimuovi evidenza' : 'Metti in evidenza'}
                >
                  <Star className="w-4 h-4" />
                </button>
                {lb.instagramCaption && (
                  <button
                    onClick={() => copyCaption(lb.instagramCaption)}
                    className="p-2 rounded-lg bg-gray-100 text-gray-500 hover:bg-gray-200 transition-colors"
                    title="Copia caption Instagram"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                )}
                <button
                  onClick={() => deleteLookbook(lb.id)}
                  className="p-2 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 transition-colors"
                  title="Elimina"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminLookbooks;
