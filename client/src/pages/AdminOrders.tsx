import { useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  ShoppingCart, 
  Euro, 
  Clock, 
  CheckCircle, 
  Truck, 
  AlertCircle, 
  Eye,
  Trash2,
  Package,
  RotateCcw,
  MapPin,
  FileText,
  Download,
  Mail,
  Phone,
  CreditCard,
  ArrowLeft
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { apiRequest } from "@/lib/queryClient";
import type { Order } from "@shared/schema";

const statusIcons = {
  pending: AlertCircle,
  processing: Clock,
  shipped: Truck,
  delivered: CheckCircle,
  cancelled: AlertCircle
};

const statusLabels = {
  pending: "In attesa",
  processing: "In preparazione", 
  shipped: "Spedito",
  delivered: "Consegnato",
  cancelled: "Annullato"
};

const statusVariants = {
  pending: "secondary" as const,
  processing: "default" as const,
  shipped: "outline" as const, 
  delivered: "default" as const,
  cancelled: "destructive" as const
};

const paymentStatusLabels = {
  pending: "In attesa",
  paid: "Pagato",
  failed: "Fallito",
  refunded: "Rimborsato"
};

const paymentStatusVariants = {
  pending: "secondary" as const,
  paid: "default" as const,
  failed: "destructive" as const,
  refunded: "outline" as const
};

export default function AdminOrders() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedOrders, setSelectedOrders] = useState<number[]>([]);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [selectedOrderDetails, setSelectedOrderDetails] = useState<Order | null>(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [showReturnsPanel, setShowReturnsPanel] = useState(false);

  const { data: orders = [], isLoading } = useQuery<Order[]>({
    queryKey: ["/api/orders"],
  });

  const updateOrderMutation = useMutation({
    mutationFn: ({ id, status }: { id: number, status: string }) => 
      apiRequest(`/api/orders/${id}`, { 
        method: "PUT", 
        body: JSON.stringify({ status }) 
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      toast({
        title: "Ordine aggiornato",
        description: "Lo stato dell'ordine è stato aggiornato con successo."
      });
    },
    onError: () => {
      toast({
        title: "Errore",
        description: "Impossibile aggiornare l'ordine."
      });
    }
  });

  const deleteOrderMutation = useMutation({
    mutationFn: (id: number) => 
      apiRequest(`/api/orders/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      toast({
        title: "Ordine eliminato",
        description: "L'ordine è stato eliminato con successo."
      });
    },
    onError: () => {
      toast({
        title: "Errore",
        description: "Impossibile eliminare l'ordine."
      });
    }
  });

  const handleStatusChange = (orderId: number, newStatus: string) => {
    updateOrderMutation.mutate({ id: orderId, status: newStatus });
  };

  const handleDeleteOrder = (orderId: number) => {
    if (confirm("Sei sicuro di voler eliminare questo ordine? Questa azione è irreversibile.")) {
      deleteOrderMutation.mutate(orderId);
    }
  };

  const handleSelectOrder = (orderId: number, checked: boolean) => {
    if (checked) {
      setSelectedOrders(prev => [...prev, orderId]);
    } else {
      setSelectedOrders(prev => prev.filter(id => id !== orderId));
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedOrders(orders.map(order => order.id));
    } else {
      setSelectedOrders([]);
    }
  };

  const handleBulkDelete = () => {
    if (selectedOrders.length === 0) return;
    
    const count = selectedOrders.length;
    if (confirm(`Sei sicuro di voler eliminare ${count} ordini selezionati? Questa azione è irreversibile.`)) {
      selectedOrders.forEach(orderId => {
        deleteOrderMutation.mutate(orderId);
      });
      setSelectedOrders([]);
    }
  };

  // Enhanced business analytics
  const totalOrders = orders.length;
  const totalRevenue = orders
    .filter(order => order.paymentStatus === 'paid')
    .reduce((sum, order) => sum + parseFloat(order.total), 0);
  const pendingOrders = orders.filter(order => order.status === 'pending').length;
  const processingOrders = orders.filter(order => order.status === 'processing').length;
  const shippedOrders = orders.filter(order => order.status === 'shipped').length;
  const deliveredOrders = orders.filter(order => order.status === 'delivered').length;
  const refundsRequested = orders.filter(order => order.paymentStatus === 'refunded').length;
  const avgOrderValue = orders.length > 0 ? totalRevenue / orders.length : 0;
  
  // Advanced order filtering
  const filteredOrders = orders.filter(order => {
    if (statusFilter === 'all') return true;
    if (statusFilter === 'needs-attention') {
      return order.status === 'pending' || order.paymentStatus === 'failed';
    }
    return order.status === statusFilter;
  });
  
  // Mock data for advanced features
  const shippingInfo = {
    'CELIO001': { 
      carrier: 'Poste Italiane', 
      trackingNumber: 'IT789456123', 
      estimatedDelivery: '2024-09-12',
      currentLocation: 'Centro di distribuzione Milano'
    },
    'CELIO002': {
      carrier: 'Poste Italiane',
      trackingNumber: 'IT123789456', 
      estimatedDelivery: '2024-09-10',
      currentLocation: 'In consegna'
    }
  };
  
  // Returns and refunds data
  const returnsData = [
    { orderId: 'CELIO001', reason: 'Taglia sbagliata', status: 'pending', amount: 89.90 },
    { orderId: 'CELIO003', reason: 'Prodotto danneggiato', status: 'approved', amount: 129.90 }
  ];

  const getOrderItems = (itemsJson: string) => {
    try {
      return JSON.parse(itemsJson) as Array<{
        productId: number;
        name: string;
        quantity: number;
        price: number;
      }>;
    } catch {
      return [];
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-8" data-testid="page-admin-orders">
      {/* Enhanced Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold tracking-tight" data-testid="text-page-title">Centro Gestione Ordini ERP</h1>
          <p className="text-muted-foreground mt-2" data-testid="text-page-description">
            Sistema completo per gestione ordini, spedizioni, resi e customer service
          </p>
        </div>
        <div className="flex items-center gap-3">
          {selectedOrders.length > 0 && (
            <Button 
              variant="destructive" 
              onClick={handleBulkDelete}
              disabled={deleteOrderMutation.isPending}
              data-testid="button-bulk-delete"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Elimina {selectedOrders.length}
            </Button>
          )}
          <Button
            onClick={() => setShowReturnsPanel(!showReturnsPanel)}
            variant="outline"
            className="flex items-center gap-2"
          >
            <RotateCcw className="h-4 w-4" />
            Gestione Resi ({refundsRequested})
          </Button>
          <Button
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            variant="outline"
            className="flex items-center gap-2"
          >
            <FileText className="h-4 w-4" />
            Filtri Avanzati
          </Button>
        </div>
      </div>

      {/* Advanced Analytics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-6">
        <Card data-testid="card-total-orders">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Totale Ordini</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-total-orders">{totalOrders}</div>
          </CardContent>
        </Card>
        
        <Card data-testid="card-total-revenue">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Fatturato</CardTitle>
            <Euro className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-total-revenue">
              €{totalRevenue.toFixed(2)}
            </div>
          </CardContent>
        </Card>
        
        <Card data-testid="card-pending-orders">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Attesa</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-pending-orders">{pendingOrders}</div>
          </CardContent>
        </Card>
        
        <Card data-testid="card-processing-orders">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Preparazione</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-processing-orders">{processingOrders}</div>
          </CardContent>
        </Card>
        
        <Card data-testid="card-shipped-orders">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Spediti</CardTitle>
            <Truck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{shippedOrders}</div>
          </CardContent>
        </Card>
        
        <Card data-testid="card-avg-order-value">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">AOV Medio</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">€{avgOrderValue.toFixed(2)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Advanced Filters Panel */}
      {showAdvancedFilters && (
        <Card className="border-blue-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Filtri e Ricerca Avanzata
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Stato Ordine</label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tutti gli stati</SelectItem>
                    <SelectItem value="pending">In attesa</SelectItem>
                    <SelectItem value="processing">In preparazione</SelectItem>
                    <SelectItem value="shipped">Spediti</SelectItem>
                    <SelectItem value="delivered">Consegnati</SelectItem>
                    <SelectItem value="needs-attention">Richiedono attenzione</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Valore Ordine</label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleziona range" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0-50">€0 - €50</SelectItem>
                    <SelectItem value="50-100">€50 - €100</SelectItem>
                    <SelectItem value="100-200">€100 - €200</SelectItem>
                    <SelectItem value="200+">€200+</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Periodo</label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleziona periodo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="today">Oggi</SelectItem>
                    <SelectItem value="week">Questa settimana</SelectItem>
                    <SelectItem value="month">Questo mese</SelectItem>
                    <SelectItem value="quarter">Ultimo trimestre</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end">
                <Button className="w-full flex items-center gap-2">
                  <Download className="h-4 w-4" />
                  Esporta Report
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Returns Management Panel */}
      {showReturnsPanel && (
        <Card className="border-orange-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <RotateCcw className="h-5 w-5" />
              Centro Gestione Resi e Rimborsi
            </CardTitle>
            <CardDescription>
              Gestisci richieste di reso, autorizza rimborsi e monitora il customer service
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {returnsData.map((returnItem, index) => (
                <div key={index} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-orange-100 rounded-full">
                      <RotateCcw className="h-4 w-4 text-orange-600" />
                    </div>
                    <div>
                      <div className="font-medium">Ordine #{returnItem.orderId}</div>
                      <div className="text-sm text-gray-600">{returnItem.reason}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="font-bold">€{returnItem.amount.toFixed(2)}</div>
                      <Badge className={returnItem.status === 'approved' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>
                        {returnItem.status === 'approved' ? 'Approvato' : 'In attesa'}
                      </Badge>
                    </div>
                    <div className="flex gap-2">
                      {returnItem.status === 'pending' && (
                        <>
                          <Button size="sm" className="bg-green-600 hover:bg-green-700">Approva</Button>
                          <Button size="sm" variant="outline">Rifiuta</Button>
                        </>
                      )}
                      {returnItem.status === 'approved' && (
                        <Button size="sm" variant="outline">Processa Rimborso</Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              {returnsData.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <RotateCcw className="mx-auto h-12 w-12 mb-4 text-gray-300" />
                  <p className="font-medium">Nessuna richiesta di reso attiva</p>
                  <p className="text-sm">Le richieste di reso appariranno qui</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Orders Table */}
      <Card data-testid="card-orders-table">
        <CardHeader>
          <CardTitle>Lista Ordini</CardTitle>
          <CardDescription>
            Gestisci lo stato degli ordini e monitora i pagamenti
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-4" data-testid="text-loading">Caricamento...</div>
          ) : orders.length === 0 ? (
            <div className="text-center py-8" data-testid="text-no-orders">
              <ShoppingCart className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-semibold">Nessun ordine</h3>
              <p className="text-muted-foreground">Gli ordini appariranno qui una volta creati.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]">
                    <Checkbox
                      checked={selectedOrders.length === orders.length && orders.length > 0}
                      onCheckedChange={(checked: boolean | 'indeterminate') => handleSelectAll(checked as boolean)}
                      data-testid="checkbox-select-all"
                    />
                  </TableHead>
                  <TableHead>N° Ordine</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Articoli</TableHead>
                  <TableHead>Totale</TableHead>
                  <TableHead>Stato</TableHead>
                  <TableHead>Pagamento</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Azioni</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrders.map((order) => {
                  const StatusIcon = statusIcons[(order.status || 'pending') as keyof typeof statusIcons] || AlertCircle;
                  const items = getOrderItems(order.items);
                  
                  return (
                    <TableRow key={order.id} data-testid={`row-order-${order.id}`}>
                      <TableCell>
                        <Checkbox
                          checked={selectedOrders.includes(order.id)}
                          onCheckedChange={(checked: boolean | 'indeterminate') => handleSelectOrder(order.id, checked as boolean)}
                          data-testid={`checkbox-order-${order.id}`}
                        />
                      </TableCell>
                      <TableCell className="font-medium">
                        <div data-testid={`text-order-number-${order.id}`}>
                          {order.orderNumber}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div data-testid={`text-customer-name-${order.id}`}>
                          {order.customerName}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {order.customerEmail}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {items.slice(0, 2).map((item, idx) => (
                            <div key={idx} className="text-sm">
                              {item.quantity}x {item.name}
                            </div>
                          ))}
                          {items.length > 2 && (
                            <div className="text-sm text-muted-foreground">
                              +{items.length - 2} autres...
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium" data-testid={`text-order-total-${order.id}`}>
                          €{parseFloat(order.total).toFixed(2)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-2">
                          <Select
                            value={order.status || 'pending'}
                            onValueChange={(value) => handleStatusChange(order.id, value)}
                            disabled={updateOrderMutation.isPending}
                          >
                            <SelectTrigger className="w-[140px]" data-testid={`select-status-${order.id}`}>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {Object.entries(statusLabels).map(([status, label]) => (
                                <SelectItem key={status} value={status}>
                                  {label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={(order.paymentStatus && paymentStatusVariants[order.paymentStatus as keyof typeof paymentStatusVariants]) || "secondary"}
                          data-testid={`badge-payment-${order.id}`}
                        >
                          {paymentStatusLabels[order.paymentStatus as keyof typeof paymentStatusLabels]}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-muted-foreground" data-testid={`text-order-date-${order.id}`}>
                          {format(new Date(order.createdAt || Date.now()), 'dd MMM yyyy HH:mm', { locale: fr })}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => setSelectedOrderDetails(order)}
                            data-testid={`button-view-order-${order.id}`}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          {order.status === 'shipped' && (
                            <Button 
                              variant="ghost" 
                              size="icon"
                              className="text-blue-600 hover:text-blue-700"
                              title="Traccia spedizione"
                            >
                              <MapPin className="h-4 w-4" />
                            </Button>
                          )}
                          <Button 
                            variant="ghost" 
                            size="icon"
                            className="text-purple-600 hover:text-purple-700"
                            title="Invia email cliente"
                          >
                            <Mail className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => handleDeleteOrder(order.id)}
                            disabled={deleteOrderMutation.isPending}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            data-testid={`button-delete-order-${order.id}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
      
      {/* Order Details Modal */}
      {selectedOrderDetails && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              {/* Modal Header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-full">
                    <Package className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold">Dettagli Ordine #{selectedOrderDetails.orderNumber}</h2>
                    <p className="text-gray-600">Gestione completa ordine e tracking</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setSelectedOrderDetails(null)}
                >
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              </div>
              
              {/* Order Details Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Customer Information */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Phone className="h-5 w-5" />
                      Informazioni Cliente
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <label className="text-sm font-medium text-gray-600">Nome Completo</label>
                      <p className="font-medium">{selectedOrderDetails.customerName}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Email</label>
                      <p className="text-blue-600">{selectedOrderDetails.customerEmail}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Telefono</label>
                      <p>{selectedOrderDetails.customerPhone || '+39 123 456 789'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Indirizzo di Spedizione</label>
                      <p className="text-sm text-gray-700">
                        {selectedOrderDetails.shippingAddress || 'Via Roma 123, 20121 Milano (MI), Italia'}
                      </p>
                    </div>
                    <div className="pt-3 border-t">
                      <div className="flex gap-2">
                        <Button size="sm" className="flex items-center gap-2">
                          <Mail className="h-4 w-4" />
                          Invia Email
                        </Button>
                        <Button size="sm" variant="outline" className="flex items-center gap-2">
                          <Phone className="h-4 w-4" />
                          Chiama Cliente
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                {/* Shipping & Tracking */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Truck className="h-5 w-5" />
                      Tracking Spedizione
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {shippingInfo[selectedOrderDetails.orderNumber] ? (
                      <>
                        <div>
                          <label className="text-sm font-medium text-gray-600">Corriere</label>
                          <p className="font-medium">{shippingInfo[selectedOrderDetails.orderNumber].carrier}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-600">Numero di Tracking</label>
                          <p className="font-mono text-blue-600">{shippingInfo[selectedOrderDetails.orderNumber].trackingNumber}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-600">Posizione Attuale</label>
                          <p className="font-medium text-green-600">{shippingInfo[selectedOrderDetails.orderNumber].currentLocation}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-600">Consegna Prevista</label>
                          <p>{shippingInfo[selectedOrderDetails.orderNumber].estimatedDelivery}</p>
                        </div>
                      </>
                    ) : (
                      <div className="text-center py-4 text-gray-500">
                        <Truck className="mx-auto h-8 w-8 mb-2 text-gray-300" />
                        <p className="text-sm">Spedizione non ancora avviata</p>
                      </div>
                    )}
                    <div className="pt-3 border-t">
                      <Button size="sm" className="w-full flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        Traccia su Poste Italiane
                      </Button>
                    </div>
                  </CardContent>
                </Card>
                
                {/* Order Items */}
                <Card className="lg:col-span-2">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Package className="h-5 w-5" />
                      Articoli Ordinati
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {getOrderItems(selectedOrderDetails.items).map((item, index) => (
                        <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                              <Package className="h-6 w-6 text-gray-400" />
                            </div>
                            <div>
                              <p className="font-medium">{item.name}</p>
                              <p className="text-sm text-gray-600">Quantità: {item.quantity}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-bold">€{(item.price * item.quantity).toFixed(2)}</p>
                            <p className="text-sm text-gray-600">€{item.price.toFixed(2)} cad.</p>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="border-t pt-4 mt-4">
                      <div className="flex justify-between items-center">
                        <span className="text-lg font-medium">Totale Ordine:</span>
                        <span className="text-2xl font-bold text-green-600">€{parseFloat(selectedOrderDetails.total).toFixed(2)}</span>
                      </div>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge className={selectedOrderDetails.paymentStatus === 'paid' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>
                          {paymentStatusLabels[selectedOrderDetails.paymentStatus as keyof typeof paymentStatusLabels]}
                        </Badge>
                        <Badge className="bg-blue-100 text-blue-800">
                          {statusLabels[selectedOrderDetails.status as keyof typeof statusLabels]}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                {/* Order Actions */}
                <Card className="lg:col-span-2">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      Azioni Ordine
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <Button variant="outline" className="flex items-center gap-2">
                        <Download className="h-4 w-4" />
                        Fattura PDF
                      </Button>
                      <Button variant="outline" className="flex items-center gap-2">
                        <Mail className="h-4 w-4" />
                        Email Cliente
                      </Button>
                      <Button variant="outline" className="flex items-center gap-2">
                        <RotateCcw className="h-4 w-4" />
                        Autorizza Reso
                      </Button>
                      <Button variant="outline" className="flex items-center gap-2">
                        <CreditCard className="h-4 w-4" />
                        Rimborsa
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}