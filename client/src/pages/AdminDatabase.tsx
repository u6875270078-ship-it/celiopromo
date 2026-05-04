import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Upload, FileSpreadsheet, Database, Download, Trash2 } from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

export default function AdminDatabase() {
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Query for database stats
  const { data: dbStats, isLoading: statsLoading } = useQuery({
    queryKey: ['/api/admin/database/stats'],
  });

  // Upload mutation
  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await fetch('/api/admin/database/upload', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Upload failed');
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      const message = data.skipped > 0 
        ? `Importati ${data.imported} prodotti, saltati ${data.skipped} duplicati.`
        : `Importati ${data.imported} prodotti con successo.`;
      
      toast({
        title: "Upload completato!",
        description: message,
        variant: data.skipped > 0 ? "default" : "default",
      });
      setUploadFile(null);
      queryClient.invalidateQueries({ queryKey: ['/api/admin/database/stats'] });
      queryClient.invalidateQueries({ queryKey: ['/api/products'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Errore upload",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Clear database mutation
  const clearDatabaseMutation = useMutation({
    mutationFn: async () => {
      return apiRequest('/api/admin/database/clear', {
        method: 'POST',
      });
    },
    onSuccess: () => {
      toast({
        title: "Database pulito",
        description: "Tutti i prodotti sono stati rimossi dal database.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/database/stats'] });
      queryClient.invalidateQueries({ queryKey: ['/api/products'] });
    },
    onError: () => {
      toast({
        title: "Errore",
        description: "Errore durante la pulizia del database.",
        variant: "destructive",
      });
    },
  });

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const validTypes = [
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-excel',
        'text/csv'
      ];
      
      if (!validTypes.includes(file.type)) {
        toast({
          title: "Formato file non valido",
          description: "Carica solo file Excel (.xlsx, .xls) o CSV.",
          variant: "destructive",
        });
        return;
      }
      
      setUploadFile(file);
    }
  };

  const handleUpload = () => {
    if (!uploadFile) {
      toast({
        title: "Nessun file selezionato",
        description: "Seleziona un file Excel o CSV da caricare.",
        variant: "destructive",
      });
      return;
    }
    
    uploadMutation.mutate(uploadFile);
  };

  const handleClearDatabase = () => {
    if (window.confirm('Sei sicuro di voler cancellare tutti i prodotti dal database? Questa azione non può essere annullata.')) {
      clearDatabaseMutation.mutate();
    }
  };

  return (
    <div className="space-y-6" data-testid="admin-database-page">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900" data-testid="page-title">
            Gestione Database
          </h1>
          <p className="text-gray-600 mt-1">
            Carica prodotti da file Excel o gestisci il database
          </p>
        </div>
        <Database className="h-8 w-8 text-blue-600" />
      </div>

      {/* Database Statistics */}
      <Card data-testid="database-stats-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Statistiche Database
          </CardTitle>
          <CardDescription>
            Panoramica dello stato attuale del database
          </CardDescription>
        </CardHeader>
        <CardContent>
          {statsLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg" data-testid="stat-products">
                <div className="text-2xl font-bold text-blue-600">
                  {dbStats?.products || 0}
                </div>
                <div className="text-sm text-gray-600">Prodotti</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg" data-testid="stat-categories">
                <div className="text-2xl font-bold text-green-600">
                  {dbStats?.categories || 0}
                </div>
                <div className="text-sm text-gray-600">Categorie</div>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg" data-testid="stat-variants">
                <div className="text-2xl font-bold text-purple-600">
                  {dbStats?.variants || 0}
                </div>
                <div className="text-sm text-gray-600">Varianti</div>
              </div>
              <div className="text-center p-4 bg-orange-50 rounded-lg" data-testid="stat-last-update">
                <div className="text-2xl font-bold text-orange-600">
                  {dbStats?.lastUpdate ? new Date(dbStats.lastUpdate).toLocaleDateString('it-IT') : 'N/A'}
                </div>
                <div className="text-sm text-gray-600">Ultimo Aggiornamento</div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* File Upload Section */}
      <Card data-testid="upload-section">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Carica Prodotti da Excel
          </CardTitle>
          <CardDescription>
            Carica un file Excel con i prodotti per importarli nel database
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="file-upload">Seleziona File Excel (.xlsx, .xls) o CSV</Label>
            <Input
              id="file-upload"
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleFileSelect}
              data-testid="file-input"
            />
          </div>
          
          {uploadFile && (
            <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg" data-testid="file-selected">
              <FileSpreadsheet className="h-5 w-5 text-green-600" />
              <span className="text-green-700 font-medium">{uploadFile.name}</span>
              <span className="text-green-600 text-sm">
                ({(uploadFile.size / 1024).toFixed(1)} KB)
              </span>
            </div>
          )}
          
          <div className="flex gap-2">
            <Button 
              onClick={handleUpload}
              disabled={!uploadFile || uploadMutation.isPending}
              className="flex items-center gap-2"
              data-testid="button-upload"
            >
              <Upload className="h-4 w-4" />
              {uploadMutation.isPending ? 'Caricamento...' : 'Carica Prodotti'}
            </Button>
          </div>
          
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <h4 className="font-semibold text-gray-700 mb-2">Formato File Richiesto:</h4>
            <div className="text-sm text-gray-600 space-y-1">
              <p>• <strong>Nome colonne richieste:</strong> name, sku, category, price, description</p>
              <p>• <strong>Varianti:</strong> size, color, quantity (opzionali)</p>
              <p>• <strong>Formato:</strong> Excel (.xlsx, .xls) o CSV</p>
              <p>• <strong>Duplicati:</strong> Prodotti con stesso SKU o nome vengono saltati automaticamente</p>
              <p>• <strong>Esempio:</strong> Nome | SKU | Categoria | Prezzo | Descrizione | Taglia | Colore | Quantità</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Database Actions */}
      <Card data-testid="database-actions">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-600">
            <Trash2 className="h-5 w-5" />
            Azioni Database
          </CardTitle>
          <CardDescription>
            Operazioni avanzate sul database - Attenzione: queste azioni sono irreversibili
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="border border-red-200 rounded-lg p-4 bg-red-50">
            <h4 className="font-semibold text-red-700 mb-2">Pulisci Database</h4>
            <p className="text-red-600 text-sm mb-3">
              Rimuove tutti i prodotti e le relative varianti dal database.
              Questa azione non può essere annullata.
            </p>
            <Button 
              variant="destructive"
              onClick={handleClearDatabase}
              disabled={clearDatabaseMutation.isPending}
              className="flex items-center gap-2"
              data-testid="button-clear-database"
            >
              <Trash2 className="h-4 w-4" />
              {clearDatabaseMutation.isPending ? 'Pulizia...' : 'Pulisci Database'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}