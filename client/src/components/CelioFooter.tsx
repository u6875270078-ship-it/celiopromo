import beNormalLogo from '@assets/download_1756829622690.png';

const CelioFooter = () => (
  <div className="bg-white border-t border-gray-200 pt-16">
    <div className="max-w-6xl mx-auto px-4">
      <div className="text-center mb-12">
        <img
          src={beNormalLogo}
          alt="Celio - be normal"
          className="h-24 md:h-32 mx-auto"
        />
      </div>

      <div className="text-center mb-8">
        <p className="text-sm text-gray-600 mb-4">Iscriviti alla newsletter celio be normal.</p>
        <div className="flex max-w-md mx-auto">
          <input
            type="email"
            placeholder="Indirizzo email"
            className="flex-1 px-4 py-2 border border-gray-300 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-gray-300"
          />
          <button className="bg-gray-900 text-white px-6 py-2 rounded-r-lg hover:bg-gray-800">
            →
          </button>
        </div>
      </div>

      <div className="border-t border-gray-200 pt-6 pb-8 text-center text-xs text-gray-500 space-y-1">
        <p className="font-medium text-gray-700">DS IMMO SRL</p>
        <p>Via San Filippo 13, 13900 Biella (BI), Italia</p>
        <p>
          <a href="/privacy" className="hover:text-gray-900 underline underline-offset-2">Privacy</a>
          <span className="mx-2">·</span>
          <a href="/contatti" className="hover:text-gray-900 underline underline-offset-2">Contatti</a>
        </p>
        <p>© 2026 DS IMMO SRL. Tutti i diritti riservati.</p>
      </div>
    </div>
  </div>
);

export default CelioFooter;