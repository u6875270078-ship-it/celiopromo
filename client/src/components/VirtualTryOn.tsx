import { useState, useEffect } from 'react';
import { X, Sparkles, Camera, Upload, Download, Loader2, AlertCircle } from 'lucide-react';

interface VirtualTryOnProps {
  isOpen: boolean;
  onClose: () => void;
  productImage: string;
  productName: string;
  productCategory?: string;
  productId?: number;
  onGenerated?: () => void;
}

export default function VirtualTryOn({ isOpen, onClose, productImage, productName, productCategory, productId, onGenerated }: VirtualTryOnProps) {
  const [userPhoto, setUserPhoto] = useState<string | null>(null);
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [progress, setProgress] = useState('');

  // Load saved profile photo on mount
  useEffect(() => {
    if (isOpen) {
      const auth = localStorage.getItem('customerAuth');
      if (auth) {
        const user = JSON.parse(auth);
        if (user.profilePhoto) {
          setUserPhoto(user.profilePhoto);
        }
      }
      setResultImage(null);
      setError('');
    }
  }, [isOpen]);

  const handleNewPhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      setError('La foto deve essere inferiore a 10MB');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setUserPhoto(reader.result as string);
      setResultImage(null);
      setError('');
    };
    reader.readAsDataURL(file);
  };

  // Determine garment category from product category
  const getGarmentCategory = () => {
    const cat = (productCategory || '').toLowerCase();
    if (cat.includes('pantal') || cat.includes('jeans') || cat.includes('short') || cat.includes('bermuda')) {
      return 'lower_body';
    }
    if (cat.includes('vestit') || cat.includes('abito') || cat.includes('dress') || cat.includes('tuta')) {
      return 'dresses';
    }
    return 'upper_body';
  };

  const handleTryOn = async () => {
    if (!userPhoto) {
      setError('Carica prima la tua foto a corpo intero');
      return;
    }
    setLoading(true);
    setError('');
    setProgress('Invio immagini all\'AI...');

    try {
      const auth = localStorage.getItem('customerAuth');
      const userId = auth ? JSON.parse(auth)?.id : null;

      const res = await fetch('/api/virtual-tryon', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userPhotoUrl: userPhoto,
          productImageUrl: productImage,
          garmentDescription: productName,
          category: getGarmentCategory(),
          userId,
          productId,
        }),
      });

      setProgress('Generazione in corso... (30-60 secondi)');
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Errore nella generazione');
      }

      setResultImage(data.resultImage);
      setProgress('');
      onGenerated?.();
    } catch (err: any) {
      setError(err.message || 'Errore nella prova virtuale');
      setProgress('');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (!resultImage) return;
    const link = document.createElement('a');
    link.href = resultImage;
    link.download = `celio-tryon-${productName.replace(/\s+/g, '-')}.png`;
    link.click();
  };

  if (!isOpen) return null;

  const isLoggedIn = !!localStorage.getItem('customerAuth');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <div className="flex items-center gap-2">
            <Sparkles size={20} className="text-purple-600" />
            <h2 className="text-lg font-bold text-gray-900">Prova Virtuale AI</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        {!isLoggedIn ? (
          /* Not logged in */
          <div className="p-8 text-center">
            <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Camera size={32} className="text-purple-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Accedi per provare</h3>
            <p className="text-gray-500 mb-6">
              Registrati e carica la tua foto a corpo intero per provare i vestiti virtualmente con l'intelligenza artificiale
            </p>
            <a
              href="/account"
              className="inline-flex items-center gap-2 px-6 py-3 bg-gray-900 text-white font-semibold rounded-lg hover:bg-gray-800 transition-colors"
            >
              Accedi / Registrati
            </a>
          </div>
        ) : (
          /* Main content */
          <div className="p-6">
            {error && (
              <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm">
                <AlertCircle size={16} />
                {error}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left: User photo */}
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-2">La tua foto</h3>
                <div className="border-2 border-dashed border-gray-300 rounded-xl overflow-hidden aspect-[3/4] bg-gray-50 relative">
                  {userPhoto ? (
                    <>
                      <img src={userPhoto} alt="La tua foto" className="w-full h-full object-contain" />
                      <label className="absolute bottom-3 right-3 bg-white shadow-md rounded-full p-2 cursor-pointer hover:bg-gray-50 transition-colors">
                        <Camera size={16} className="text-gray-600" />
                        <input type="file" accept="image/*" onChange={handleNewPhoto} className="hidden" />
                      </label>
                    </>
                  ) : (
                    <label className="flex flex-col items-center justify-center h-full cursor-pointer">
                      <Upload size={32} className="text-gray-400 mb-2" />
                      <p className="text-sm font-medium text-gray-600">Carica foto</p>
                      <p className="text-xs text-gray-400 mt-1">Corpo intero, frontale</p>
                      <input type="file" accept="image/*" onChange={handleNewPhoto} className="hidden" />
                    </label>
                  )}
                </div>
              </div>

              {/* Right: Result or product preview */}
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-2">
                  {resultImage ? 'Risultato' : 'Prodotto'}
                </h3>
                <div className="border border-gray-200 rounded-xl overflow-hidden aspect-[3/4] bg-gray-50 relative">
                  {resultImage ? (
                    <>
                      <img src={resultImage} alt="Risultato prova" className="w-full h-full object-contain" />
                      <button
                        onClick={handleDownload}
                        className="absolute bottom-3 right-3 bg-white shadow-md rounded-full p-2 hover:bg-gray-50 transition-colors"
                      >
                        <Download size={16} className="text-gray-600" />
                      </button>
                    </>
                  ) : (
                    <img src={productImage} alt={productName} className="w-full h-full object-contain" />
                  )}
                </div>
              </div>
            </div>

            {/* Action button */}
            <div className="mt-6">
              {loading ? (
                <div className="text-center py-4">
                  <Loader2 size={32} className="animate-spin text-purple-600 mx-auto mb-2" />
                  <p className="text-sm font-medium text-gray-700">{progress}</p>
                  <p className="text-xs text-gray-400 mt-1">L'AI sta generando la tua prova virtuale...</p>
                </div>
              ) : (
                <button
                  onClick={handleTryOn}
                  disabled={!userPhoto}
                  className="w-full py-3.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-semibold rounded-xl hover:from-purple-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 shadow-lg"
                >
                  <Sparkles size={18} />
                  {resultImage ? 'Riprova con nuova foto' : 'Prova questo capo'}
                </button>
              )}
            </div>

            <p className="text-xs text-gray-400 text-center mt-3">
              Powered by AI - Il risultato è un'anteprima indicativa
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
