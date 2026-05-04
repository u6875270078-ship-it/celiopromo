import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { X } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from './ui/select';
import type { Category } from '@shared/schema';
import { useToast } from '@/hooks/use-toast';
import ProductVariantManager from './ProductVariantManager';
import ProductAttributesHelper from './ProductAttributesHelper';
import ImageUploader from './ImageUploader';

interface ProductVariant {
  id: string;
  size: string;
  color: string;
  quantity: number;
}

interface Product {
  id?: number;
  sku: string;
  name: string;
  description?: string;
  category: string;
  subcategory?: string;
  brand?: string;
  price: string;
  cost?: string;
  discountPercentage?: string;
  salePrice?: string;
  stock: number;
  reservedStock?: number;
  minStock?: number;
  maxStock?: number;
  isActive?: boolean;
  isSoldOut?: boolean;
  isOnSale?: boolean;
  isFeatured?: boolean;
  mainImage?: string;
  images?: string[];
  colorImages?: { [color: string]: string[] };
  images360?: string[];
  variants?: ProductVariant[];
  material?: string;
  weight?: string;
}

interface ProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  product?: Product | null;
  onSave: (product: Product) => void;
}

const ProductModal: React.FC<ProductModalProps> = ({ 
  isOpen, 
  onClose, 
  product, 
  onSave 
}) => {
  const { toast } = useToast();
  
  // Fetch categories from database
  const { data: categories = [], isLoading: categoriesLoading, error: categoriesError } = useQuery<Category[]>({
    queryKey: ['/api/categories'],
    enabled: isOpen,
  });
  
  const [formData, setFormData] = useState<Product>({
    sku: '',
    name: '',
    description: '',
    category: '',
    subcategory: '',
    brand: 'Celio',
    price: '',
    cost: '',
    discountPercentage: '0',
    salePrice: '',
    stock: 0,
    reservedStock: 0,
    minStock: 5,
    maxStock: 100,
    isActive: true,
    isSoldOut: false,
    isOnSale: false,
    isFeatured: false,
    mainImage: '',
    images: [],
    colorImages: {},
    images360: [],
    variants: [],
    material: '',
    weight: ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (product) {
      setFormData({
        ...product,
        price: product.price?.toString() || '',
        cost: product.cost?.toString() || '',
        discountPercentage: product.discountPercentage?.toString() || '0',
        salePrice: product.salePrice?.toString() || '',
        weight: product.weight?.toString() || '',
        images: product.images || [],
        variants: product.variants || [],
        // Ensure stock values are preserved properly
        stock: product.stock || 0,
        reservedStock: product.reservedStock || 0,
        minStock: product.minStock || 5,
        maxStock: product.maxStock || 100,
        colorImages: product.colorImages || {},
        images360: product.images360 || []
      });
    } else {
      setFormData({
        sku: '',
        name: '',
        description: '',
        category: '',
        subcategory: '',
        brand: 'Celio',
        price: '',
        cost: '',
        discountPercentage: '0',
        salePrice: '',
        stock: 0,
        reservedStock: 0,
        minStock: 5,
        maxStock: 100,
        isActive: true,
        isSoldOut: false,
        isOnSale: false,
        isFeatured: false,
        mainImage: '',
        images: [],
        variants: [],
        material: '',
        weight: ''
      });
    }
    setErrors({});
  }, [product, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic validation
    const newErrors: Record<string, string> = {};
    if (!formData.sku) newErrors.sku = 'SKU è richiesto';
    if (!formData.name) newErrors.name = 'Nome prodotto è richiesto';
    if (!formData.category) newErrors.category = 'Categoria è richiesta';
    if (!formData.price) newErrors.price = 'Prezzo è richiesto';
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    onSave(formData);
    
    // Show success message
    toast({
      title: "Successo!",
      description: product ? "Prodotto aggiornato con successo" : "Prodotto creato con successo"
    });
  };

  const handleInputChange = (field: keyof Product, value: string | number | boolean | string[] | ProductVariant[] | { [color: string]: string[] }) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  // Fetch categories from database
  const { data: dbCategories = [] } = useQuery<{id: number, name: string}[]>({
    queryKey: ['/api/categories'],
  });

  const categoryOptions = [
    { value: '', label: 'Seleziona una categoria' },
    ...dbCategories.map(category => ({ 
      value: category.name, 
      label: category.name 
    }))
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">
            {product ? 'Modifica Prodotto' : 'Aggiungi Nuovo Prodotto'}
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-700">Informazioni Base</h3>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-900">SKU *</label>
                <Input
                  value={formData.sku}
                  onChange={(e) => handleInputChange('sku', e.target.value)}
                  placeholder="e.g., JEAN-BAGGY-001"
                />
                {errors.sku && <p className="text-sm text-red-600">{errors.sku}</p>}
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-900">Nome Prodotto *</label>
                <Input
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="es. Jean Baggy Classico"
                />
                {errors.name && <p className="text-sm text-red-600">{errors.name}</p>}
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Descrizione</label>
                <textarea
                  className="flex w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm ring-offset-background placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  rows={3}
                  value={formData.description || ''}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Descrizione prodotto..."
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-900">Categoria *</label>
                <select
                  value={formData.category}
                  onChange={(e) => handleInputChange('category', e.target.value)}
                  className="flex h-9 w-full items-center justify-between whitespace-nowrap rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="" disabled>Seleziona una categoria</option>
                  {categoriesLoading ? (
                    <option value="" disabled>Caricamento...</option>
                  ) : categoriesError ? (
                    <option value="" disabled>Errore nel caricamento</option>
                  ) : categories && categories.length > 0 ? (
                    categories.map(category => (
                      <option key={category.id} value={category.name}>
                        {category.name}
                      </option>
                    ))
                  ) : (
                    <option value="" disabled>Nessuna categoria disponibile</option>
                  )}
                </select>
                {errors.category && <p className="text-sm text-red-600">{errors.category}</p>}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-900">Marca</label>
                <Input
                  value={formData.brand || ''}
                  onChange={(e) => handleInputChange('brand', e.target.value)}
                  placeholder="es. Celio, Levi's"
                />
              </div>
            </div>

            {/* Pricing */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-700">Prezzi</h3>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-900">Prezzo (€) *</label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => handleInputChange('price', e.target.value)}
                  placeholder="79.90"
                />
                {errors.price && <p className="text-sm text-red-600">{errors.price}</p>}
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-900">Costo (€)</label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.cost || ''}
                  onChange={(e) => handleInputChange('cost', e.target.value)}
                  placeholder="35.00"
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-900">Sconto (%)</label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.discountPercentage || '0'}
                  onChange={(e) => handleInputChange('discountPercentage', e.target.value)}
                  placeholder="0"
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-900">Prezzo Scontato (€)</label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.salePrice || ''}
                  onChange={(e) => handleInputChange('salePrice', e.target.value)}
                  placeholder="59.90"
                />
              </div>
            </div>

            {/* Stock Management */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-700">Gestione Scorte</h3>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-900">Scorte Attuali</label>
                <Input
                  type="number"
                  value={formData.stock.toString()}
                  onChange={(e) => handleInputChange('stock', parseInt(e.target.value) || 0)}
                  placeholder="25"
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-900">Scorte Riservate</label>
                <Input
                  type="number"
                  value={formData.reservedStock?.toString() || '0'}
                  onChange={(e) => handleInputChange('reservedStock', parseInt(e.target.value) || 0)}
                  placeholder="0"
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-900">Scorte Minime</label>
                <Input
                  type="number"
                  value={formData.minStock?.toString() || '5'}
                  onChange={(e) => handleInputChange('minStock', parseInt(e.target.value) || 0)}
                  placeholder="5"
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-900">Scorte Massime</label>
                <Input
                  type="number"
                  value={formData.maxStock?.toString() || ''}
                  onChange={(e) => handleInputChange('maxStock', parseInt(e.target.value) || 0)}
                  placeholder="100"
                />
              </div>
            </div>

            {/* Product Attributes */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-700">Attributi Prodotto</h3>
              
              <div className="space-y-4">
                <label className="text-sm font-medium text-gray-900">Varianti Prodotto (Taglia + Colore + Quantità)</label>
                
                {/* Product Templates Helper */}
                <ProductAttributesHelper 
                  category={formData.category}
                  onApplyTemplate={(variants) => {
                    handleInputChange('variants', variants);
                    toast({
                      title: "Template applicato!",
                      description: `Aggiunte ${variants.length} varianti dal template. Puoi modificarle qui sotto.`,
                    });
                  }}
                />
                
                <ProductVariantManager 
                  category={formData.category}
                  variants={formData.variants || []}
                  onVariantsChange={(variants) => handleInputChange('variants', variants)}
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-900">Materiale</label>
                <Input
                  value={formData.material || ''}
                  onChange={(e) => handleInputChange('material', e.target.value)}
                  placeholder="Cotone, Poliestere"
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-900">Peso (g)</label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.weight || ''}
                  onChange={(e) => handleInputChange('weight', e.target.value)}
                  placeholder="500"
                />
              </div>
            </div>
          </div>

          {/* Status Checkboxes */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-700">Stato</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={formData.isActive || false}
                  onChange={(e) => handleInputChange('isActive', e.target.checked)}
                  className="rounded border-gray-300"
                />
                <span className="text-sm">Attivo</span>
              </label>
              
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={formData.isSoldOut || false}
                  onChange={(e) => handleInputChange('isSoldOut', e.target.checked)}
                  className="rounded border-gray-300"
                />
                <span className="text-sm">Esaurito</span>
              </label>
              
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={formData.isOnSale || false}
                  onChange={(e) => handleInputChange('isOnSale', e.target.checked)}
                  className="rounded border-gray-300"
                />
                <span className="text-sm">In Saldo</span>
              </label>
              
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={formData.isFeatured || false}
                  onChange={(e) => handleInputChange('isFeatured', e.target.checked)}
                  className="rounded border-gray-300"
                />
                <span className="text-sm">In Evidenza</span>
              </label>
            </div>
          </div>

          {/* Image URL */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-700">Immagini Principali</h3>
            <div className="space-y-2">
              <ImageUploader
                images={formData.images || []}
                onImagesChange={(images) => {
                  handleInputChange('images', images);
                  // Set first image as main image
                  handleInputChange('mainImage', images[0] || '');
                }}
                maxImages={10}
              />
            </div>
          </div>



          <div className="flex justify-end space-x-4 pt-6">
            <Button variant="outline" onClick={onClose} type="button">
              Annulla
            </Button>
            <Button type="submit">
              {product ? 'Aggiorna Prodotto' : 'Crea Prodotto'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProductModal;