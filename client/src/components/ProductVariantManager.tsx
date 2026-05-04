import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Trash2, Plus } from 'lucide-react';

interface ProductVariant {
  id: string;
  size: string;
  color: string;
  quantity: number;
}

interface ProductVariantManagerProps {
  category: string;
  variants: ProductVariant[];
  onVariantsChange: (variants: ProductVariant[]) => void;
}

// Size systems based on category
const SIZE_SYSTEMS = {
  'Abbigliamento': ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
  'Camicie': ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
  'Giacche': ['44', '46', '48', '50', '52', '54', '56', '58', '60'],
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
  'Scarpe': ['40', '41', '42', '43', '44', '45'],
  'Accessori': [
    'CALZE - Taglia Unica (40-45)',
    'BOXER - S, M, L, XL, XXL',
    'CINTURE - T1, T2, T3',
    'SCIARPE - Taglia Unica',
    'GUANTI - T1, T2',
    'CAPPELLI - Taglia Unica',
    'PIGIAMI - S, M, L, XL, XXL'
  ],
  'Profumi': ['50ml', '100ml', '150ml', '200ml']
};

const AVAILABLE_COLORS = [
  { name: 'Nero', value: 'nero' },
  { name: 'Bianco', value: 'bianco' },
  { name: 'Grigio', value: 'grigio' },
  { name: 'Blu', value: 'blu' },
  { name: 'Blu Navy', value: 'blu-navy' },
  { name: 'Azzurro', value: 'azzurro' },
  { name: 'Rosso', value: 'rosso' },
  { name: 'Bordeaux', value: 'bordeaux' },
  { name: 'Rosa', value: 'rosa' },
  { name: 'Verde', value: 'verde' },
  { name: 'Verde Scuro', value: 'verde-scuro' },
  { name: 'Giallo', value: 'giallo' },
  { name: 'Arancione', value: 'arancione' },
  { name: 'Marrone', value: 'marrone' },
  { name: 'Beige', value: 'beige' },
  { name: 'Cammello', value: 'cammello' },
  { name: 'Kaki', value: 'kaki' },
  { name: 'Denim', value: 'denim' },
  { name: 'Viola', value: 'viola' }
];

