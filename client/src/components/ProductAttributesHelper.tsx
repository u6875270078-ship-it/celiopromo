import React, { useState } from 'react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { X, Palette, Ruler, Package } from 'lucide-react';

interface ProductAttributesHelperProps {
  onApplyTemplate: (variants: any[]) => void;
  category: string;
}

const PRODUCT_TEMPLATES = {
  'T-shirt': {
    icon: <Package className="w-4 h-4" />,
    name: 'T-shirt Base',
    colors: ['nero', 'bianco', 'grigio', 'blu-navy'],
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    defaultQuantity: 15
  },
  'Camicie': {
    icon: <Package className="w-4 h-4" />,
    name: 'Camicia Classica',
    colors: ['bianco', 'azzurro', 'grigio', 'nero'],
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    defaultQuantity: 12
  },
  'Pantaloni': {
    icon: <Ruler className="w-4 h-4" />,
    name: 'Pantaloni Standard',
    colors: ['nero', 'blu-navy', 'grigio', 'beige'],
    sizes: ['FR 38 (44 IT) - W 30 (US)', 'FR 40 (46 IT) - W 32 (US)', 'FR 42 (48 IT) - W 33 (US)', 'FR 44 (50 IT) - W 34 (US)'],
    defaultQuantity: 8
  },
  'Jeans': {
    icon: <Ruler className="w-4 h-4" />,
    name: 'Jeans Collection',
    colors: ['denim', 'nero', 'grigio'],
    sizes: ['FR 38 (44 IT) - W 30 (US)', 'FR 40 (46 IT) - W 32 (US)', 'FR 42 (48 IT) - W 33 (US)', 'FR 44 (50 IT) - W 34 (US)'],
    defaultQuantity: 10
  },
  'Scarpe': {
    icon: <Package className="w-4 h-4" />,
    name: 'Scarpe Standard',
    colors: ['nero', 'marrone', 'bianco'],
    sizes: ['40', '41', '42', '43', '44', '45'],
    defaultQuantity: 5
  }
};

const COLOR_NAMES = {
  'nero': 'Nero',
  'bianco': 'Bianco', 
  'grigio': 'Grigio',
  'blu': 'Blu',
  'blu-navy': 'Blu Navy',
  'azzurro': 'Azzurro',
  'denim': 'Denim',
  'marrone': 'Marrone',
  'beige': 'Beige'
};

const ProductAttributesHelper: React.FC<ProductAttributesHelperProps> = ({ 
  onApplyTemplate,
  category 
}) => {
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  
  const getRelevantTemplates = () => {
    return Object.entries(PRODUCT_TEMPLATES).filter(([key]) => {
      if (category.toLowerCase().includes(key.toLowerCase()) || 
          key.toLowerCase().includes(category.toLowerCase())) {
        return true;
      }
      return false;
    });
  };

  const applyTemplate = (templateKey: string) => {
    const template = PRODUCT_TEMPLATES[templateKey as keyof typeof PRODUCT_TEMPLATES];
    if (!template) return;

    const variants = [];
    let variantId = 1;

    for (const size of template.sizes) {
      for (const color of template.colors) {
        variants.push({
          id: `template-${variantId++}-${Date.now()}`,
          size,
          color,
          quantity: template.defaultQuantity
        });
      }
    }

    onApplyTemplate(variants);
    setSelectedTemplate(templateKey);
  };

  const relevantTemplates = getRelevantTemplates();
  const allTemplates = Object.entries(PRODUCT_TEMPLATES);

  return (
    <div className="space-y-4">
      <div className="border rounded-lg p-4 bg-gradient-to-r from-purple-50 to-pink-50">
        <div className="flex items-center gap-2 mb-3">
          <Palette className="w-5 h-5 text-purple-600" />
          <h4 className="text-sm font-medium text-purple-900">🎨 Template Prodotti</h4>
        </div>
        <p className="text-xs text-purple-700 mb-3">
          Usa i template per creare rapidamente tutte le varianti di un prodotto tipico
        </p>

        {/* Relevant Templates */}
        {relevantTemplates.length > 0 && (
          <div className="mb-4">
            <h5 className="text-xs font-medium text-purple-800 mb-2">
              📍 Consigliati per "{category}":
            </h5>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {relevantTemplates.map(([key, template]) => (
                <button
                  key={key}
                  onClick={() => applyTemplate(key)}
                  className="flex items-center gap-2 p-3 bg-white border border-purple-200 rounded-lg hover:border-purple-400 hover:bg-purple-50 transition-colors text-left"
                >
                  {template.icon}
                  <div>
                    <div className="text-sm font-medium text-purple-900">{template.name}</div>
                    <div className="text-xs text-purple-600">
                      {template.colors.length} colori × {template.sizes.length} taglie = {template.colors.length * template.sizes.length} varianti
                    </div>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {template.colors.slice(0, 3).map(color => (
                        <Badge key={color} variant="secondary" className="text-xs px-1 py-0">
                          {COLOR_NAMES[color as keyof typeof COLOR_NAMES] || color}
                        </Badge>
                      ))}
                      {template.colors.length > 3 && (
                        <span className="text-xs text-purple-500">+{template.colors.length - 3}</span>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* All Templates */}
        <details className="group">
          <summary className="text-xs text-purple-700 cursor-pointer hover:text-purple-900 mb-2">
            ▶️ Altri template disponibili ({allTemplates.length - relevantTemplates.length})
          </summary>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mt-2">
            {allTemplates.filter(([key]) => !relevantTemplates.find(([rKey]) => rKey === key)).map(([key, template]) => (
              <button
                key={key}
                onClick={() => applyTemplate(key)}
                className="flex items-center gap-2 p-2 bg-white border border-gray-200 rounded-md hover:border-purple-300 hover:bg-purple-25 transition-colors text-left"
              >
                {template.icon}
                <div>
                  <div className="text-xs font-medium text-gray-900">{template.name}</div>
                  <div className="text-xs text-gray-500">
                    {template.colors.length * template.sizes.length} varianti
                  </div>
                </div>
              </button>
            ))}
          </div>
        </details>

        {selectedTemplate && (
          <div className="mt-3 p-2 bg-green-50 border border-green-200 rounded-md">
            <div className="flex items-center justify-between">
              <span className="text-xs text-green-800">
                ✅ Template "{PRODUCT_TEMPLATES[selectedTemplate as keyof typeof PRODUCT_TEMPLATES].name}" applicato con successo!
              </span>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => setSelectedTemplate(null)}
                className="h-6 w-6 p-0"
              >
                <X className="w-3 h-3" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductAttributesHelper;