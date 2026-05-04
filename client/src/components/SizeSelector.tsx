import React from 'react';

interface SizeSelectorProps {
  category: string;
  selectedSizes: string[];
  onSizeChange: (sizes: string[]) => void;
}

const SIZE_SYSTEMS = {
  // T-SHIRT / POLO / GIUBBOTTI / CAMICIE / PULLOVER / FELPE
  'Abbigliamento': ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
  'Camicie': ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
  
  // GIACCHE ABITO
  'Giacche': ['44', '46', '48', '50', '52', '54', '56', '58', '60'],
  
  // JEANS - PANT - BERMUDA (FR with IT/US equivalents)
  'Pantaloni': [
    'FR 36 (42 IT) - W 28 (US)',
    'FR 38 (44 IT) - W 30 (US)',
    'FR 40 (46 IT) - W 32 (US)',
    'FR 42 (48 IT) - W 33 (US)',
    'FR 44 (50 IT) - W 34 (US)',
    'FR 46 (52 IT) - W 36 (US)',
    'FR 48 (54 IT) - W 38 (US)',
    'FR 50 (56 IT) - W 40 (US)'
  ],
  
  // SCARPE
  'Scarpe': ['40', '41', '42', '43', '44', '45'],
  
  // ACCESSORI (various specific sizing)
  'Accessori': [
    'CALZE - Taglia Unica (40-45)',
    'BOXER - S, M, L, XL, XXL',
    'CINTURE - T1, T2, T3',
    'SCIARPE - Taglia Unica',
    'GUANTI - T1, T2',
    'CAPPELLI - Taglia Unica',
    'PIGIAMI - S, M, L, XL, XXL'
  ],
  
  // PROFUMI
  'Profumi': ['50ml', '100ml', '150ml', '200ml']
};

const SizeSelector: React.FC<SizeSelectorProps> = ({ category, selectedSizes, onSizeChange }) => {
  const availableSizes = SIZE_SYSTEMS[category as keyof typeof SIZE_SYSTEMS] || ['XS', 'S', 'M', 'L', 'XL', 'XXL'];

  const toggleSize = (size: string) => {
    const newSizes = selectedSizes.includes(size)
      ? selectedSizes.filter(s => s !== size)
      : [...selectedSizes, size];
    onSizeChange(newSizes);
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {availableSizes.map((size) => (
          <button
            key={size}
            type="button"
            onClick={() => toggleSize(size)}
            className={`px-3 py-1.5 rounded-md border text-sm font-medium transition-colors ${
              selectedSizes.includes(size)
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
            }`}
          >
            {size}
          </button>
        ))}
      </div>
      {selectedSizes.length > 0 && (
        <div className="text-sm text-gray-600">
          Taglie selezionate: {selectedSizes.join(', ')}
        </div>
      )}
    </div>
  );
};

export default SizeSelector;