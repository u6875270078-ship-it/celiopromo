import { useState, useRef } from 'react';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Upload, X, Image as ImageIcon } from 'lucide-react';

interface ImageUploaderProps {
  images: string[];
  onImagesChange: (images: string[]) => void;
  maxImages?: number;
  className?: string;
}

export default function ImageUploader({ 
  images = [], 
  onImagesChange, 
  maxImages = 10,
  className = "" 
}: ImageUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const compressImage = (file: File, maxWidth: number = 800, quality: number = 0.8): Promise<string> => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d')!;
      const img = new Image();
      
      img.onload = () => {
        // Calculate new dimensions
        let { width, height } = img;
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }
        
        canvas.width = width;
        canvas.height = height;
        
        // Draw and compress
        ctx.drawImage(img, 0, 0, width, height);
        const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(compressedDataUrl);
      };
      
      img.src = URL.createObjectURL(file);
    });
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    // Check file sizes
    for (let file of files) {
      if (file.size > 10 * 1024 * 1024) { // 10MB limit per file
        alert(`Il file ${file.name} è troppo grande. Massimo 10MB per immagine.`);
        return;
      }
    }

    // Check if adding these files would exceed max images
    if (images.length + files.length > maxImages) {
      alert(`Puoi aggiungere massimo ${maxImages} immagini. Attualmente ne hai ${images.length}.`);
      return;
    }

    setIsUploading(true);
    
    try {
      const uploadedUrls: string[] = [];
      
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        // Validate file type
        if (!file.type.startsWith('image/')) {
          alert(`${file.name} non è un'immagine valida.`);
          continue;
        }
        
        // Compress and convert to data URL
        const compressedDataUrl = await compressImage(file);
        uploadedUrls.push(compressedDataUrl);
      }
      
      // Add new URLs to existing images
      onImagesChange([...images, ...uploadedUrls]);
      
    } catch (error) {
      console.error('Errore durante il caricamento:', error);
      alert('Errore durante il caricamento delle immagini');
    } finally {
      setIsUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemoveImage = (index: number) => {
    const newImages = images.filter((_, i) => i !== index);
    onImagesChange(newImages);
  };

  const handleMainImageChange = (index: number) => {
    if (index === 0) return; // Already main image
    
    const newImages = [...images];
    // Move selected image to first position (main image)
    const [selectedImage] = newImages.splice(index, 1);
    newImages.unshift(selectedImage);
    onImagesChange(newImages);
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Upload Button */}
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium text-gray-900">
          Immagini Prodotto ({images.length}/{maxImages})
        </h4>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading || images.length >= maxImages}
        >
          <Upload className="w-4 h-4 mr-2" />
          {isUploading ? 'Caricamento...' : 'Aggiungi Foto'}
        </Button>
      </div>

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Images Grid */}
      {images.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {images.map((imageUrl, index) => (
            <Card key={index} className="relative group">
              <CardContent className="p-2">
                <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden relative">
                  <img
                    src={imageUrl}
                    alt={`Prodotto ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                  
                  {/* Main Image Badge */}
                  {index === 0 && (
                    <div className="absolute top-2 left-2 bg-blue-600 text-white px-2 py-1 rounded text-xs font-medium">
                      Principale
                    </div>
                  )}
                  
                  {/* Image Actions */}
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all duration-200 flex items-center justify-center opacity-0 group-hover:opacity-100">
                    <div className="flex space-x-2">
                      {index !== 0 && (
                        <Button
                          type="button"
                          size="sm"
                          variant="secondary"
                          onClick={() => handleMainImageChange(index)}
                          className="text-xs"
                        >
                          Rendi Principale
                        </Button>
                      )}
                      <Button
                        type="button"
                        size="sm"
                        variant="destructive"
                        onClick={() => handleRemoveImage(index)}
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                </div>
                
                <p className="text-xs text-gray-600 mt-2 text-center">
                  Immagine {index + 1}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
          <ImageIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 mb-2">Nessuna immagine caricata</p>
          <Button
            type="button"
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
          >
            <Upload className="w-4 h-4 mr-2" />
            Carica Immagini
          </Button>
        </div>
      )}
      
      {/* Helper Text */}
      <p className="text-xs text-gray-500">
        La prima immagine sarà usata come immagine principale. Clicca "Rendi Principale" per cambiare.
        Formati supportati: JPG, PNG, GIF, WebP
      </p>
    </div>
  );
}