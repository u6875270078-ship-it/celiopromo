import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import CelioFooter from '@/components/CelioFooter';
import VirtualTryOn from '@/components/VirtualTryOn';
import { User, Mail, Lock, Camera, Eye, EyeOff, Upload, Sparkles, ShoppingBag, LogOut, Trash2, Loader2, Download, History } from 'lucide-react';

interface AuthUser {
  id: number;
  email: string;
  firstName?: string;
  lastName?: string;
  profilePhoto?: string | null;
}

interface CartItem {
  productId: number;
  quantity: number;
  price: number;
  name: string;
  image?: string;
  color?: string | null;
  size?: string | null;
}

interface TryOnEntry {
  id: number;
  productId: number | null;
  productName: string;
  productImage: string | null;
  resultImage: string;
  category: string | null;
  createdAt: string;
}

function readAuth(): AuthUser | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem('customerAuth');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export default function CustomerAuth() {
  const [user, setUser] = useState<AuthUser | null>(readAuth());

  if (user) {
    return <CustomerProfile user={user} onLogout={() => { localStorage.removeItem('customerAuth'); setUser(null); }} />;
  }
  return <CustomerAuthForm onAuthenticated={(u) => setUser(u)} />;
}

// ─────────────────────────────────────────────────────────────────────
// Profile view (logged in)
// ─────────────────────────────────────────────────────────────────────

function CustomerProfile({ user, onLogout }: { user: AuthUser; onLogout: () => void }) {
  const [items, setItems] = useState<CartItem[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tryOn, setTryOn] = useState<CartItem | null>(null);
  const [history, setHistory] = useState<TryOnEntry[]>([]);

  const loadCart = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/cart?userId=${user.id}`);
      const data = await res.json();
      const raw = data?.items;
      const parsed: CartItem[] = Array.isArray(raw)
        ? raw
        : typeof raw === 'string'
          ? JSON.parse(raw || '[]')
          : [];
      setItems(parsed);
    } catch (e: any) {
      setError(e?.message || 'Impossibile caricare il carrello');
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  const loadHistory = async () => {
    try {
      const res = await fetch(`/api/virtual-tryon/history?userId=${user.id}`);
      const data = await res.json();
      setHistory(Array.isArray(data) ? data : []);
    } catch {
      setHistory([]);
    }
  };

  const deleteHistoryEntry = async (id: number) => {
    try {
      await fetch(`/api/virtual-tryon/history/${id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id }),
      });
      setHistory(h => h.filter(e => e.id !== id));
    } catch {
      // silent
    }
  };

  const downloadImage = (url: string, filename: string) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.target = '_blank';
    link.click();
  };

  useEffect(() => {
    loadCart();
    loadHistory();
  }, [user.id]);

  const removeItem = async (index: number) => {
    try {
      await fetch('/api/cart/remove', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemId: index, userId: user.id }),
      });
      loadCart();
    } catch {
      // silent
    }
  };

  const fullName = [user.firstName, user.lastName].filter(Boolean).join(' ') || user.email;
  const subtotal = (items || []).reduce((sum, it) => sum + Number(it.price) * Number(it.quantity), 0);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="max-w-5xl mx-auto px-4 py-10">
        {/* Profile header */}
        <div className="bg-white rounded-2xl shadow-sm p-6 mb-6 flex items-center gap-5">
          {user.profilePhoto ? (
            <img src={user.profilePhoto} alt="" className="w-20 h-20 rounded-full object-cover border-2 border-gray-200" />
          ) : (
            <div className="w-20 h-20 bg-gray-900 rounded-full flex items-center justify-center">
              <User className="text-white" size={32} />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold text-gray-900 truncate">{fullName}</h1>
            <p className="text-sm text-gray-500 truncate">{user.email}</p>
          </div>
          <button
            onClick={onLogout}
            className="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <LogOut size={16} />
            <span className="hidden sm:inline">Esci</span>
          </button>
        </div>

        {/* Cart */}
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <ShoppingBag size={20} className="text-gray-700" />
              <h2 className="text-lg font-bold text-gray-900">Il mio carrello</h2>
              {items && <span className="text-sm text-gray-400">({items.length})</span>}
            </div>
            {items && items.length > 0 && (
              <p className="text-sm font-semibold text-gray-900">
                Totale: € {subtotal.toFixed(2)}
              </p>
            )}
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm">
              {error}
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center py-16 text-gray-400">
              <Loader2 size={24} className="animate-spin" />
            </div>
          ) : !items || items.length === 0 ? (
            <div className="text-center py-12">
              <ShoppingBag size={40} className="text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 mb-4">Il tuo carrello è vuoto</p>
              <a
                href="/catalog"
                className="inline-block px-6 py-2.5 bg-gray-900 text-white text-sm font-semibold rounded-full hover:bg-gray-800 transition-colors"
              >
                Scopri i prodotti
              </a>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-gray-500 mb-3">
                Scegli un articolo per provarlo virtualmente sulla tua foto.
              </p>
              {items.map((item, idx) => (
                <div
                  key={`${item.productId}-${item.color}-${item.size}-${idx}`}
                  className="flex items-center gap-4 p-3 border border-gray-200 rounded-xl hover:border-gray-300 hover:shadow-sm transition-all"
                >
                  <div className="w-20 h-24 flex-shrink-0 bg-gray-100 rounded-lg overflow-hidden">
                    {item.image ? (
                      <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-300 text-xs">Nessuna foto</div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold text-gray-900 line-clamp-2">{item.name}</h3>
                    <div className="flex items-center gap-2 text-xs text-gray-500 mt-1 flex-wrap">
                      {item.color && <span>Colore: {item.color}</span>}
                      {item.size && <span>Taglia: {item.size}</span>}
                      <span>Qtà: {item.quantity}</span>
                    </div>
                    <p className="text-sm font-semibold text-gray-900 mt-1">
                      € {(Number(item.price) * Number(item.quantity)).toFixed(2)}
                    </p>
                  </div>
                  <div className="flex flex-col gap-2 flex-shrink-0">
                    <button
                      onClick={() => setTryOn(item)}
                      disabled={!item.image}
                      className="flex items-center justify-center gap-1.5 px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-xs font-semibold rounded-full hover:from-purple-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
                    >
                      <Sparkles size={14} />
                      Prova
                    </button>
                    <button
                      onClick={() => removeItem(idx)}
                      className="flex items-center justify-center gap-1 px-4 py-2 text-xs text-gray-500 hover:bg-gray-100 rounded-full transition-colors"
                      title="Rimuovi"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* History */}
      <div className="max-w-5xl mx-auto px-4 pb-10">
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <div className="flex items-center gap-2 mb-5">
            <History size={20} className="text-gray-700" />
            <h2 className="text-lg font-bold text-gray-900">Le mie prove virtuali</h2>
            <span className="text-sm text-gray-400">({history.length})</span>
          </div>

          {history.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Sparkles size={36} className="text-gray-300 mx-auto mb-3" />
              <p className="text-sm">
                Non hai ancora generato nessuna prova virtuale.<br />
                Usa il pulsante <span className="font-semibold">Prova</span> sui prodotti del carrello per iniziare.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {history.map(entry => (
                <div
                  key={entry.id}
                  className="group relative rounded-xl overflow-hidden border border-gray-200 hover:shadow-md transition-shadow"
                >
                  <div className="aspect-[3/4] bg-gray-100">
                    <img
                      src={entry.resultImage}
                      alt={entry.productName}
                      loading="lazy"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-3 text-white">
                    <p className="text-xs font-semibold line-clamp-2">{entry.productName}</p>
                    <p className="text-[10px] text-white/70 mt-0.5">
                      {new Date(entry.createdAt).toLocaleDateString('it-IT', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </p>
                  </div>
                  <div className="absolute top-2 right-2 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => downloadImage(entry.resultImage, `celio-tryon-${entry.id}.jpg`)}
                      className="bg-white/90 hover:bg-white text-gray-700 p-1.5 rounded-full shadow"
                      title="Scarica"
                    >
                      <Download size={14} />
                    </button>
                    <button
                      onClick={() => deleteHistoryEntry(entry.id)}
                      className="bg-white/90 hover:bg-red-500 hover:text-white text-gray-700 p-1.5 rounded-full shadow transition-colors"
                      title="Elimina"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {tryOn && (
        <VirtualTryOn
          isOpen={true}
          onClose={() => setTryOn(null)}
          productImage={tryOn.image || ''}
          productName={tryOn.name}
          productId={tryOn.productId}
          onGenerated={loadHistory}
        />
      )}

      <CelioFooter />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
// Login / Register form (logged out)
// ─────────────────────────────────────────────────────────────────────

function CustomerAuthForm({ onAuthenticated }: { onAuthenticated: (u: AuthUser) => void }) {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);

  const [form, setForm] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    phone: '',
  });

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      setError('La foto deve essere inferiore a 10MB');
      return;
    }
    setPhotoFile(file);
    const reader = new FileReader();
    reader.onload = () => setPhotoPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (mode === 'register') {
        const regRes = await fetch('/api/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: form.email,
            password: form.password,
            firstName: form.firstName,
            lastName: form.lastName,
            phone: form.phone,
            username: form.email,
          }),
        });
        const regData = await regRes.json();
        if (!regRes.ok) throw new Error(regData.error || 'Registrazione fallita');

        let profilePhoto: string | null = null;
        if (photoFile) {
          const formData = new FormData();
          formData.append('photo', photoFile);
          formData.append('userId', regData.id.toString());
          const photoRes = await fetch('/api/customer/upload-photo', {
            method: 'POST',
            body: formData,
          });
          const photoData = await photoRes.json();
          if (photoRes.ok) profilePhoto = photoData.profilePhoto;
        }

        const authUser: AuthUser = {
          id: regData.id,
          email: regData.email,
          firstName: regData.firstName,
          lastName: regData.lastName,
          profilePhoto,
        };
        localStorage.setItem('customerAuth', JSON.stringify(authUser));
        onAuthenticated(authUser);
      } else {
        const res = await fetch('/api/customer/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: form.email, password: form.password }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Login fallito');

        localStorage.setItem('customerAuth', JSON.stringify(data.user));
        onAuthenticated(data.user);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="max-w-md mx-auto px-4 py-12">
        <div className="bg-white rounded-2xl shadow-lg p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gray-900 rounded-full flex items-center justify-center mx-auto mb-4">
              <User className="text-white" size={28} />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">
              {mode === 'login' ? 'Accedi' : 'Crea Account'}
            </h1>
            <p className="text-gray-500 text-sm mt-1">
              {mode === 'login'
                ? 'Accedi per provare i vestiti virtualmente'
                : 'Registrati e carica la tua foto per la prova virtuale'}
            </p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'register' && (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Nome</label>
                    <input
                      type="text"
                      required
                      value={form.firstName}
                      onChange={e => setForm({ ...form, firstName: e.target.value })}
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                      placeholder="Mario"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Cognome</label>
                    <input
                      type="text"
                      required
                      value={form.lastName}
                      onChange={e => setForm({ ...form, lastName: e.target.value })}
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                      placeholder="Rossi"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Telefono</label>
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={e => setForm({ ...form, phone: e.target.value })}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                    placeholder="+39 333 1234567"
                  />
                </div>
              </>
            )}

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Email</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="email"
                  required
                  value={form.email}
                  onChange={e => setForm({ ...form, email: e.target.value })}
                  className="w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                  placeholder="email@esempio.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Password</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={6}
                  value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })}
                  className="w-full pl-10 pr-10 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                  placeholder="Minimo 6 caratteri"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Photo Upload - Register only */}
            {mode === 'register' && (
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-2">
                  Foto Corpo Intero <span className="text-red-500">*</span>
                </label>
                <p className="text-xs text-gray-500 mb-2">
                  Carica una foto a corpo intero per la prova virtuale dei vestiti con AI
                </p>
                <div className="border-2 border-dashed border-gray-300 rounded-xl p-4 text-center hover:border-gray-400 transition-colors">
                  {photoPreview ? (
                    <div className="relative">
                      <img
                        src={photoPreview}
                        alt="Preview"
                        className="max-h-64 mx-auto rounded-lg object-contain"
                      />
                      <button
                        type="button"
                        onClick={() => { setPhotoPreview(null); setPhotoFile(null); }}
                        className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                      >
                        <span className="text-xs px-1">X</span>
                      </button>
                    </div>
                  ) : (
                    <label className="cursor-pointer block">
                      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                        <Camera size={24} className="text-gray-400" />
                      </div>
                      <p className="text-sm font-medium text-gray-700">Clicca per caricare</p>
                      <p className="text-xs text-gray-400 mt-1">JPG, PNG - Max 10MB</p>
                      <p className="text-xs text-gray-400">Foto frontale a corpo intero</p>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handlePhotoChange}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || (mode === 'register' && !photoFile)}
              className="w-full py-3 bg-gray-900 text-white font-semibold rounded-lg hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  {mode === 'register' ? <Upload size={18} /> : <Lock size={18} />}
                  {mode === 'login' ? 'Accedi' : 'Registrati'}
                </>
              )}
            </button>
          </form>

          {/* Toggle */}
          <div className="mt-6 text-center text-sm">
            {mode === 'login' ? (
              <p className="text-gray-600">
                Non hai un account?{' '}
                <button
                  onClick={() => { setMode('register'); setError(''); }}
                  className="text-gray-900 font-semibold hover:underline"
                >
                  Registrati
                </button>
              </p>
            ) : (
              <p className="text-gray-600">
                Hai già un account?{' '}
                <button
                  onClick={() => { setMode('login'); setError(''); }}
                  className="text-gray-900 font-semibold hover:underline"
                >
                  Accedi
                </button>
              </p>
            )}
          </div>
        </div>
      </div>
      <CelioFooter />
    </div>
  );
}
