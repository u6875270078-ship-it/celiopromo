import React, { useState, useEffect } from 'react';
import { Search, Plus, Edit, Trash2, Package, AlertTriangle, Eye, BarChart3, TrendingUp, Scan, Download, History } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '../components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import ProductModal from '../components/ProductModal';

interface Product {
  id: number;
  sku: string;
  name: string;
  category: string;
  stock: number;
  reservedStock?: number;
  price: string;
  cost?: string;
  status?: string;
  isActive?: boolean;
  isSoldOut?: boolean;
  isOnSale?: boolean;
  isFeatured?: boolean;
  mainImage?: string;
  description?: string;
  brand?: string;
  minStock?: number;
}

const AdminInventory: React.FC = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('tutti');
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20);
  const [selectedProducts, setSelectedProducts] = useState<Set<number>>(new Set());
  const [isDeleting, setIsDeleting] = useState(false);
  const [barcodeInput, setBarcodeInput] = useState('');
  const [showAdvancedFeatures, setShowAdvancedFeatures] = useState(false);

  // Fetch categories from database
  const { data: dbCategories = [] } = useQuery<{id: number, name: string}[]>({
    queryKey: ['/api/categories'],
  });

  const categories = ['tutti', ...dbCategories.map((cat) => cat.name)];

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/products');
      if (!response.ok) {
        throw new Error('Failed to fetch products');
      }
      const data = await response.json();
      setProducts(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('Error fetching products:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProduct = async (productData: any) => {
    try {
      // Clean up the form data - convert empty strings to null for numeric fields
      const cleanedData = {
        ...productData,
        cost: productData.cost === '' || productData.cost === undefined ? null : parseFloat(productData.cost),
        discountPercentage: productData.discountPercentage === '' || productData.discountPercentage === undefined ? null : parseFloat(productData.discountPercentage),
        salePrice: productData.salePrice === '' || productData.salePrice === undefined ? null : parseFloat(productData.salePrice),
        price: parseFloat(productData.price), // Required field
        // PRESERVE STOCK VALUES FOR NEW PRODUCTS TOO
        stock: parseInt(productData.stock) || 0,
        reservedStock: parseInt(productData.reservedStock) || 0,
        minStock: parseInt(productData.minStock) || 5,
        maxStock: productData.maxStock === '' || productData.maxStock === undefined ? null : parseInt(productData.maxStock),
        weight: productData.weight === '' || productData.weight === undefined ? null : parseFloat(productData.weight)
      };

      const response = await fetch('/api/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(cleanedData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create product');
      }

      await fetchProducts();
      // Invalidate React Query caches for real-time updates on homepage/catalog
      queryClient.invalidateQueries({ queryKey: ['/api/products'] });
      queryClient.invalidateQueries({ queryKey: ['/api/products', 'featured'] });
      setIsModalOpen(false);
      setSelectedProduct(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create product');
    }
  };

  const handleUpdateProduct = async (productData: any) => {
    if (!selectedProduct) return;

    try {
      // Clean up the form data - convert empty strings to null for numeric fields
      const cleanedData = {
        ...productData,
        cost: productData.cost === '' || productData.cost === undefined ? null : parseFloat(productData.cost),
        discountPercentage: productData.discountPercentage === '' || productData.discountPercentage === undefined ? null : parseFloat(productData.discountPercentage),
        salePrice: productData.salePrice === '' || productData.salePrice === undefined ? null : parseFloat(productData.salePrice),
        price: parseFloat(productData.price), // Required field
        // PRESERVE THE ORIGINAL STOCK VALUES FROM THE FORM
        stock: parseInt(productData.stock) || 0,
        reservedStock: parseInt(productData.reservedStock) || 0,
        minStock: parseInt(productData.minStock) || 5,
        maxStock: productData.maxStock === '' || productData.maxStock === undefined ? null : parseInt(productData.maxStock),
        weight: productData.weight === '' || productData.weight === undefined ? null : parseFloat(productData.weight)
      };

      const response = await fetch(`/api/products/${selectedProduct.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(cleanedData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update product');
      }

      await fetchProducts();
      // Invalidate React Query caches for real-time updates on homepage/catalog
      queryClient.invalidateQueries({ queryKey: ['/api/products'] });
      queryClient.invalidateQueries({ queryKey: ['/api/products', 'featured'] });
      setIsModalOpen(false);
      setSelectedProduct(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update product');
    }
  };

  const handleDeleteProduct = async (productId: number) => {
    if (!confirm('Sei sicuro di voler eliminare questo prodotto?')) return;

    try {
      const response = await fetch(`/api/products/${productId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete product');
      }

      await fetchProducts();
      // Invalidate React Query caches for real-time updates on homepage/catalog
      queryClient.invalidateQueries({ queryKey: ['/api/products'] });
      queryClient.invalidateQueries({ queryKey: ['/api/products', 'featured'] });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete product');
    }
  };

  const openCreateModal = () => {
    setSelectedProduct(null);
    setIsModalOpen(true);
  };

  const openEditModal = (product: Product) => {
    setSelectedProduct(product);
    setIsModalOpen(true);
  };

  const handlePreviewProduct = (productId: number) => {
    // Open product detail page in a new tab
    window.open(`/products/${productId}`, '_blank');
  };

  const handleSelectProduct = (productId: number) => {
    const newSelected = new Set(selectedProducts);
    if (newSelected.has(productId)) {
      newSelected.delete(productId);
    } else {
      newSelected.add(productId);
    }
    setSelectedProducts(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedProducts.size === paginatedProducts.length) {
      setSelectedProducts(new Set());
    } else {
      setSelectedProducts(new Set(paginatedProducts.map(p => p.id)));
    }
  };

  const handleBulkDelete = async () => {
    if (selectedProducts.size === 0) return;
    
    const confirmed = window.confirm(
      `Sei sicuro di voler eliminare ${selectedProducts.size} prodotti selezionati? Questa azione non può essere annullata.`
    );
    
    if (!confirmed) return;

    setIsDeleting(true);
    try {
      const promises = Array.from(selectedProducts).map(async (productId) => {
        const response = await fetch(`/api/products/${productId}`, {
          method: 'DELETE',
        });
        if (!response.ok) {
          throw new Error(`Failed to delete product ${productId}`);
        }
      });

      await Promise.all(promises);
      await fetchProducts();
      // Invalidate React Query caches for real-time updates on homepage/catalog
      queryClient.invalidateQueries({ queryKey: ['/api/products'] });
      queryClient.invalidateQueries({ queryKey: ['/api/products', 'featured'] });
      setSelectedProducts(new Set());
      
      toast({
        title: "Successo!",
        description: `${selectedProducts.size} prodotti eliminati con successo`
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete products');
      toast({
        title: "Errore",
        description: "Errore durante l'eliminazione dei prodotti"
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.sku.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'tutti' || 
                           product.category === selectedCategory ||
                           product.category?.toLowerCase().includes(selectedCategory.toLowerCase()) ||
                           (product as any).subcategory?.toLowerCase().includes(selectedCategory.toLowerCase());
    
    // Filtering logic complete
    
    return matchesSearch && matchesCategory;
  });

  // Calculate pagination
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedProducts = filteredProducts.slice(startIndex, endIndex);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedCategory]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'in-stock': return 'bg-green-100 text-green-800';
      case 'low-stock': return 'bg-yellow-100 text-yellow-800';
      case 'out-of-stock': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'in-stock': return 'Disponibile';
      case 'low-stock': return 'Scorte basse';
      case 'out-of-stock': return 'Esaurito';
      default: return 'Sconosciuto';
    }
  };

  // Enhanced inventory analytics
  const totalStockValue = products.reduce((sum, p) => sum + (p.stock * parseFloat(p.price)), 0);
  const lowStockCount = products.filter(p => p.stock <= (p.minStock || 5)).length;
  const outOfStockCount = products.filter(p => p.stock === 0).length;
  const averageStockLevel = products.length > 0 ? products.reduce((sum, p) => sum + p.stock, 0) / products.length : 0;

  // Advanced functions
  const handleBarcodeSearch = () => {
    if (barcodeInput.trim()) {
      const foundProduct = products.find(p => p.sku === barcodeInput.trim());
      if (foundProduct) {
        setSelectedProduct(foundProduct);
        setIsModalOpen(true);
        setBarcodeInput('');
        toast({ title: "Prodotto trovato!", description: `${foundProduct.name} - SKU: ${foundProduct.sku}` });
      } else {
        toast({ title: "Prodotto non trovato", description: "Nessun prodotto corrisponde al codice inserito" });
      }
    }
  };

  const generateInventoryReport = () => {
    const report = {
      data: new Date().toISOString(),
      totalProdotti: products.length,
      valoreStock: totalStockValue,
      stockBasso: lowStockCount,
      esauriti: outOfStockCount,
      livelloMedio: averageStockLevel
    };
    
    const csvData = products.map(p => 
      `${p.sku},${p.name},${p.category},${p.stock},${p.price},${p.stock <= (p.minStock || 5) ? 'BASSO' : 'OK'}`
    ).join('\n');
    
    const blob = new Blob([`SKU,Nome,Categoria,Stock,Prezzo,Stato\n${csvData}`], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `inventory_report_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    
    toast({ title: "Report generato!", description: "Report inventario scaricato" });
  };

  return (
    <div className="p-6">
      {/* Enhanced Analytics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Valore Stock Totale</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">€{totalStockValue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">+2.1% dal mese scorso</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Stock Basso</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{lowStockCount}</div>
            <p className="text-xs text-muted-foreground">Richiedono riordino</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Esauriti</CardTitle>
            <Package className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{outOfStockCount}</div>
            <p className="text-xs text-muted-foreground">Da riordinare urgente</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Livello Medio</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{averageStockLevel.toFixed(1)}</div>
            <p className="text-xs text-muted-foreground">Unità per prodotto</p>
          </CardContent>
        </Card>
      </div>

      {/* Barcode Scanner & Advanced Tools */}
      <div className="mb-6">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">Scanner Barcode/SKU</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Inserisci o scansiona codice SKU..."
                  value={barcodeInput}
                  onChange={(e) => setBarcodeInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleBarcodeSearch()}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <Button onClick={handleBarcodeSearch}>
                  <Scan className="w-4 h-4 mr-2" />
                  Cerca
                </Button>
              </div>
            </div>
            <div className="flex flex-col md:flex-row gap-2">
              <Button onClick={generateInventoryReport} variant="outline" className="flex items-center gap-2">
                <Download className="w-4 h-4" />
                Esporta Report
              </Button>
              <Button 
                onClick={() => setShowAdvancedFeatures(!showAdvancedFeatures)}
                variant="outline"
                className="flex items-center gap-2"
              >
                <BarChart3 className="w-4 h-4" />
                {showAdvancedFeatures ? 'Nascondi' : 'Mostra'} Avanzate
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Advanced Features Panel */}
      {showAdvancedFeatures && (
        <div className="mb-6 space-y-4">
          {lowStockCount > 0 && (
            <Card className="border-orange-200 bg-orange-50">
              <CardHeader>
                <CardTitle className="text-orange-800 flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  Alert Stock Basso ({lowStockCount})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-2">
                  {products.filter(p => p.stock <= (p.minStock || 5)).slice(0, 5).map(product => (
                    <div key={product.id} className="flex justify-between items-center p-2 bg-white rounded border">
                      <div>
                        <span className="font-medium">{product.name}</span>
                        <span className="text-sm text-gray-500 ml-2">({product.sku})</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-orange-600">{product.stock} rimanenti</Badge>
                        <Button size="sm" onClick={() => openEditModal(product)}>Rifornisci</Button>
                      </div>
                    </div>
                  ))}
                  {lowStockCount > 5 && (
                    <p className="text-sm text-orange-600 text-center">...e altri {lowStockCount - 5} prodotti</p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Gestione Inventario Avanzata</h1>
            <p className="text-gray-600">Gestisci prodotti, monitora stock e analizza performance</p>
          </div>
          <div className="flex space-x-2">
            {selectedProducts.size > 0 && (
              <Button 
                onClick={handleBulkDelete}
                disabled={isDeleting}
                variant="destructive"
                className="bg-red-600 hover:bg-red-700 flex items-center gap-2"
              >
                <Trash2 size={16} />
                {isDeleting ? 'Eliminando...' : `Elimina ${selectedProducts.size} selezionati`}
              </Button>
            )}
            <Button onClick={openCreateModal} className="flex items-center gap-2">
              <Plus size={20} />
              Aggiungi prodotto
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Cerca per nome o SKU..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <select
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
          >
            {categories.map(category => (
              <option key={category} value={category}>
                {category === 'tutti' ? 'Tutte le categorie' : category}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Inventory Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <input
                    type="checkbox"
                    checked={selectedProducts.size === paginatedProducts.length && paginatedProducts.length > 0}
                    onChange={handleSelectAll}
                    className="rounded border-gray-300"
                  />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Immagine</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Prodotto</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">SKU</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stock</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Riservato</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Disponibile</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Prezzo</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stato</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Azioni</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {paginatedProducts.map((product) => {
                const available = product.stock - (product.reservedStock || 0);
                return (
                  <tr key={product.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="checkbox"
                        checked={selectedProducts.has(product.id)}
                        onChange={() => handleSelectProduct(product.id)}
                        className="rounded border-gray-300"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center justify-center">
                        {product.mainImage ? (
                          <img 
                            src={product.mainImage} 
                            alt={product.name}
                            className="h-12 w-12 rounded-md object-cover"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                              const nextElement = e.currentTarget.nextElementSibling as HTMLElement;
                              if (nextElement) {
                                nextElement.style.display = 'flex';
                              }
                            }}
                          />
                        ) : (
                          <div className="h-12 w-12 bg-gray-200 rounded-md flex items-center justify-center">
                            <Package className="h-6 w-6 text-gray-400" />
                          </div>
                        )}
                        <div className="h-12 w-12 bg-gray-200 rounded-md items-center justify-center" style={{display: 'none'}}>
                          <Package className="h-6 w-6 text-gray-400" />
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{product.name}</div>
                          <div className="text-sm text-gray-500">{product.category}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{product.sku}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{product.stock}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{product.reservedStock || 0}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div className="flex items-center">
                        {product.stock - (product.reservedStock || 0)}
                        {(product.stock <= (product.minStock || 5)) && (
                          <AlertTriangle className="ml-2 h-4 w-4 text-yellow-500" />
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">€{product.price}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(
                        product.stock <= (product.minStock || 5) ? 'low-stock' : 
                        product.stock === 0 ? 'out-of-stock' : 'in-stock'
                      )}`}>
                        {getStatusText(
                          product.stock <= (product.minStock || 5) ? 'low-stock' : 
                          product.stock === 0 ? 'out-of-stock' : 'in-stock'
                        )}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button 
                          onClick={() => handlePreviewProduct(product.id)}
                          className="text-green-600 hover:text-green-900"
                          title="Anteprima prodotto sul sito cliente"
                        >
                          <Eye size={16} />
                        </button>
                        <button 
                          onClick={() => openEditModal(product)}
                          className="text-blue-600 hover:text-blue-900"
                          title="Modifica prodotto"
                        >
                          <Edit size={16} />
                        </button>
                        <button 
                          onClick={() => handleDeleteProduct(product.id)}
                          className="text-red-600 hover:text-red-900"
                          title="Elimina prodotto"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {loading && (
        <div className="text-center py-8">
          <div className="text-gray-500">Caricamento prodotti...</div>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {/* Pagination Controls */}
      {!loading && filteredProducts.length > 0 && (
        <div className="bg-white px-6 py-3 flex items-center justify-between border-t border-gray-200">
          <div className="flex-1 flex justify-between sm:hidden">
            <button
              onClick={() => setCurrentPage(Math.max(currentPage - 1, 1))}
              disabled={currentPage === 1}
              className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Precedente
            </button>
            <button
              onClick={() => setCurrentPage(Math.min(currentPage + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Successivo
            </button>
          </div>
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                Mostrando{' '}
                <span className="font-medium">{startIndex + 1}</span>
                {' '}a{' '}
                <span className="font-medium">{Math.min(endIndex, filteredProducts.length)}</span>
                {' '}di{' '}
                <span className="font-medium">{filteredProducts.length}</span>
                {' '}prodotti
              </p>
            </div>
            <div>
              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                <button
                  onClick={() => setCurrentPage(Math.max(currentPage - 1, 1))}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  ←
                </button>
                
                {/* Page numbers */}
                {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                  let pageNumber;
                  if (totalPages <= 7) {
                    pageNumber = i + 1;
                  } else if (currentPage <= 4) {
                    pageNumber = i + 1;
                  } else if (currentPage >= totalPages - 3) {
                    pageNumber = totalPages - 6 + i;
                  } else {
                    pageNumber = currentPage - 3 + i;
                  }
                  
                  return (
                    <button
                      key={pageNumber}
                      onClick={() => setCurrentPage(pageNumber)}
                      className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                        currentPage === pageNumber
                          ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                          : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                      }`}
                    >
                      {pageNumber}
                    </button>
                  );
                })}
                
                <button
                  onClick={() => setCurrentPage(Math.min(currentPage + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  →
                </button>
              </nav>
            </div>
          </div>
        </div>
      )}

      {!loading && filteredProducts.length === 0 && !error && (
        <div className="text-center py-8 text-gray-500">
          Nessun prodotto trovato per i criteri selezionati.
        </div>
      )}

      <ProductModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedProduct(null);
          setError(null);
        }}
        product={selectedProduct}
        onSave={selectedProduct ? handleUpdateProduct : handleCreateProduct}
      />
    </div>
  );
};

export default AdminInventory;