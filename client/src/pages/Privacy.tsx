import React from 'react';
import { ChevronLeft } from 'lucide-react';
import Header from '../components/Header';
import CelioFooter from '../components/CelioFooter';

export default function Privacy() {
  return (
    <div className="min-h-screen bg-white">
      <Header />

      <section className="bg-[#f5f3f0] py-10 px-4 border-b border-gray-200">
        <div className="max-w-3xl mx-auto">
          <a href="/" className="inline-flex items-center text-sm text-gray-500 hover:text-gray-900 mb-4">
            <ChevronLeft size={16} className="mr-1" />
            Indietro
          </a>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">Informativa sulla Privacy</h1>
          <p className="text-sm text-gray-500">Ultimo aggiornamento: 4 maggio 2026</p>
        </div>
      </section>

      <article className="max-w-3xl mx-auto px-4 py-10 prose prose-sm md:prose-base">
        <p className="text-gray-700 leading-relaxed mb-6">
          La presente Informativa sulla Privacy descrive come Celio Promo (di seguito "noi", "nostro" o "il Servizio") raccoglie, utilizza e protegge i dati personali degli utenti che visitano il sito <strong>celiopromo.it</strong> o utilizzano la nostra applicazione mobile. Trattiamo i tuoi dati in conformità al Regolamento (UE) 2016/679 (GDPR) e alla normativa italiana applicabile.
        </p>

        <h2 className="text-xl font-bold text-gray-900 mt-8 mb-3">1. Titolare del trattamento</h2>
        <p className="text-gray-700 leading-relaxed mb-6">
          Il titolare del trattamento dei dati è Amine Mizouri, contattabile all'indirizzo email <a href="mailto:privacy@celiopromo.it" className="text-blue-600 hover:underline">privacy@celiopromo.it</a>.
        </p>

        <h2 className="text-xl font-bold text-gray-900 mt-8 mb-3">2. Dati personali raccolti</h2>
        <p className="text-gray-700 leading-relaxed mb-3">Raccogliamo i seguenti dati quando utilizzi il nostro Servizio:</p>
        <ul className="list-disc pl-6 text-gray-700 leading-relaxed mb-6 space-y-2">
          <li><strong>Dati di registrazione</strong>: nome, cognome, indirizzo email, password (cifrata).</li>
          <li><strong>Foto profilo</strong> (facoltativa): caricata dall'utente nel proprio account.</li>
          <li><strong>Dati di spedizione e fatturazione</strong>: indirizzo, città, CAP, paese, numero di telefono.</li>
          <li><strong>Dati di acquisto</strong>: prodotti ordinati, importi, metodi di pagamento, storico ordini.</li>
          <li><strong>Foto per la prova virtuale</strong>: le immagini caricate per la funzione "Prova Virtuale" sono inviate al servizio di intelligenza artificiale Replicate per generare l'anteprima del capo. Le immagini vengono salvate nello storico personale dell'utente solo se autenticato.</li>
          <li><strong>Dati di pagamento</strong>: gestiti direttamente da Stripe e PayPal. Non memorizziamo numeri di carta di credito sui nostri server.</li>
          <li><strong>Dati tecnici</strong>: indirizzo IP, tipo di browser, sistema operativo, log di accesso.</li>
        </ul>

        <h2 className="text-xl font-bold text-gray-900 mt-8 mb-3">3. Finalità del trattamento</h2>
        <p className="text-gray-700 leading-relaxed mb-3">I tuoi dati vengono trattati per:</p>
        <ul className="list-disc pl-6 text-gray-700 leading-relaxed mb-6 space-y-2">
          <li>Gestire il tuo account e l'autenticazione.</li>
          <li>Elaborare ordini, pagamenti, spedizioni e resi.</li>
          <li>Inviare conferme d'ordine e comunicazioni transazionali (tramite il servizio Resend).</li>
          <li>Fornire la funzione di prova virtuale (tramite Replicate).</li>
          <li>Adempiere agli obblighi di legge (fatturazione, IVA al 22%, conservazione documenti contabili).</li>
          <li>Migliorare il Servizio e analizzare le statistiche di utilizzo aggregate.</li>
        </ul>

        <h2 className="text-xl font-bold text-gray-900 mt-8 mb-3">4. Base giuridica</h2>
        <p className="text-gray-700 leading-relaxed mb-6">
          Il trattamento si basa sull'esecuzione del contratto di vendita (art. 6.1.b GDPR), sul consenso esplicito dell'utente per le funzioni opzionali come la prova virtuale (art. 6.1.a GDPR) e su obblighi di legge per i dati contabili (art. 6.1.c GDPR).
        </p>

        <h2 className="text-xl font-bold text-gray-900 mt-8 mb-3">5. Condivisione dei dati</h2>
        <p className="text-gray-700 leading-relaxed mb-3">I dati possono essere condivisi con i seguenti soggetti, esclusivamente per le finalità sopra indicate:</p>
        <ul className="list-disc pl-6 text-gray-700 leading-relaxed mb-6 space-y-2">
          <li><strong>Stripe, Inc.</strong> e <strong>PayPal Holdings, Inc.</strong> per l'elaborazione dei pagamenti.</li>
          <li><strong>Resend, Inc.</strong> per l'invio delle email transazionali.</li>
          <li><strong>Replicate, Inc.</strong> per la funzione di prova virtuale (le immagini caricate vengono trasmesse al modello AI e non utilizzate per addestramento).</li>
          <li><strong>Neon, Inc.</strong> per l'hosting del database (server in Unione Europea o Stati Uniti, con clausole contrattuali standard).</li>
          <li>Corrieri e spedizionieri per la consegna degli ordini.</li>
          <li>Autorità competenti, ove richiesto dalla legge.</li>
        </ul>
        <p className="text-gray-700 leading-relaxed mb-6">
          Non vendiamo, non affittiamo e non cediamo i tuoi dati personali a terzi per finalità di marketing.
        </p>

        <h2 className="text-xl font-bold text-gray-900 mt-8 mb-3">6. Trasferimenti extra-UE</h2>
        <p className="text-gray-700 leading-relaxed mb-6">
          Alcuni dei fornitori sopra menzionati hanno sede negli Stati Uniti. I trasferimenti avvengono nel rispetto delle Clausole Contrattuali Standard approvate dalla Commissione Europea o dell'EU-US Data Privacy Framework, ove applicabile.
        </p>

        <h2 className="text-xl font-bold text-gray-900 mt-8 mb-3">7. Conservazione dei dati</h2>
        <ul className="list-disc pl-6 text-gray-700 leading-relaxed mb-6 space-y-2">
          <li><strong>Account utente</strong>: conservati finché l'utente non richiede la cancellazione.</li>
          <li><strong>Ordini e fatture</strong>: 10 anni, come previsto dalla normativa fiscale italiana.</li>
          <li><strong>Foto della prova virtuale</strong>: conservate nello storico personale finché l'utente non le elimina.</li>
          <li><strong>Log tecnici</strong>: massimo 12 mesi.</li>
        </ul>

        <h2 className="text-xl font-bold text-gray-900 mt-8 mb-3">8. Diritti dell'utente</h2>
        <p className="text-gray-700 leading-relaxed mb-3">Hai il diritto di:</p>
        <ul className="list-disc pl-6 text-gray-700 leading-relaxed mb-6 space-y-2">
          <li>Accedere ai tuoi dati personali.</li>
          <li>Rettificare dati inesatti o incompleti.</li>
          <li>Richiedere la cancellazione dei tuoi dati ("diritto all'oblio").</li>
          <li>Limitare o opporti al trattamento.</li>
          <li>Ricevere i tuoi dati in formato strutturato (portabilità).</li>
          <li>Revocare in qualsiasi momento il consenso prestato.</li>
          <li>Proporre reclamo al Garante per la Protezione dei Dati Personali (<a href="https://www.garanteprivacy.it" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">www.garanteprivacy.it</a>).</li>
        </ul>
        <p className="text-gray-700 leading-relaxed mb-6">
          Per esercitare i tuoi diritti, scrivi a <a href="mailto:privacy@celiopromo.it" className="text-blue-600 hover:underline">privacy@celiopromo.it</a>. Risponderemo entro 30 giorni.
        </p>

        <h2 className="text-xl font-bold text-gray-900 mt-8 mb-3">9. Sicurezza</h2>
        <p className="text-gray-700 leading-relaxed mb-6">
          Adottiamo misure tecniche e organizzative adeguate (cifratura HTTPS, password con hash, accesso limitato al database) per proteggere i tuoi dati da accessi non autorizzati, perdita o divulgazione.
        </p>

        <h2 className="text-xl font-bold text-gray-900 mt-8 mb-3">10. Cookie</h2>
        <p className="text-gray-700 leading-relaxed mb-6">
          Il sito utilizza cookie tecnici essenziali per il funzionamento (sessione, carrello). Non utilizziamo cookie di profilazione di terze parti senza il tuo consenso esplicito.
        </p>

        <h2 className="text-xl font-bold text-gray-900 mt-8 mb-3">11. Minori</h2>
        <p className="text-gray-700 leading-relaxed mb-6">
          Il Servizio non è destinato a minori di 14 anni. Non raccogliamo consapevolmente dati di minori. Se vieni a conoscenza che un minore ci ha fornito dati senza consenso dei genitori, contattaci e provvederemo alla cancellazione.
        </p>

        <h2 className="text-xl font-bold text-gray-900 mt-8 mb-3">12. Modifiche all'informativa</h2>
        <p className="text-gray-700 leading-relaxed mb-6">
          Possiamo aggiornare questa informativa periodicamente. La data di "ultimo aggiornamento" in alto indica la versione vigente. Per modifiche sostanziali, ti informeremo via email o tramite avviso sull'app.
        </p>

        <h2 className="text-xl font-bold text-gray-900 mt-8 mb-3">13. Contatti</h2>
        <p className="text-gray-700 leading-relaxed mb-6">
          Per qualsiasi domanda relativa alla privacy, scrivi a <a href="mailto:privacy@celiopromo.it" className="text-blue-600 hover:underline">privacy@celiopromo.it</a>.
        </p>
      </article>

      <CelioFooter />
    </div>
  );
}
