import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ObjectUploader } from '@/components/ObjectUploader';
import { Trash2, Upload, Image as ImageIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { UploadResult } from '@uppy/core';

interface ColorImageManagerProps {
  productId: number;
  productColors: string[];
  existingColorImages?: { [color: string]: string[] };
  onColorImagesUpdate: (colorImages: { [color: string]: string[] }) => void;
}

export function ColorImageManager({ 
  productId, 
  productColors, 
  existingColorImages = {},
  onColorImagesUpdate 
}: ColorImageManagerProps) {
  const [colorImages, setColorImages] = useState<{ [color: string]: string[] }>(existingColorImages);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    setColorImages(existingColorImages);
  }, [existingColorImages]);

  const handleGetUploadParameters = async () => {
    try {
      const response = await fetch('/api/color-images/upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to get upload URL');
      }
      
      const { uploadURL } = await response.json();
      return {
        method: 'PUT' as const,
        url: uploadURL,
      };
    } catch (error) {
      console.error('Error getting upload URL:', error);
      toast({
        title: "Errore",
        description: "Impossibile ottenere l'URL di upload",
      });
      throw error;
    }
  };

  const handleImageUpload = async (
    color: string,
    result: UploadResult<Record<string, unknown>, Record<string, unknown>>
  ) => {
    try {
      const uploadedUrls = result.successful?.map(file => file.uploadURL || '').filter(Boolean) || [];
      
      if (uploadedUrls.length === 0) {
        throw new Error('No successful uploads');
      }

      const updatedColorImages = {
        ...colorImages,
        [color]: [...(colorImages[color] || []), ...uploadedUrls]
      };

      setColorImages(updatedColorImages);
      onColorImagesUpdate(updatedColorImages);

      // Save to database
      await saveColorImages(updatedColorImages);

      toast({
        title: "Successo",
        description: `Immagini caricate per il colore ${color}`,
      });
    } catch (error) {
      console.error('Error handling image upload:', error);
      toast({
        title: "Errore",
        description: "Errore durante l'upload delle immagini",
      });
    }
  };

  const handleRemoveImage = async (color: string, imageIndex: number) => {
    try {
      const updatedImages = [...(colorImages[color] || [])];
      updatedImages.splice(imageIndex, 1);
      
      const updatedColorImages = {
        ...colorImages,
        [color]: updatedImages
      };

      if (updatedImages.length === 0) {
        delete updatedColorImages[color];
      }

      setColorImages(updatedColorImages);
      onColorImagesUpdate(updatedColorImages);

      // Save to database
      await saveColorImages(updatedColorImages);

      toast({
        title: "Successo",
        description: "Immagine rimossa",
      });
    } catch (error) {
      console.error('Error removing image:', error);
      toast({
        title: "Errore",
        description: "Errore durante la rimozione dell'immagine",
      });
    }
  };

  const saveColorImages = async (updatedColorImages: { [color: string]: string[] }) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/products/${productId}/color-images`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ colorImages: updatedColorImages }),
      });

      if (!response.ok) {
        throw new Error('Failed to save color images');
      }
    } catch (error) {
      console.error('Error saving color images:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Gestione Immagini per Colori</h3>
        <Badge variant="secondary" data-testid="text-colors-count">
          {productColors.length} colori disponibili
        </Badge>
      </div>

      <div className="grid gap-4">
        {productColors.map((color) => (
          <Card key={color} className="border-l-4 border-l-blue-500" data-testid={`card-color-${color}`}>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <div 
                    className="w-6 h-6 rounded-full border border-gray-300"
                    style={{ backgroundColor: color.toLowerCase() === 'nero' ? '#000000' : color.toLowerCase() === 'bianco' ? '#FFFFFF' : color.toLowerCase() === 'rosso' ? '#FF0000' : color.toLowerCase() === 'blu' ? '#0000FF' : color.toLowerCase() === 'verde' ? '#00FF00' : color.toLowerCase() === 'giallo' ? '#FFFF00' : color.toLowerCase() === 'viola' ? '#800080' : '#808080' }}
                    data-testid={`color-preview-${color}`}
                  />
                  Colore: {color}
                </span>
                <ObjectUploader
                  maxNumberOfFiles={5}
                  maxFileSize={10485760}
                  onGetUploadParameters={handleGetUploadParameters}
                  onComplete={(result) => handleImageUpload(color, result)}
                  buttonClassName="h-8 px-3 text-xs"
                >
                  <Upload className="w-3 h-3 mr-1" />
                  Carica Immagini
                </ObjectUploader>
              </CardTitle>
            </CardHeader>
            
            <CardContent>
              {colorImages[color] && colorImages[color].length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {colorImages[color].map((imageUrl, index) => (
                    <div 
                      key={index} 
                      className="relative group aspect-square border rounded-lg overflow-hidden bg-gray-50"
                      data-testid={`color-image-${color}-${index}`}
                    >
                      <img
                        src={imageUrl}
                        alt={`${color} immagine ${index + 1}`}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          // Fallback for images that can't be loaded
                          const target = e.target as HTMLImageElement;
                          target.src = '/api/placeholder/150/150';
                        }}
                      />
                      <Button
                        size="sm"
                        variant="destructive"
                        className="absolute top-1 right-1 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => handleRemoveImage(color, index)}
                        data-testid={`button-remove-${color}-${index}`}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500 border-2 border-dashed border-gray-200 rounded-lg">
                  <ImageIcon className="w-8 h-8 mx-auto mb-2" />
                  <p className="text-sm">Nessuna immagine caricata per questo colore</p>
                  <p className="text-xs text-gray-400 mt-1">Usa il pulsante "Carica Immagini" per aggiungere foto</p>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {loading && (
        <div className="text-center text-sm text-gray-500">
          Salvataggio in corso...
        </div>
      )}
    </div>
  );
}