const ProductVariantManager: React.FC<ProductVariantManagerProps> = ({
  category,
  variants,
  onVariantsChange
}) => {
  const [newVariant, setNewVariant] = useState<Partial<ProductVariant>>({
    size: '',
    color: '',
    quantity: 1
  });

  const availableSizes = SIZE_SYSTEMS[category as keyof typeof SIZE_SYSTEMS] || ['XS', 'S', 'M', 'L', 'XL', 'XXL'];

  const addVariant = () => {
    if (!newVariant.size || !newVariant.color || !newVariant.quantity) {
      return;
    }

    // Check if this size/color combination already exists
    const existingVariant = variants.find(
      v => v.size === newVariant.size && v.color === newVariant.color
    );

    if (existingVariant) {
      // Update existing variant quantity
      const updatedVariants = variants.map(v =>
        v.id === existingVariant.id
          ? { ...v, quantity: v.quantity + (newVariant.quantity || 0) }
          : v
      );
      onVariantsChange(updatedVariants);
    } else {
      // Add new variant
      const variant: ProductVariant = {
        id: `${Date.now()}-${Math.random()}`,
        size: newVariant.size!,
        color: newVariant.color!,
        quantity: newVariant.quantity || 1
      };
      onVariantsChange([...variants, variant]);
    }

    // Reset form
    setNewVariant({ size: '', color: '', quantity: 1 });
  };

  const removeVariant = (id: string) => {
    onVariantsChange(variants.filter(v => v.id !== id));
  };

  const updateVariantQuantity = (id: string, quantity: number) => {
    if (quantity < 0) return;
    onVariantsChange(
      variants.map(v => v.id === id ? { ...v, quantity } : v)
    );
  };

  const getTotalQuantity = () => {
    return variants.reduce((total, variant) => total + variant.quantity, 0);
  };

  // Quick add all sizes for a color
  const addAllSizesForColor = (color: string, quantity: number = 1) => {
    const colorObj = AVAILABLE_COLORS.find(c => c.value === color);
    if (!colorObj) return;
    
    const newVariants = availableSizes.map(size => {
      const existingVariant = variants.find(v => v.size === size && v.color === color);
      if (existingVariant) return null; // Skip existing combinations
      
      return {
        id: `${Date.now()}-${Math.random()}-${size}`,
        size,
        color,
        quantity
      };
    }).filter(Boolean) as ProductVariant[];
    
    onVariantsChange([...variants, ...newVariants]);
  };

  return (
    <div className="space-y-4">
      <div className="border rounded-lg p-4 bg-gray-50">
        <h4 className="text-sm font-medium text-gray-900 mb-3">Gestione Varianti Prodotto</h4>
        
        {/* Quick Actions */}
        <div className="mb-4 p-3 bg-blue-50 rounded-md">
          <h5 className="text-xs font-medium text-blue-900 mb-2">🚀 Azioni Rapide</h5>
          <div className="flex flex-wrap gap-2">
            <select 
              onChange={(e) => {
                if (e.target.value) {
                  addAllSizesForColor(e.target.value, 10);
                  e.target.value = '';
                }
              }}
              className="text-xs px-2 py-1 border border-blue-300 rounded text-blue-700"
            >
              <option value="">Aggiungi tutte le taglie per un colore</option>
              {AVAILABLE_COLORS.map(color => (
                <option key={color.value} value={color.value}>
                  Tutte le taglie - {color.name}
                </option>
              ))}
            </select>
          </div>
        </div>
        
        <h6 className="text-xs font-medium text-gray-700 mb-2">Aggiungi Singola Variante</h6>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-3">
          <div>
            <label className="text-xs font-medium text-gray-700 mb-1 block">Taglia</label>
            <select
              value={newVariant.size || ''}
              onChange={(e) => setNewVariant({ ...newVariant, size: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-600"
            >
              <option value="">Seleziona taglia</option>
              {availableSizes.map(size => (
                <option key={size} value={size}>{size}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-medium text-gray-700 mb-1 block">Colore</label>
            <select
              value={newVariant.color || ''}
              onChange={(e) => setNewVariant({ ...newVariant, color: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-600"
            >
              <option value="">Seleziona colore</option>
              {AVAILABLE_COLORS.map(color => (
                <option key={color.value} value={color.value}>{color.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-medium text-gray-700 mb-1 block">Quantità</label>
            <Input
              type="number"
              min="1"
              value={newVariant.quantity || 1}
              onChange={(e) => setNewVariant({ ...newVariant, quantity: parseInt(e.target.value) || 1 })}
              className="text-sm"
            />
          </div>

          <div className="flex items-end">
            <Button 
              type="button" 
              onClick={addVariant}
              size="sm"
              className="w-full"
              disabled={!newVariant.size || !newVariant.color}
            >
              <Plus className="w-4 h-4 mr-1" />
              Aggiungi
            </Button>
          </div>
        </div>
      </div>

      {/* Display existing variants */}
      {variants.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium text-gray-900">Varianti Prodotto</h4>
            <span className="text-sm text-gray-600">Totale: {getTotalQuantity()} pezzi</span>
          </div>
          
          {/* Bulk Actions */}
          {variants.length > 3 && (
            <div className="mb-3 p-2 bg-yellow-50 rounded-md border border-yellow-200">
              <div className="flex items-center gap-3 text-sm">
                <span className="text-yellow-800 font-medium">Operazioni in massa:</span>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    const newQuantity = prompt('Imposta la stessa quantità per tutte le varianti:', '10');
                    if (newQuantity && !isNaN(parseInt(newQuantity))) {
                      onVariantsChange(variants.map(v => ({ ...v, quantity: parseInt(newQuantity) })));
                    }
                  }}
                  className="text-xs px-2 py-1 h-6"
                >
                  Imposta quantità uguale
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    if (confirm(`Sei sicuro di voler eliminare tutte le ${variants.length} varianti?`)) {
                      onVariantsChange([]);
                    }
                  }}
                  className="text-xs px-2 py-1 h-6 text-red-600 border-red-300"
                >
                  Elimina tutte
                </Button>
              </div>
            </div>
          )}
          
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {variants.map((variant, index) => {
              const colorName = AVAILABLE_COLORS.find(c => c.value === variant.color)?.name || variant.color;
              return (
                <div key={`${variant.id}-${variant.size}-${variant.color}`} className="flex items-center justify-between bg-white border rounded-lg p-3 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center space-x-3">
                    <div className="bg-gray-100 text-gray-600 text-xs font-mono px-2 py-1 rounded">
                      #{index + 1}
                    </div>
                    <div className="text-sm">
                      <span className="font-medium bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs mr-2">
                        {variant.size}
                      </span>
                      <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs">
                        {colorName}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <div className="text-xs text-gray-500">Qnt:</div>
                    <Input
                      type="number"
                      min="0"
                      value={variant.quantity}
                      onChange={(e) => updateVariantQuantity(variant.id, parseInt(e.target.value) || 0)}
                      className="w-16 text-sm text-center"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => removeVariant(variant.id)}
                      className="text-red-600 hover:text-red-800 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductVariantManager;