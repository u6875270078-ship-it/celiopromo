import React, { useState, useEffect } from 'react';
import { MapPin, Phone, Mail, Navigation, ChevronLeft } from 'lucide-react';
import Header from '../components/Header';
import CelioFooter from '../components/CelioFooter';

interface Store {
  id: number;
  name: string;
  city: string;
  address: string;
  phone: string | null;
  email: string | null;
  image: string | null;
  mapQuery: string | null;
  isActive: boolean | null;
}

const FALLBACK_STORES: Store[] = [
  { id: 1, name: 'Biella', city: 'BIELLA', address: 'Via San Filippo 3, BIELLA', phone: '30000000', email: 'biella@dsimmoretail.it', image: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=600&h=400&fit=crop', mapQuery: 'Via+San+Filippo+3,+Biella,+Italy', isActive: true },
  { id: 2, name: 'Centro Commerciale Fiordaliso', city: 'Milano', address: 'Via Eugenio Curiel, 25, 20089 Rozzano MI, Milano', phone: '0257503946', email: 'celiorozzano@dsimmoretail.it', image: 'https://images.unsplash.com/photo-1567449303078-57ad995bd17f?w=600&h=400&fit=crop', mapQuery: 'Centro+Commerciale+Fiordaliso,+Rozzano,+Milano,+Italy', isActive: true },
  { id: 3, name: 'Carosello - Centro Commerciale', city: 'Milano', address: 'SP208 km2 Carugate (Mi) 20061, Milano', phone: '0292151878', email: 'Carosello@dsimmoretail.it', image: 'https://images.unsplash.com/photo-1555529669-e69e7aa0ba9a?w=600&h=400&fit=crop', mapQuery: 'Centro+Commerciale+Carosello,+Carugate,+Milano,+Italy', isActive: true },
  { id: 4, name: 'Centro commerciale Giotto', city: 'Padova', address: 'Via Venezia 59/61, 35129, Padova', phone: '0497811035', email: 'celiopadova@dsimmoretail.it', image: 'https://images.unsplash.com/photo-1604719312566-8912e9227c6a?w=600&h=400&fit=crop', mapQuery: 'Centro+Commerciale+Giotto,+Padova,+Italy', isActive: true },
  { id: 5, name: 'Centro Commerciale ADIGEO', city: 'Verona', address: 'Viale delle nazioni 1, 37135, Verona', phone: '045585709', email: 'celioadigeo@dsimmoretail.it', image: 'https://images.unsplash.com/photo-1582037928769-181f2644ecb7?w=600&h=400&fit=crop', mapQuery: 'Centro+Commerciale+Adigeo,+Verona,+Italy', isActive: true },
  { id: 6, name: "CELIO GRAND'AFFI SHOPPING CENTER", city: 'Verona', address: 'via Giovanni Pascoli, 37010 Affi, Verona', phone: '045626453', email: 'celioaffi@dsimmoretail.it', image: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=600&h=400&fit=crop', mapQuery: 'Grand+Affi+Shopping+Center,+Affi,+Verona,+Italy', isActive: true },
  { id: 7, name: 'Centro Commerciale La GrandeMela Shoppingland', city: 'Verona', address: 'Via Trentino, 1, Verona', phone: '0456090367', email: 'celiomela@dsimmoretail.it', image: 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=600&h=400&fit=crop', mapQuery: 'Centro+Commerciale+La+Grande+Mela,+Verona,+Italy', isActive: true },
  { id: 8, name: 'Centro Commerciale Thiene', city: 'Vicenza', address: 'Via del Terziario, 2, Vicenza', phone: '0445372507', email: 'celiothiene@dsimmoretail.it', image: 'https://images.unsplash.com/photo-1528698827591-e19cef791f48?w=600&h=400&fit=crop', mapQuery: 'Centro+Commerciale+Thiene,+Vicenza,+Italy', isActive: true },
];

export default function Stores() {
  const [allStores, setAllStores] = useState<Store[]>([]);
  const [activeCity, setActiveCity] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/stores')
      .then(r => r.json())
      .then(data => {
        const list = Array.isArray(data) && data.length > 0 ? data : FALLBACK_STORES;
        setAllStores(list.filter((s: Store) => s.isActive !== false));
      })
      .catch(() => setAllStores(FALLBACK_STORES))
      .finally(() => setLoading(false));
  }, []);

  const filtered = activeCity
    ? allStores.filter(s => s.city === activeCity)
    : allStores;

  const cities = Array.from(new Set(allStores.map(s => s.city)));
  const cityCounts: Record<string, number> = {};
  allStores.forEach(s => { cityCounts[s.city] = (cityCounts[s.city] || 0) + 1; });

  return (
    <div className="min-h-screen bg-white">
      <Header />

      {/* Hero */}
      <section className="bg-[#f5f3f0] py-12 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <a href="/" className="inline-flex items-center text-sm text-gray-500 hover:text-gray-900 mb-6">
            <ChevronLeft size={16} className="mr-1" />
            Indietro
          </a>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">I Nostri Negozi</h1>
          <h2 className="text-lg md:text-xl font-semibold text-gray-700 mb-2">Dove siamo</h2>
          <p className="text-gray-600 max-w-lg mx-auto">
            Scopri l'eleganza italiana nei nostri punti vendita. Il nostro staff è pronto ad accoglierti.
          </p>
        </div>
      </section>

      {/* City filter tabs */}
      <div className="border-b border-gray-200 bg-white sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 py-3 flex gap-2 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveCity(null)}
            className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              activeCity === null
                ? 'bg-gray-900 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Tutti ({allStores.length})
          </button>
          {cities.map(city => (
            <button
              key={city}
              onClick={() => setActiveCity(city === activeCity ? null : city)}
              className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                activeCity === city
                  ? 'bg-gray-900 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {city} ({cityCounts[city]})
            </button>
          ))}
        </div>
      </div>

      {/* Store cards grid */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        {loading ? (
          <div className="text-center py-12 text-gray-500">Caricamento negozi...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map(store => (
              <div
                key={store.id}
                className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow"
              >
                {/* Store image with city badge */}
                <div className="relative h-48 overflow-hidden bg-gray-100">
                  {store.image ? (
                    <img
                      src={store.image}
                      alt={store.name}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm">
                      Foto non disponibile
                    </div>
                  )}
                  <span className="absolute top-3 right-3 bg-gray-900 text-white text-xs font-semibold px-3 py-1 rounded-full uppercase tracking-wide">
                    {store.city}
                  </span>
                </div>

                {/* Map embed */}
                {store.mapQuery && (
                  <div className="h-48 bg-gray-100">
                    <iframe
                      title={`Mappa ${store.name}`}
                      width="100%"
                      height="100%"
                      style={{ border: 0 }}
                      loading="lazy"
                      referrerPolicy="no-referrer-when-downgrade"
                      src={`https://maps.google.com/maps?q=${store.mapQuery}&output=embed&z=15`}
                    />
                  </div>
                )}

                {/* Store info */}
                <div className="p-5">
                  <h3 className="text-lg font-bold text-gray-900 mb-3 leading-tight">{store.name}</h3>

                  <div className="space-y-2 text-sm text-gray-600 mb-4">
                    <div className="flex items-start gap-2">
                      <MapPin size={16} className="text-red-500 flex-shrink-0 mt-0.5" />
                      <span>{store.address}</span>
                    </div>
                    {store.phone && (
                      <div className="flex items-center gap-2">
                        <Phone size={16} className="text-gray-400 flex-shrink-0" />
                        <a href={`tel:${store.phone}`} className="hover:text-gray-900">{store.phone}</a>
                      </div>
                    )}
                    {store.email && (
                      <div className="flex items-center gap-2">
                        <Mail size={16} className="text-gray-400 flex-shrink-0" />
                        <a href={`mailto:${store.email}`} className="hover:text-gray-900 break-all">{store.email}</a>
                      </div>
                    )}
                  </div>

                  {/* Directions button */}
                  {store.mapQuery && (
                    <a
                      href={`https://www.google.com/maps/dir/?api=1&destination=${store.mapQuery}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 w-full py-3 border border-gray-900 text-gray-900 font-semibold text-sm rounded-lg hover:bg-gray-900 hover:text-white transition-colors uppercase tracking-wide"
                    >
                      <Navigation size={16} />
                      Indicazioni Stradali
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <CelioFooter />
    </div>
  );
}
