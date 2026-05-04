import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertCustomerSchema, type Customer, type InsertCustomer } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { Plus, Pencil, Trash2, Users, Euro, Mail, Phone, Calendar, Star, Gift, TrendingUp, Heart, Award, Target, Activity, MessageSquare, Filter } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { it } from "date-fns/locale";

interface CustomerModalProps {
  customer?: Customer;
  onSuccess: () => void;
}

function CustomerModal({ customer, onSuccess }: CustomerModalProps) {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const form = useForm<InsertCustomer>({
    resolver: zodResolver(insertCustomerSchema),
    defaultValues: {
      firstName: customer?.firstName || "",
      lastName: customer?.lastName || "",
      email: customer?.email || "",
      phone: customer?.phone || "",
      company: customer?.company || "",
      notes: customer?.notes || "",
      tags: customer?.tags || [],
      totalSpent: customer?.totalSpent || 0,
      orderCount: customer?.orderCount || 0
    }
  });

  const mutation = useMutation({
    mutationFn: (data: InsertCustomer) => {
      const url = customer ? `/api/customers/${customer.id}` : "/api/customers";
      const method = customer ? "PUT" : "POST";
      return apiRequest(url, { method, body: JSON.stringify(data) });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/customers"] });
      setOpen(false);
      form.reset();
      onSuccess();
      toast({
        title: customer ? "Cliente modificato" : "Cliente creato",
        description: customer ? 
          "Le informazioni del cliente sono state aggiornate con successo." :
          "Il nuovo cliente è stato creato con successo."
      });
    },
    onError: (error) => {
      toast({
        title: "Errore",
        description: "Si è verificato un errore durante l'operazione.",
        variant: "destructive"
      });
      console.error(error);
    }
  });

  const onSubmit = (data: InsertCustomer) => {
    mutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {customer ? (
          <Button variant="ghost" size="icon" data-testid={`button-edit-customer-${customer.id}`}>
            <Pencil className="h-4 w-4" />
          </Button>
        ) : (
          <Button data-testid="button-add-customer">
            <Plus className="mr-2 h-4 w-4" />
            Nuovo Cliente
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>
            {customer ? "Modifica cliente" : "Nuovo cliente"}
          </DialogTitle>
          <DialogDescription>
            {customer ? 
              "Modifica le informazioni del cliente qui sotto." :
              "Crea un nuovo cliente per il tuo Celio."
            }
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="firstName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome</FormLabel>
                    <FormControl>
                      <Input placeholder="Marie" {...field} data-testid="input-firstname" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="lastName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cognome</FormLabel>
                    <FormControl>
                      <Input placeholder="Dubois" {...field} data-testid="input-lastname" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input 
                      type="email" 
                      placeholder="marie.dubois@email.fr" 
                      {...field} 
                      data-testid="input-email"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Telefono</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="+33 1 23 45 67 89" 
                        {...field} 
                        value={field.value || ""}
                        data-testid="input-phone"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="company"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Azienda</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Azienda (opzionale)" 
                        {...field} 
                        value={field.value || ""}
                        data-testid="input-company"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Note</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Note sul cliente..." 
                      className="resize-none" 
                      {...field}
                      value={field.value || ""}
                      data-testid="input-notes"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setOpen(false)}
                data-testid="button-cancel"
              >
                Annulla
              </Button>
              <Button 
                type="submit" 
                disabled={mutation.isPending}
                data-testid="button-submit"
              >
                {mutation.isPending ? "In corso..." : customer ? "Modifica" : "Crea"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

export default function AdminCustomers() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showLoyaltyPanel, setShowLoyaltyPanel] = useState(false);
  const [showCustomerJourney, setShowCustomerJourney] = useState(false);
  const [selectedCustomerAnalytics, setSelectedCustomerAnalytics] = useState<Customer | null>(null);
  const [customerFilter, setCustomerFilter] = useState('all');

  const { data: customers = [], isLoading } = useQuery<Customer[]>({
    queryKey: ["/api/customers"],
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiRequest(`/api/customers/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/customers"] });
      toast({
        title: "Cliente eliminato",
        description: "Il cliente è stato eliminato con successo."
      });
    },
    onError: () => {
      toast({
        title: "Errore",
        description: "Impossibile eliminare il cliente.",
        variant: "destructive"
      });
    }
  });

  const handleDelete = (customer: Customer) => {
    if (confirm(`Sei sicuro di voler eliminare ${customer.firstName} ${customer.lastName}?`)) {
      deleteMutation.mutate(customer.id);
    }
  };

  // Enhanced customer analytics
  const totalCustomers = customers.length;
  const totalSpent = customers.reduce((sum, customer) => sum + parseFloat(customer.totalSpent), 0);
  const totalOrders = customers.reduce((sum, customer) => sum + customer.orderCount, 0);
  
  // Advanced CRM calculations
  const vipCustomers = customers.filter(c => parseFloat(c.totalSpent) >= 500).length;
  const loyaltyMembers = customers.filter(c => c.tags?.includes('loyalty')).length;
  const avgCustomerLifetime = totalCustomers > 0 ? totalSpent / totalCustomers : 0;
  const repeatCustomers = customers.filter(c => c.orderCount > 1).length;
  const newCustomers = customers.filter(c => {
    const createdDate = new Date(c.createdAt);
    const monthAgo = new Date();
    monthAgo.setMonth(monthAgo.getMonth() - 1);
    return createdDate > monthAgo;
  }).length;
  
  // Customer segmentation
  const getCustomerSegment = (customer: Customer) => {
    const spent = parseFloat(customer.totalSpent);
    const orders = customer.orderCount;
    if (spent >= 1000) return { label: 'VIP', color: 'bg-purple-100 text-purple-800' };
    if (spent >= 500) return { label: 'Premium', color: 'bg-blue-100 text-blue-800' };
    if (orders > 3) return { label: 'Fedele', color: 'bg-green-100 text-green-800' };
    if (orders > 1) return { label: 'Abituale', color: 'bg-orange-100 text-orange-800' };
    return { label: 'Nuovo', color: 'bg-gray-100 text-gray-800' };
  };
  
  // Filtered customers based on segment
  const filteredCustomers = customers.filter(customer => {
    if (customerFilter === 'all') return true;
    const segment = getCustomerSegment(customer);
    return segment.label.toLowerCase() === customerFilter;
  });
  
  // Mock loyalty program data
  const loyaltyProgram = {
    totalPoints: 15420,
    activeMembers: loyaltyMembers,
    pointsRedeemed: 3240,
    averagePoints: loyaltyMembers > 0 ? Math.round(15420 / loyaltyMembers) : 0
  };
  
  // Mock customer journey data
  const customerJourneyStages = [
    { stage: 'Visitatori', count: 1250, conversion: 8.5 },
    { stage: 'Lead', count: 106, conversion: 35.2 },
    { stage: 'Primi Acquisti', count: 37, conversion: 67.6 },
    { stage: 'Clienti Abituali', count: 25, conversion: 88.0 },
    { stage: 'VIP', count: 22, conversion: 95.5 }
  ];

  return (
    <div className="container mx-auto p-6 space-y-8" data-testid="page-admin-customers">
      {/* Enhanced Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold tracking-tight" data-testid="text-page-title">Centro CRM & Loyalty</h1>
          <p className="text-muted-foreground mt-2" data-testid="text-page-description">
            Gestione clienti avanzata con programma fedeltà e customer journey analytics
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            onClick={() => setShowLoyaltyPanel(!showLoyaltyPanel)}
            variant="outline"
            className="flex items-center gap-2"
          >
            <Gift className="h-4 w-4" />
            Programma Fedeltà
          </Button>
          <Button
            onClick={() => setShowCustomerJourney(!showCustomerJourney)}
            variant="outline"
            className="flex items-center gap-2"
          >
            <TrendingUp className="h-4 w-4" />
            Customer Journey
          </Button>
          <CustomerModal onSuccess={() => {}} />
        </div>
      </div>

      {/* Advanced CRM Analytics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-6">
        <Card data-testid="card-total-customers">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Totale Clienti</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-total-customers">{totalCustomers}</div>
          </CardContent>
        </Card>
        
        <Card data-testid="card-total-revenue">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Fatturato Totale</CardTitle>
            <Euro className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-total-revenue">
              €{totalSpent.toFixed(2)}
            </div>
          </CardContent>
        </Card>
        
        <Card data-testid="card-total-orders">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ordini Totali</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-total-orders">{totalOrders}</div>
          </CardContent>
        </Card>
        
        <Card data-testid="card-avg-order">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Valore Medio Ordine</CardTitle>
            <Euro className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-avg-order">
              €{totalOrders > 0 ? (totalSpent / totalOrders).toFixed(2) : "0.00"}
            </div>
          </CardContent>
        </Card>
        
        <Card data-testid="card-vip-customers">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Clienti VIP</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{vipCustomers}</div>
            <p className="text-xs text-muted-foreground mt-1">€500+ spesi</p>
          </CardContent>
        </Card>
        
        <Card data-testid="card-loyalty-members">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Membri Loyalty</CardTitle>
            <Heart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loyaltyMembers}</div>
            <p className="text-xs text-muted-foreground mt-1">{loyaltyProgram.averagePoints} punti medi</p>
          </CardContent>
        </Card>
      </div>

      {/* Loyalty Program Panel */}
      {showLoyaltyPanel && (
        <Card className="border-purple-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Gift className="h-5 w-5" />
              Programma Fedeltà Celio
            </CardTitle>
            <CardDescription>
              Gestisci punti, premi e strategie di fidelizzazione clienti
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <div className="text-center p-4 border rounded-lg">
                <div className="text-2xl font-bold text-purple-600">{loyaltyProgram.totalPoints.toLocaleString()}</div>
                <div className="text-sm text-gray-600">Punti Totali</div>
              </div>
              <div className="text-center p-4 border rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{loyaltyProgram.activeMembers}</div>
                <div className="text-sm text-gray-600">Membri Attivi</div>
              </div>
              <div className="text-center p-4 border rounded-lg">
                <div className="text-2xl font-bold text-green-600">{loyaltyProgram.pointsRedeemed.toLocaleString()}</div>
                <div className="text-sm text-gray-600">Punti Riscattati</div>
              </div>
              <div className="text-center p-4 border rounded-lg">
                <div className="text-2xl font-bold text-orange-600">{loyaltyProgram.averagePoints}</div>
                <div className="text-sm text-gray-600">Media Punti</div>
              </div>
            </div>
            
            {/* Loyalty Program Management */}
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-100 rounded-full">
                    <Award className="h-4 w-4 text-purple-600" />
                  </div>
                  <div>
                    <div className="font-medium">Premio Spesa €50</div>
                    <div className="text-sm text-gray-600">500 punti necessari</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className="bg-green-100 text-green-800">Attivo</Badge>
                  <Button size="sm" variant="outline">Modifica</Button>
                </div>
              </div>
              
              <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-full">
                    <Gift className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <div className="font-medium">Sconto 15% Compleanno</div>
                    <div className="text-sm text-gray-600">Regalo automatico</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className="bg-blue-100 text-blue-800">Stagionale</Badge>
                  <Button size="sm" variant="outline">Configura</Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Customer Journey Panel */}
      {showCustomerJourney && (
        <Card className="border-green-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Customer Journey Analytics
            </CardTitle>
            <CardDescription>
              Analizza il percorso cliente dalla consapevolezza alla fedeltà
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {customerJourneyStages.map((stage, index) => {
                const isFirst = index === 0;
                const isLast = index === customerJourneyStages.length - 1;
                return (
                  <div key={stage.stage} className="relative">
                    <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                      <div className="flex items-center gap-4">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          isFirst ? 'bg-red-100 text-red-600' :
                          isLast ? 'bg-purple-100 text-purple-600' :
                          'bg-blue-100 text-blue-600'
                        }`}>
                          {index + 1}
                        </div>
                        <div>
                          <div className="font-medium">{stage.stage}</div>
                          <div className="text-sm text-gray-600">{stage.count.toLocaleString()} clienti</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-lg">{stage.conversion}%</div>
                        <div className="text-xs text-gray-500">Tasso conversione</div>
                      </div>
                    </div>
                    {!isLast && (
                      <div className="flex justify-center py-2">
                        <div className="w-0.5 h-8 bg-gray-300"></div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            
            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Target className="h-5 w-5 text-blue-600" />
                <span className="font-medium text-blue-900">Raccomandazioni</span>
              </div>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Migliorare conversione Lead → Primi Acquisti con offerte dedicate</li>
                <li>• Implementare email di follow-up per clienti una tantum</li>
                <li>• Creare programma VIP per i top spenders</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Customer Segmentation Filter */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Segmentazione Clienti
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Button
              variant={customerFilter === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setCustomerFilter('all')}
            >
              Tutti ({customers.length})
            </Button>
            <Button
              variant={customerFilter === 'vip' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setCustomerFilter('vip')}
            >
              VIP ({vipCustomers})
            </Button>
            <Button
              variant={customerFilter === 'premium' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setCustomerFilter('premium')}
            >
              Premium ({customers.filter(c => getCustomerSegment(c).label === 'Premium').length})
            </Button>
            <Button
              variant={customerFilter === 'fedele' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setCustomerFilter('fedele')}
            >
              Fedeli ({customers.filter(c => getCustomerSegment(c).label === 'Fedele').length})
            </Button>
            <Button
              variant={customerFilter === 'nuovo' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setCustomerFilter('nuovo')}
            >
              Nuovi ({customers.filter(c => getCustomerSegment(c).label === 'Nuovo').length})
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Customers Table */}
      <Card data-testid="card-customers-table">
        <CardHeader>
          <CardTitle>Lista Clienti</CardTitle>
          <CardDescription>
            Gestisci i tuoi clienti e consulta le loro informazioni
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-4" data-testid="text-loading">Caricamento...</div>
          ) : customers.length === 0 ? (
            <div className="text-center py-8" data-testid="text-no-customers">
              <Users className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-semibold">Nessun cliente</h3>
              <p className="text-muted-foreground">Inizia creando il tuo primo cliente.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Segmento</TableHead>
                  <TableHead>Contatti</TableHead>
                  <TableHead>Azienda</TableHead>
                  <TableHead>Ordini</TableHead>
                  <TableHead>Totale Speso</TableHead>
                  <TableHead>Tags</TableHead>
                  <TableHead>Cliente dal</TableHead>
                  <TableHead className="text-right">Azioni</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCustomers.map((customer) => (
                  <TableRow key={customer.id} data-testid={`row-customer-${customer.id}`}>
                    <TableCell className="font-medium">
                      <div data-testid={`text-customer-name-${customer.id}`}>
                        <div className="flex items-center gap-2">
                          <div>
                            {customer.firstName} {customer.lastName}
                            {customer.orderCount > 5 && <Star className="inline h-3 w-3 text-yellow-500 ml-1" />}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {(() => {
                        const segment = getCustomerSegment(customer);
                        return (
                          <Badge className={segment.color}>
                            {segment.label}
                          </Badge>
                        );
                      })()}
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        {customer.email && (
                          <div className="flex items-center text-sm text-muted-foreground">
                            <Mail className="mr-1 h-3 w-3" />
                            {customer.email}
                          </div>
                        )}
                        {customer.phone && (
                          <div className="flex items-center text-sm text-muted-foreground">
                            <Phone className="mr-1 h-3 w-3" />
                            {customer.phone}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-muted-foreground" data-testid={`text-company-${customer.id}`}>
                        {customer.company || "-"}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium" data-testid={`text-order-count-${customer.id}`}>
                        {customer.orderCount}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium" data-testid={`text-total-spent-${customer.id}`}>
                        €{parseFloat(customer.totalSpent).toFixed(2)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {customer.tags?.map((tag, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-muted-foreground" data-testid={`text-created-date-${customer.id}`}>
                        {format(new Date(customer.createdAt), 'dd MMM yyyy', { locale: it })}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end space-x-2">
                        <CustomerModal customer={customer} onSuccess={() => {}} />
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => handleDelete(customer)}
                          disabled={deleteMutation.isPending}
                          data-testid={`button-delete-customer-${customer.id}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}