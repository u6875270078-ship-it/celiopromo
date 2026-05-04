import React, { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, Save, X, MapPin, Phone, Mail, Eye, EyeOff, GripVertical, Store, ImageIcon, Upload, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';

interface StoreData {
  id: number;
  name: string;
  city: string;
  address: string;
  phone: string | null;
  email: string | null;
  image: string | null;
  mapQuery: string | null;
  isActive: boolean | null;
  position: number | null;
  createdAt: string | null;
  updatedAt: string | null;
}

const EMPTY_FORM = {
  name: '',
  city: '',
  address: '',
  phone: '',
  email: '',
  image: '',
  mapQuery: '',
  isActive: true,
  position: 0,
};

export default function AdminStores() {
  const [storesList, setStoresList] = useState<StoreData[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const { toast } = useToast();

  const fetchStores = async () => {
    try {
      const res = await fetch('/api/stores');
      const data = await res.json();
      setStoresList(Array.isArray(data) ? data : []);
    } catch {
      toast({ title: 'Errore', description: 'Impossibile caricare i negozi', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchStores(); }, []);

  const openAdd = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setImagePreview(null);
    setShowForm(true);
  };

  const openEdit = (store: StoreData) => {
    setEditingId(store.id);
    setForm({
      name: store.name,
      city: store.city,
      address: store.address,
      phone: store.phone || '',
      email: store.email || '',
      image: store.image || '',
      mapQuery: store.mapQuery || '',
      isActive: store.isActive ?? true,
      position: store.position ?? 0,
    });
    setImagePreview(store.image || null);
    setShowForm(true);
  };

  const cancelForm = () => {
    setShowForm(false);
    setEditingId(null);
    setForm(EMPTY_FORM);
    setImagePreview(null);
  };

  const handleImageUrl = (url: string) => {
    setForm(f => ({ ...f, image: url }));
    if (url) {
      const img = new Image();
      img.onload = () => setImagePreview(url);
      img.onerror = () => setImagePreview(null);
      img.src = url;
    } else {
      setImagePreview(null);
    }
  };

  const handleImageFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ''; // allow re-picking the same file
    if (!file) return;
    // Allow anything tagged image/* OR with a known image extension
    // (HEIC from iPhones often arrives as application/octet-stream).
    const imageExt = /\.(jpe?g|png|gif|webp|bmp|svg|heic|heif|avif|tiff?|ico)$/i;
    if (!file.type.startsWith('image/') && !imageExt.test(file.name)) {
      toast({ title: 'Errore', description: 'Solo file immagine (jpg, png, gif, webp, heic, ecc.)', variant: 'destructive' });
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast({ title: 'Errore', description: 'Immagine troppo grande (max 10MB)', variant: 'destructive' });
      return;
    }
    setUploadingImage(true);
    try {
      const data = new FormData();
      data.append('image', file);
      const res = await fetch('/api/admin/upload-image', { method: 'POST', body: data });
      const json = await res.json();
      if (!res.ok || !json.url) throw new Error(json.error || 'Upload fallito');
      setForm(f => ({ ...f, image: json.url }));
      setImagePreview(json.url);
    } catch (err: any) {
      toast({ title: 'Errore', description: err.message, variant: 'destructive' });
    } finally {
      setUploadingImage(false);
    }
  };

  const autoMapQuery = () => {
    if (form.address && form.city) {
      const q = `${form.address}, ${form.city}, Italy`.replace(/\s+/g, '+');
      setForm(f => ({ ...f, mapQuery: q }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const url = editingId ? `/api/admin/stores/${editingId}` : '/api/admin/stores';
      const method = editingId ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Errore');
      }
      toast({
        title: 'Successo',
        description: editingId ? 'Negozio aggiornato con successo' : 'Negozio creato con successo',
      });
      cancelForm();
      fetchStores();
    } catch (err: any) {
      toast({ title: 'Errore', description: err.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (store: StoreData) => {
    if (!confirm(`Sei sicuro di voler eliminare "${store.name}"?`)) return;
    try {
      const res = await fetch(`/api/admin/stores/${store.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
      toast({ title: 'Successo', description: 'Negozio eliminato con successo' });
      fetchStores();
    } catch {
      toast({ title: 'Errore', description: 'Impossibile eliminare il negozio', variant: 'destructive' });
    }
  };

  const toggleActive = async (store: StoreData) => {
    try {
      await fetch(`/api/admin/stores/${store.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !store.isActive }),
      });
      fetchStores();
    } catch {
      toast({ title: 'Errore', description: 'Impossibile aggiornare lo stato', variant: 'destructive' });
    }
  };

  if (loading) {
    return <div className="p-6 text-center text-gray-500">Caricamento negozi...</div>;
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestione Negozi</h1>
          <p className="text-gray-600">Gestisci i punti vendita Celio</p>
        </div>
        <Button onClick={openAdd}>
          <Plus className="h-4 w-4 mr-2" />
          Aggiungi Negozio
        </Button>
      </div>

      {/* Add / Edit Form */}
      {showForm && (
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 mb-6">
          <h3 className="text-lg font-semibold mb-4">
            {editingId ? 'Modifica Negozio' : 'Nuovo Negozio'}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome Negozio *</label>
                <Input
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="Es: Centro Commerciale Fiordaliso"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Città *</label>
                <Input
                  value={form.city}
                  onChange={e => setForm(f => ({ ...f, city: e.target.value }))}
                  placeholder="Es: Milano"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Indirizzo *</label>
              <Input
                value={form.address}
                onChange={e => setForm(f => ({ ...f, address: e.target.value }))}
                placeholder="Es: Via Eugenio Curiel, 25, 20089 Rozzano MI"
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Telefono</label>
                <Input
                  value={form.phone}
                  onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                  placeholder="Es: 0257503946"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <Input
                  type="email"
                  value={form.email}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  placeholder="Es: celiorozzano@dsimmoretail.it"
                />
              </div>
            </div>

            {/* Image: URL field + file upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <ImageIcon size={14} className="inline mr-1" />
                Immagine del Negozio
              </label>
              <div className="flex gap-2">
                <Input
                  value={form.image.startsWith('data:') ? '(immagine caricata)' : form.image}
                  onChange={e => handleImageUrl(e.target.value)}
                  placeholder="https://esempio.com/foto-negozio.jpg"
                  className="flex-1"
                  readOnly={form.image.startsWith('data:')}
                />
                <label
                  className={`inline-flex items-center gap-1.5 px-3 py-2 border border-gray-300 rounded-md text-sm bg-white hover:bg-gray-50 cursor-pointer whitespace-nowrap ${uploadingImage ? 'opacity-50 cursor-not-allowed' : ''}`}
                  title="Carica un file dal tuo dispositivo"
                >
                  {uploadingImage ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      Caricamento...
                    </>
                  ) : (
                    <>
                      <Upload size={14} />
                      Carica file
                    </>
                  )}
                  <input
                    type="file"
                    accept="image/*,.jpg,.jpeg,.png,.gif,.webp,.bmp,.svg,.heic,.heif,.avif,.tif,.tiff"
                    onChange={handleImageFile}
                    disabled={uploadingImage}
                    className="hidden"
                  />
                </label>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Inserisci un URL pubblico oppure carica un file dal dispositivo. Formati supportati: JPG, PNG, GIF, WEBP, SVG, HEIC, AVIF, TIFF, BMP. Max 10MB.
              </p>
              {imagePreview && (
                <div className="mt-2 relative inline-block">
                  <img
                    src={imagePreview}
                    alt="Anteprima"
                    className="h-32 w-48 object-cover rounded-lg border border-gray-200"
                  />
                  <button
                    type="button"
                    onClick={() => { setForm(f => ({ ...f, image: '' })); setImagePreview(null); }}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                  >
                    <X size={12} />
                  </button>
                </div>
              )}
            </div>

            {/* Map query */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <MapPin size={14} className="inline mr-1" />
                Query Google Maps
              </label>
              <div className="flex gap-2">
                <Input
                  value={form.mapQuery}
                  onChange={e => setForm(f => ({ ...f, mapQuery: e.target.value }))}
                  placeholder="Es: Centro+Commerciale+Fiordaliso,+Rozzano,+Italy"
                  className="flex-1"
                />
                <Button type="button" variant="outline" onClick={autoMapQuery} className="whitespace-nowrap">
                  Auto genera
                </Button>
              </div>
              <p className="text-xs text-gray-500 mt-1">Usato per la mappa e il link indicazioni stradali</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Posizione (ordinamento)</label>
                <Input
                  type="number"
                  value={form.position}
                  onChange={e => setForm(f => ({ ...f, position: parseInt(e.target.value) || 0 }))}
                />
              </div>
              <div className="flex items-end">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.isActive}
                    onChange={e => setForm(f => ({ ...f, isActive: e.target.checked }))}
                    className="w-4 h-4 rounded"
                  />
                  <span className="text-sm font-medium text-gray-700">Negozio attivo (visibile sul sito)</span>
                </label>
              </div>
            </div>

            {/* Map preview */}
            {form.mapQuery && (
              <div className="rounded-lg overflow-hidden border border-gray-200">
                <p className="text-xs text-gray-500 px-3 py-1 bg-gray-50">Anteprima mappa</p>
                <iframe
                  title="Anteprima mappa"
                  width="100%"
                  height="200"
                  style={{ border: 0 }}
                  loading="lazy"
                  src={`https://maps.google.com/maps?q=${form.mapQuery}&output=embed&z=15`}
                />
              </div>
            )}

            <div className="flex gap-2 pt-2">
              <Button type="submit" disabled={saving}>
                <Save className="h-4 w-4 mr-2" />
                {saving ? 'Salvataggio...' : editingId ? 'Aggiorna' : 'Crea Negozio'}
              </Button>
              <Button type="button" variant="outline" onClick={cancelForm}>
                <X className="h-4 w-4 mr-2" />
                Annulla
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Stores list */}
      {storesList.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <Store className="mx-auto h-12 w-12 mb-4" />
          <p className="text-lg font-semibold">Nessun negozio</p>
          <p className="text-sm">Aggiungi il tuo primo punto vendita per iniziare</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {storesList.map(store => (
            <div
              key={store.id}
              className={`bg-white border rounded-xl overflow-hidden shadow-sm flex flex-col md:flex-row ${
                !store.isActive ? 'opacity-60' : ''
              }`}
            >
              {/* Image */}
              <div className="md:w-48 h-36 md:h-auto flex-shrink-0 bg-gray-100 relative">
                {store.image ? (
                  <img
                    src={store.image}
                    alt={store.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    <ImageIcon size={32} />
                  </div>
                )}
                <span className="absolute top-2 right-2 bg-gray-900 text-white text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase">
                  {store.city}
                </span>
              </div>

              {/* Info */}
              <div className="flex-1 p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-bold text-gray-900">{store.name}</h3>
                    <div className="text-sm text-gray-600 space-y-1 mt-1">
                      <div className="flex items-center gap-1.5">
                        <MapPin size={14} className="text-red-500" />
                        {store.address}
                      </div>
                      {store.phone && (
                        <div className="flex items-center gap-1.5">
                          <Phone size={14} className="text-gray-400" />
                          {store.phone}
                        </div>
                      )}
                      {store.email && (
                        <div className="flex items-center gap-1.5">
                          <Mail size={14} className="text-gray-400" />
                          {store.email}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      store.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {store.isActive ? 'Attivo' : 'Nascosto'}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 mt-3 pt-3 border-t border-gray-100">
                  <Button size="sm" variant="outline" onClick={() => openEdit(store)}>
                    <Pencil className="h-3.5 w-3.5 mr-1" />
                    Modifica
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => toggleActive(store)}>
                    {store.isActive ? <EyeOff className="h-3.5 w-3.5 mr-1" /> : <Eye className="h-3.5 w-3.5 mr-1" />}
                    {store.isActive ? 'Nascondi' : 'Mostra'}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-red-600 hover:text-red-700"
                    onClick={() => handleDelete(store)}
                  >
                    <Trash2 className="h-3.5 w-3.5 mr-1" />
                    Elimina
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
