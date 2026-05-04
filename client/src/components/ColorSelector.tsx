import React from 'react';

interface ColorSelectorProps {
  selectedColors: string[];
  onColorChange: (colors: string[]) => void;
}

const AVAILABLE_COLORS = [
  { name: 'Nero', value: 'nero', color: '#000000' },
  { name: 'Bianco', value: 'bianco', color: '#FFFFFF' },
  { name: 'Grigio', value: 'grigio', color: '#808080' },
  { name: 'Blu', value: 'blu', color: '#0066CC' },
  { name: 'Blu Navy', value: 'blu-navy', color: '#001f3f' },
  { name: 'Azzurro', value: 'azzurro', color: '#87CEEB' },
  { name: 'Rosso', value: 'rosso', color: '#CC0000' },
  { name: 'Bordeaux', value: 'bordeaux', color: '#800020' },
  { name: 'Rosa', value: 'rosa', color: '#FF69B4' },
  { name: 'Verde', value: 'verde', color: '#228B22' },
  { name: 'Verde Scuro', value: 'verde-scuro', color: '#006400' },
  { name: 'Giallo', value: 'giallo', color: '#FFD700' },
  { name: 'Arancione', value: 'arancione', color: '#FF6600' },
  { name: 'Marrone', value: 'marrone', color: '#8B4513' },
  { name: 'Beige', value: 'beige', color: '#F5F5DC' },
  { name: 'Cammello', value: 'cammello', color: '#C19A6B' },
  { name: 'Kaki', value: 'kaki', color: '#8FBC8F' },
  { name: 'Denim', value: 'denim', color: '#6F8FAF' },
  { name: 'Viola', value: 'viola', color: '#8A2BE2' }
];

const ColorSelector: React.FC<ColorSelectorProps> = ({ selectedColors, onColorChange }) => {
  const toggleColor = (colorValue: string) => {
    const newColors = selectedColors.includes(colorValue)
      ? selectedColors.filter(c => c !== colorValue)
      : [...selectedColors, colorValue];
    onColorChange(newColors);
  };

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-3 md:grid-cols-4 gap-3">
        {AVAILABLE_COLORS.map((color) => (
          <button
            key={color.value}
            type="button"
            onClick={() => toggleColor(color.value)}
            className={`flex items-center space-x-2 px-3 py-2 rounded-md border text-sm font-medium transition-colors ${
              selectedColors.includes(color.value)
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
            }`}
          >
            <div 
              className="w-4 h-4 rounded-full border border-gray-300"
              style={{ backgroundColor: color.color }}
            />
            <span className="text-xs">{color.name}</span>
          </button>
        ))}
      </div>
      {selectedColors.length > 0 && (
        <div className="text-sm text-gray-600">
          Colori selezionati: {selectedColors.join(', ')}
        </div>
      )}
    </div>
  );
};

export default ColorSelector;