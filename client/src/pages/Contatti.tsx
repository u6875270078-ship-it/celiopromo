import React from 'react';
import { ChevronLeft, Mail, MapPin, Globe } from 'lucide-react';
import Header from '../components/Header';
import CelioFooter from '../components/CelioFooter';

export default function Contatti() {
  return (
    <div className="min-h-screen bg-white">
      <Header />

      <section className="bg-[#f5f3f0] py-12 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <a href="/" className="inline-flex items-center text-sm text-gray-500 hover:text-gray-900 mb-6">
            <ChevronLeft size={16} className="mr-1" />
            Indietro
          </a>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">Contattaci</h1>
          <p className="text-gray-600 max-w-lg mx-auto">
            Siamo qui per aiutarti. Scrivici per qualsiasi domanda su ordini, prodotti o servizio clienti.
          </p>
        </div>
      </section>

      <div className="max-w-3xl mx-auto px-4 py-10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center">
                <Mail size={20} className="text-blue-600" />
              </div>
              <h2 className="text-lg font-bold text-gray-900">Email</h2>
            </div>
            <p className="text-sm text-gray-600 mb-3">Servizio clienti generale:</p>
            <a href="mailto:info@celiopromo.it" className="text-blue-600 font-medium hover:underline">info@celiopromo.it</a>
            <p className="text-sm text-gray-600 mt-4 mb-3">Privacy e dati personali:</p>
            <a href="mailto:privacy@celiopromo.it" className="text-blue-600 font-medium hover:underline">privacy@celiopromo.it</a>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center">
                <MapPin size={20} className="text-green-600" />
              </div>
              <h2 className="text-lg font-bold text-gray-900">Negozi</h2>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Visita uno dei nostri punti vendita in tutta Italia. Il nostro staff è a tua disposizione.
            </p>
            <a
              href="/negozi"
              className="inline-flex items-center gap-2 px-4 py-2 bg-gray-900 text-white text-sm font-semibold rounded-lg hover:bg-gray-700 transition-colors"
            >
              Trova un negozio
            </a>
          </div>
        </div>

        <div className="bg-[#f5f3f0] border border-gray-200 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center">
              <Globe size={20} className="text-gray-700" />
            </div>
            <h2 className="text-lg font-bold text-gray-900">Tempi di risposta</h2>
          </div>
          <ul className="text-sm text-gray-700 space-y-2">
            <li>• Email: risposta entro 24-48 ore lavorative.</li>
            <li>• Richieste sul tuo ordine: indica sempre il numero d'ordine nell'oggetto.</li>
            <li>• Richieste relative alla privacy: risposta entro 30 giorni come previsto dal GDPR.</li>
          </ul>
        </div>
      </div>

      <CelioFooter />
    </div>
  );
}
