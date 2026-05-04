import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Ruler, Info } from 'lucide-react';

interface SizeChartProps {
  category: string;
  currentSize?: string;
  onSizeSelect?: (size: string) => void;
}

// Size chart data based on your specifications
const sizeCharts = {
  // T-SHIRT / POLO / GIUBBOTTI / CAMICIE / PULLOVER / FELPE
  'clothing': {
    title: 'Guida alle taglie - Abbigliamento',
    sizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
    measurements: {
      'XS': { chest: '86-89', length: '66' },
      'S': { chest: '90-93', length: '68' },
      'M': { chest: '94-97', length: '70' },
      'L': { chest: '98-101', length: '72' },
      'XL': { chest: '102-105', length: '74' },
      'XXL': { chest: '106-109', length: '76' }
    },
    promotions: []
  },
  
  // GIACCHE ABITO
  'giacche': {
    title: 'Guida alle taglie - Giacche',
    sizes: ['44', '46', '48', '50', '52', '54', '56', '58', '60'],
    measurements: {
      '44': { chest: '88', waist: '76' },
      '46': { chest: '92', waist: '80' },
      '48': { chest: '96', waist: '84' },
      '50': { chest: '100', waist: '88' },
      '52': { chest: '104', waist: '92' },
      '54': { chest: '108', waist: '96' },
      '56': { chest: '112', waist: '100' },
      '58': { chest: '116', waist: '104' },
      '60': { chest: '120', waist: '108' }
    },
    promotions: []
  },

  // JEANS - PANT - BERMUDA
  'pantaloni': {
    title: 'Guida alle taglie - Pantaloni',
    sizes: ['36', '38', '40', '42', '44', '46', '48', '50'],
    measurements: {
      '36': { fr: '36', it: '42', us: 'W 28', waist: '76' },
      '38': { fr: '38', it: '44', us: 'W 30', waist: '80' },
      '40': { fr: '40', it: '46', us: 'W 32', waist: '84' },
      '42': { fr: '42', it: '48', us: 'W 33', waist: '88' },
      '44': { fr: '44', it: '50', us: 'W 34', waist: '92' },
      '46': { fr: '46', it: '52', us: 'W 36', waist: '96' },
      '48': { fr: '48', it: '54', us: 'W 38', waist: '100' },
      '50': { fr: '50', it: '56', us: 'W 40', waist: '104' }
    },
    promotions: []
  },

  // PANTALONI TUTA e ALCUNI BERMUDA
  'tuta': {
    title: 'Guida alle taglie - Pantaloni Tuta',
    sizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
    measurements: {
      'XS': { waist: '76-79', length: '101' },
      'S': { waist: '80-83', length: '103' },
      'M': { waist: '84-87', length: '105' },
      'L': { waist: '88-91', length: '107' },
      'XL': { waist: '92-95', length: '109' },
      'XXL': { waist: '96-99', length: '111' }
    },
    promotions: []
  },

  // ACCESSORI
  'accessori': {
    title: 'Guida alle taglie - Accessori',
    sizes: ['T1', 'T2', 'T3', 'TU', 'S', 'M', 'L', 'XL', 'XXL'],
    measurements: {},
    promotions: [
      { type: 'CALZE', sizes: ['TAGLIA UNICA (40-45)'], price: '' },
      { type: 'BOXER', sizes: ['S', 'M', 'L', 'XL', 'XXL'], price: '' }
    ]
  },

  // SCARPE
  'scarpe': {
    title: 'Guida alle taglie - Scarpe',
    sizes: ['40', '41', '42', '43', '44', '45'],
    measurements: {
      '40': { length: '25.5' },
      '41': { length: '26.0' },
      '42': { length: '26.5' },
      '43': { length: '27.0' },
      '44': { length: '27.5' },
      '45': { length: '28.0' }
    },
    promotions: []
  }
};

export default function SizeChart({ category, currentSize, onSizeSelect }: SizeChartProps) {
  const [isOpen, setIsOpen] = useState(false);
  
  const chartData = sizeCharts[category as keyof typeof sizeCharts] || sizeCharts.clothing;

  const handleSizeClick = (size: string) => {
    onSizeSelect?.(size);
    setIsOpen(false);
  };

  return (
    <div className="space-y-4">
      {/* Size Selection */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <label className="text-sm font-medium text-gray-900">
            Taglia
          </label>
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button variant="ghost" size="sm" className="text-xs text-gray-600 hover:text-gray-900" data-testid="button-size-chart">
                <Ruler className="w-3 h-3 mr-1" />
                Guida alle taglie
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{chartData.title}</DialogTitle>
              </DialogHeader>
              
              <div className="space-y-6">
                {/* Promotions */}
                {chartData.promotions.length > 0 && (
                  <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                    <h4 className="font-medium text-orange-900 mb-2 flex items-center">
                      <span className="mr-2">🎯</span>
                      Promozioni Speciali
                    </h4>
                    {chartData.promotions.map((promo, index) => (
                      <div key={index} className="text-sm text-orange-800">
                        <strong>{promo.type}:</strong> {promo.sizes.join(', ')} - <span className="font-bold">{promo.price}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Size Chart Table */}
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse border border-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="border border-gray-200 px-4 py-2 text-left">Taglia</th>
                        {category === 'pantaloni' && (
                          <>
                            <th className="border border-gray-200 px-4 py-2 text-center">FR</th>
                            <th className="border border-gray-200 px-4 py-2 text-center">IT</th>
                            <th className="border border-gray-200 px-4 py-2 text-center">US</th>
                            <th className="border border-gray-200 px-4 py-2 text-center">Vita (cm)</th>
                          </>
                        )}
                        {category === 'giacche' && (
                          <>
                            <th className="border border-gray-200 px-4 py-2 text-center">Petto (cm)</th>
                            <th className="border border-gray-200 px-4 py-2 text-center">Vita (cm)</th>
                          </>
                        )}
                        {(category === 'clothing' || category === 'tuta') && (
                          <>
                            <th className="border border-gray-200 px-4 py-2 text-center">Petto/Vita (cm)</th>
                            <th className="border border-gray-200 px-4 py-2 text-center">Lunghezza (cm)</th>
                          </>
                        )}
                        {category === 'scarpe' && (
                          <th className="border border-gray-200 px-4 py-2 text-center">Lunghezza piede (cm)</th>
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {chartData.sizes.map((size) => {
                        const measurement = chartData.measurements[size];
                        return (
                          <tr key={size} className="hover:bg-gray-50">
                            <td className="border border-gray-200 px-4 py-2 font-medium">{size}</td>
                            {category === 'pantaloni' && measurement && (
                              <>
                                <td className="border border-gray-200 px-4 py-2 text-center">{measurement.fr}</td>
                                <td className="border border-gray-200 px-4 py-2 text-center">{measurement.it}</td>
                                <td className="border border-gray-200 px-4 py-2 text-center">{measurement.us}</td>
                                <td className="border border-gray-200 px-4 py-2 text-center">{measurement.waist}</td>
                              </>
                            )}
                            {category === 'giacche' && measurement && (
                              <>
                                <td className="border border-gray-200 px-4 py-2 text-center">{measurement.chest}</td>
                                <td className="border border-gray-200 px-4 py-2 text-center">{measurement.waist}</td>
                              </>
                            )}
                            {(category === 'clothing' || category === 'tuta') && measurement && (
                              <>
                                <td className="border border-gray-200 px-4 py-2 text-center">
                                  {measurement.chest || measurement.waist}
                                </td>
                                <td className="border border-gray-200 px-4 py-2 text-center">{measurement.length}</td>
                              </>
                            )}
                            {category === 'scarpe' && measurement && (
                              <td className="border border-gray-200 px-4 py-2 text-center">{measurement.length}</td>
                            )}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Size Guide Info */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start space-x-2">
                    <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-blue-800">
                      <p className="font-medium mb-2">Come prendere le misure:</p>
                      <ul className="space-y-1 text-xs">
                        <li>• <strong>Petto:</strong> Misura intorno alla parte più ampia del petto</li>
                        <li>• <strong>Vita:</strong> Misura nel punto più stretto della vita</li>
                        <li>• <strong>Lunghezza:</strong> Dalla spalla al bordo inferiore</li>
                        {category === 'scarpe' && (
                          <li>• <strong>Piede:</strong> Misura dalla punta del dito più lungo al tallone</li>
                        )}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>


        {/* Promotion Info */}
        {chartData.promotions.length > 0 && (
          <div className="mt-3">
            {chartData.promotions.map((promo, index) => (
              <Badge key={index} variant="secondary" className="bg-orange-100 text-orange-800 mr-2">
                {promo.type}: {promo.price}
              </Badge>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}