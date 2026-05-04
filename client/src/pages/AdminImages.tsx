import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Trash2, Upload, Image as ImageIcon, Plus, Eye, Edit, Settings, Palette, Type, Move } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { ObjectUploader } from '@/components/ObjectUploader';
import type { UploadResult } from '@uppy/core';
import { Separator } from '@/components/ui/separator';

interface PublicImage {
  id: string;
  name: string;
  url: string;
  path: string;
  uploadedAt: string;
  size: number;
  type: string;
  mediaType?: string; // 'image' | 'video'
  section?: string | null;
  position?: number;
  isActive?: boolean;
  title?: string | null;
  subtitle?: string | null;
  buttonText?: string | null;
  linkUrl?: string | null;
  // Advanced styling fields
  titleColor?: string;
  subtitleColor?: string;
  buttonColor?: string;
  buttonBgColor?: string;
  titleFont?: string;
  subtitleFont?: string;
  buttonFont?: string;
  titleSize?: string;
  subtitleSize?: string;
  textAlign?: string;
  titleWeight?: string;
  subtitleWeight?: string;
  buttonSize?: string;
  // Video-specific fields
  autoplay?: boolean;
  loop?: boolean;
  muted?: boolean;
  showControls?: boolean;
  posterImage?: string | null;
  duration?: number | null;
}

// Available fonts - Celio-style modern fonts
const AVAILABLE_FONTS = [
  'system-ui',
  'Inter',
  'Helvetica Neue', 
  'Arial',
  'sans-serif',
  'Roboto',
  'Open Sans',
  'Lato',
  'Montserrat',
  'Source Sans Pro',
  'Poppins',
  'Nunito',
  'Georgia',
  'Times New Roman',
  'serif'
];

// Text sizes
const TEXT_SIZES = [
  { value: 'xs', label: 'Extra Piccolo' },
  { value: 'sm', label: 'Piccolo' },
  { value: 'md', label: 'Medio' },
  { value: 'lg', label: 'Grande' },
  { value: 'xl', label: 'Extra Grande' },
  { value: '2xl', label: '2X Grande' },
  { value: '3xl', label: '3X Grande' },
  { value: '4xl', label: '4X Grande' },
  { value: '5xl', label: '5X Grande' }
];

// Font weights
const FONT_WEIGHTS = [
  { value: 'light', label: 'Leggero' },
  { value: 'normal', label: 'Normale' },
  { value: 'medium', label: 'Medio' },
  { value: 'semibold', label: 'Semi Grassetto' },
  { value: 'bold', label: 'Grassetto' },
  { value: 'extrabold', label: 'Extra Grassetto' }
];

// Text alignment options
const TEXT_ALIGNMENTS = [
  { value: 'left', label: 'Sinistra' },
  { value: 'center', label: 'Centro' },
  { value: 'right', label: 'Destra' }
];

export default function AdminImages() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [images, setImages] = useState<PublicImage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<PublicImage | null>(null);
  const [selectedSection, setSelectedSection] = useState<string>('all');
  const [editingImage, setEditingImage] = useState<PublicImage | null>(null);
  const [editForm, setEditForm] = useState({
    section: '',
    position: 0,
    isActive: true,
    title: '',
    subtitle: '',
    buttonText: '',
    linkUrl: '',
    // Advanced styling
    titleColor: '#ffffff',
    subtitleColor: '#ffffff',
    buttonColor: '#000000',
    buttonBgColor: '#ffffff',
    titleFont: 'system-ui',
    subtitleFont: 'system-ui', 
    buttonFont: 'system-ui',
    titleSize: 'xl',
    subtitleSize: 'lg',
    textAlign: 'right',
    titleWeight: 'bold',
    subtitleWeight: 'normal',
    buttonSize: 'md',
    // Video-specific settings
    autoplay: false,
    loop: true,
    muted: true,
    showControls: false,
    posterImage: '',
    duration: 0
  });
  const [lastUploadInfo, setLastUploadInfo] = useState<{publicPath?: string} | null>(null);
  
  // New states for URL input and testing
  const [urlInput, setUrlInput] = useState('');
  const [isTestingUrl, setIsTestingUrl] = useState(false);
  const [testImagePreview, setTestImagePreview] = useState<string | null>(null);
  const [testMediaType, setTestMediaType] = useState<'image' | 'video' | null>(null);
  const [isAddingFromUrl, setIsAddingFromUrl] = useState(false);
  const [selectedTab, setSelectedTab] = useState<'upload' | 'url'>('upload');
  const [savingSection, setSavingSection] = useState<string | null>(null);

  // Check authentication
  useEffect(() => {
    const adminAuth = localStorage.getItem('adminAuth');
    if (!adminAuth) {
      setLocation('/admin/login');
      return;
    }
    
    const authData = JSON.parse(adminAuth);
    if (!authData.isAuthenticated) {
      setLocation('/admin/login');
      return;
    }

    loadImages();
  }, [setLocation]);

  const loadImages = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/admin/images');
      if (!response.ok) {
        throw new Error('Failed to load images');
      }
      const data = await response.json();
      setImages(data.images || []);
    } catch (error) {
      console.error('Error loading images:', error);
      toast({
        title: "Errore",
        description: "Impossibile caricare le immagini",

      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageEdit = (image: PublicImage) => {
    setEditingImage(image);
    setEditForm({
      section: image.section || '',
      position: image.position || 0,
      isActive: image.isActive ?? true,
      title: image.title || '',
      subtitle: image.subtitle || '',
      buttonText: image.buttonText || '',
      linkUrl: image.linkUrl || '',
      // Advanced styling with defaults
      titleColor: image.titleColor || '#ffffff',
      subtitleColor: image.subtitleColor || '#ffffff',
      buttonColor: image.buttonColor || '#000000',
      buttonBgColor: image.buttonBgColor || '#ffffff',
      titleFont: image.titleFont || 'Inter',
      subtitleFont: image.subtitleFont || 'Inter',
      buttonFont: image.buttonFont || 'Inter',
      titleSize: image.titleSize || 'xl',
      subtitleSize: image.subtitleSize || 'lg',
      textAlign: image.textAlign || 'right',
      titleWeight: image.titleWeight || 'bold',
      subtitleWeight: image.subtitleWeight || 'normal',
      buttonSize: image.buttonSize || 'md',
      // Video-specific settings with defaults
      autoplay: image.autoplay ?? false,
      loop: image.loop ?? true,
      muted: image.muted ?? true,
      showControls: image.showControls ?? false,
      posterImage: image.posterImage || '',
      duration: image.duration || 0
    });
  };

  const handleImageSave = async () => {
    if (!editingImage) return;

    try {
      const response = await fetch(`/api/admin/images/${editingImage.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editForm),
      });

      if (!response.ok) {
        throw new Error('Failed to update image');
      }

      toast({
        title: "Successo",
        description: "Immagine aggiornata con successo!",
      });

      setEditingImage(null);
      loadImages();
    } catch (error) {
      console.error('Error updating image:', error);
      toast({
        title: "Errore",
        description: "Impossibile aggiornare l'immagine",
      });
    }
  };

  const handleSectionSave = async (section: string) => {
    if (!editingImage) return;

    setSavingSection(section);
    try {
      const response = await fetch(`/api/admin/images/${editingImage.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editForm),
      });

      if (!response.ok) {
        throw new Error('Failed to update image');
      }

      toast({
        title: "Salvato!",
        description: `${section} salvato con successo! Controlla homepage per vedere i cambiamenti.`,
      });

      // Refresh both admin images and trigger homepage refresh
      loadImages();
      
      // Force refresh homepage carousel data
      if (window.location.pathname !== '/') {
        // Dispatch custom event to refresh carousel if on another page
        window.dispatchEvent(new CustomEvent('refreshCarousel'));
      }
    } catch (error) {
      console.error('Error updating image:', error);
      toast({
        title: "Errore",
        description: `Errore nel salvare ${section}`,
      });
    } finally {
      setSavingSection(null);
    }
  };

  const handleImageDelete = async (id: string) => {
    if (!confirm('Sei sicuro di voler eliminare questa immagine?')) return;

    try {
      const response = await fetch(`/api/admin/images/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete image');
      }

      toast({
        title: "Successo",
        description: "Immagine eliminata con successo!",
      });

      loadImages();
    } catch (error) {
      console.error('Error deleting image:', error);
      toast({
        title: "Errore",
        description: "Impossibile eliminare l'immagine",

      });
    }
  };

  const testMediaUrl = async (url: string) => {
    if (!url.trim()) {
      setTestImagePreview(null);
      setTestMediaType(null);
      return;
    }

    setIsTestingUrl(true);
    try {
      // Detect media type from URL
      const mediaType = detectMediaType(url);
      setTestMediaType(mediaType);

      if (mediaType === 'video') {
        // Handle video URLs
        if (isYouTubeUrl(url)) {
          // Extract YouTube thumbnail
          const videoId = extractYouTubeVideoId(url);
          if (videoId) {
            const thumbnailUrl = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
            setTestImagePreview(thumbnailUrl);
            toast({
              title: "Video Rilevato",
              description: "Video YouTube trovato! L'anteprima mostra la miniatura.",
            });
          } else {
            throw new Error('Invalid YouTube URL');
          }
        } else if (isWistiaUrl(url)) {
          // Handle Wistia videos
          setTestImagePreview(url);
          toast({
            title: "Video Rilevato",
            description: "Video Wistia trovato! Pronto per il caricamento.",
          });
        } else {
          // For direct video URLs, try to create a video element
          const video = document.createElement('video');
          video.crossOrigin = 'anonymous';
          
          const loadPromise = new Promise<string>((resolve, reject) => {
            video.onloadedmetadata = () => resolve(url);
            video.onerror = () => reject(new Error('Failed to load video'));
            video.src = url;
          });

          await Promise.race([
            loadPromise,
            new Promise<never>((_, reject) => 
              setTimeout(() => reject(new Error('Timeout')), 10000)
            )
          ]);

          setTestImagePreview(url);
          toast({
            title: "Video Rilevato",
            description: "URL del video valido!",
          });
        }
      } else {
        // Handle image URLs (original logic)
        const img = new Image();
        img.crossOrigin = 'anonymous';
        
        const loadPromise = new Promise<string>((resolve, reject) => {
          img.onload = () => resolve(url);
          img.onerror = () => reject(new Error('Failed to load image'));
          img.src = url;
        });

        const validUrl = await Promise.race([
          loadPromise,
          new Promise<never>((_, reject) => 
            setTimeout(() => reject(new Error('Timeout')), 5000)
          )
        ]);

        setTestImagePreview(validUrl);
        toast({
          title: "Immagine Rilevata",
          description: "URL dell'immagine valido!",
        });
      }
    } catch (error) {
      console.error('Error testing media URL:', error);
      setTestImagePreview(null);
      setTestMediaType(null);
      toast({
        title: "Errore",
        description: "URL non valido o impossibile caricare il media",
      });
    } finally {
      setIsTestingUrl(false);
    }
  };

  // Helper functions for media detection
  const detectMediaType = (url: string): 'image' | 'video' => {
    const imageExtensions = /\.(jpg|jpeg|png|gif|bmp|webp|svg)$/i;
    const videoExtensions = /\.(mp4|webm|ogg|mov|avi|wmv|flv|m4v)$/i;
    
    if (isYouTubeUrl(url)) return 'video';
    if (isWistiaUrl(url)) return 'video';
    if (videoExtensions.test(url)) return 'video';
    if (imageExtensions.test(url)) return 'image';
    
    // Default to image for unknown types
    return 'image';
  };

  const isYouTubeUrl = (url: string): boolean => {
    return /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/|youtube\.com\/shorts\/)/.test(url);
  };

  const isWistiaUrl = (url: string): boolean => {
    return /(?:wistia\.com|wi\.st)/.test(url);
  };

  const extractYouTubeVideoId = (url: string): string | null => {
    const match = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/|youtube\.com\/shorts\/)([^"&?\/\s]{11})/);
    return match ? match[1] : null;
  };

  const addImageFromUrl = async () => {
    if (!testImagePreview) {
      toast({
        title: "Errore",
        description: "Testa prima l'URL",
      });
      return;
    }

    setIsAddingFromUrl(true);
    try {
      const response = await fetch('/api/admin/images/from-url', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: testImagePreview,
          section: 'hero', // Default section
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to add image');
      }

      toast({
        title: "Successo",
        description: "Immagine aggiunta con successo!",
      });

      setUrlInput('');
      setTestImagePreview(null);
      loadImages();
    } catch (error) {
      console.error('Error adding image:', error);
      toast({
        title: "Errore",
        description: "Impossibile aggiungere l'immagine dall'URL",
      });
    } finally {
      setIsAddingFromUrl(false);
    }
  };

  const handleGetUploadParameters = async () => {
    try {
      const response = await fetch('/api/objects/upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to get upload URL');
      }

      const data = await response.json();
      return {
        method: 'PUT' as const,
        url: data.uploadURL,
      };
    } catch (error) {
      console.error('Error getting upload parameters:', error);
      throw error;
    }
  };

  const handleUploadComplete = async (result: UploadResult<Record<string, unknown>, Record<string, unknown>>) => {
    setIsUploading(true);
    
    try {
      if (result.successful && result.successful.length > 0) {
        // Process ALL uploaded files, not just the first one
        const uploadPromises = result.successful.map(async (uploadedFile, index) => {
          const uploadURL = uploadedFile.uploadURL;
          
          if (uploadURL) {
            const response = await fetch('/api/admin/images/from-upload', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                uploadURL: uploadURL,
                originalName: uploadedFile.name,
                size: uploadedFile.size || 0,
                type: uploadedFile.type || 'image/jpeg',
                section: 'hero',
                position: index, // Set position for carousel order
              }),
            });

            if (!response.ok) {
              throw new Error(`Failed to save image ${uploadedFile.name}`);
            }
            return uploadURL;
          }
          return null;
        });

        const uploadedURLs = await Promise.all(uploadPromises);
        const successfulUploads = uploadedURLs.filter(Boolean);
        
        setLastUploadInfo({ publicPath: `${successfulUploads.length} images uploaded` });

        toast({
          title: "Successo",
          description: `${successfulUploads.length} immagini caricate con successo!`,
        });

        loadImages();
      }
    } catch (error) {
      console.error('Error handling upload:', error);
      toast({
        title: "Errore",
        description: "Impossibile processare il caricamento",

      });
    } finally {
      setIsUploading(false);
    }
  };

  const ColorPicker = ({ value, onChange, label }: { value: string; onChange: (color: string) => void; label: string }) => (
    <div className="space-y-2">
      <Label className="text-sm font-medium">{label}</Label>
      <div className="flex items-center space-x-2">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-12 h-8 rounded border border-gray-300 cursor-pointer"
        />
        <Input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="text-xs font-mono"
          placeholder="#ffffff"
        />
      </div>
    </div>
  );

  const filteredImages = selectedSection === 'all' 
    ? images 
    : images.filter(img => img.section === selectedSection);

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">Caricamento immagini...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Gestione Immagini e Video</h1>
        <Button onClick={() => setLocation('/admin')} variant="outline">
          Torna al Dashboard
        </Button>
      </div>

      {/* Upload Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Carica Nuove Immagini e Video
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-6">
            <div className="flex gap-2 border-b">
              <button 
                className={`px-4 py-2 -mb-px border-b-2 ${selectedTab === 'upload' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500'}`}
                onClick={() => setSelectedTab('upload')}
              >
                Carica File
              </button>
              <button 
                className={`px-4 py-2 -mb-px border-b-2 ${selectedTab === 'url' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500'}`}
                onClick={() => setSelectedTab('url')}
              >
                Da URL
              </button>
            </div>
            
            {selectedTab === 'upload' && (
            <div className="space-y-4">
              <ObjectUploader
                maxNumberOfFiles={10}
                maxFileSize={52428800}
                onGetUploadParameters={handleGetUploadParameters}
                onComplete={handleUploadComplete}
                buttonClassName="w-full"
              >
                <div className="flex items-center justify-center gap-2 py-8">
                  <Upload className="h-5 w-5" />
                  <span>Seleziona e Carica Immagini/Video (Max 10, Max 50MB)</span>
                </div>
              </ObjectUploader>
              
              {isUploading && (
                <p className="text-center text-blue-600">Caricamento in corso...</p>
              )}
              
              {lastUploadInfo?.publicPath && (
                <div className="p-4 bg-green-50 rounded-lg">
                  <p className="text-green-800 font-medium">Upload completato!</p>
                  <p className="text-sm text-green-600 break-all">{lastUploadInfo.publicPath}</p>
                </div>
              )}
            </div>
            )}
            
            {selectedTab === 'url' && (
            <div className="space-y-4">
              <div className="flex gap-2">
                <Input
                  type="url"
                  placeholder="https://example.com/image.jpg"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  onBlur={() => testMediaUrl(urlInput)}
                />
                <Button 
                  onClick={() => testMediaUrl(urlInput)}
                  disabled={isTestingUrl}
                >
                  {isTestingUrl ? 'Test...' : 'Testa'}
                </Button>
              </div>
              
              {testImagePreview && (
                <div className="space-y-4">
                  <div className="max-w-md mx-auto">
                    {testMediaType === 'video' ? (
                      <div className="space-y-2">
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-center">
                          <p className="text-blue-800 font-medium">🎬 Video Rilevato</p>
                          <p className="text-sm text-blue-600">
                            {isYouTubeUrl(urlInput) ? 'YouTube Video' : 
                             isWistiaUrl(urlInput) ? 'Wistia Video' : 'Video Diretto'}
                          </p>
                        </div>
                        {isYouTubeUrl(urlInput) ? (
                          <img 
                            src={testImagePreview} 
                            alt="Video Thumbnail" 
                            className="w-full h-48 object-cover rounded-lg border"
                            onError={() => setTestImagePreview(null)}
                          />
                        ) : isWistiaUrl(urlInput) ? (
                          <div className="w-full h-48 bg-gray-100 rounded-lg border flex items-center justify-center">
                            <div className="text-center">
                              <p className="text-gray-600 font-medium">🎬 Wistia Video</p>
                              <p className="text-sm text-gray-500">Pronto per il caricamento</p>
                            </div>
                          </div>
                        ) : (
                          <video 
                            src={urlInput}
                            className="w-full h-48 object-cover rounded-lg border"
                            controls
                            muted
                            onError={() => setTestImagePreview(null)}
                          />
                        )}
                      </div>
                    ) : (
                      <img 
                        src={testImagePreview} 
                        alt="Preview" 
                        className="w-full h-48 object-cover rounded-lg border"
                        onError={() => setTestImagePreview(null)}
                      />
                    )}
                  </div>
                  <Button 
                    onClick={addImageFromUrl}
                    disabled={isAddingFromUrl}
                    className="w-full"
                  >
                    {isAddingFromUrl ? 'Aggiunta...' : 
                     testMediaType === 'video' ? 'Aggiungi Video' : 'Aggiungi Immagine'}
                  </Button>
                </div>
              )}
            </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Filter Section */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4 items-center">
            <Label>Filtra per sezione:</Label>
            <Select value={selectedSection} onValueChange={setSelectedSection}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tutte le sezioni</SelectItem>
                <SelectItem value="hero">Hero</SelectItem>
                <SelectItem value="banner">Banner</SelectItem>
                <SelectItem value="promotion">Promozione</SelectItem>
                <SelectItem value="gallery">Galleria</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Images Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredImages.map((image) => (
          <Card key={image.id} className="overflow-hidden">
            <div className="aspect-video bg-gray-100 relative">
              <img
                src={image.url}
                alt={image.name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDQwMCAzMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI0MDAiIGhlaWdodD0iMzAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0yMDAgMTUwQzE4My40IDE1MCAxNzAgMTM2LjYgMTcwIDEyMEMxNzAgMTAzLjQgMTgzLjQgOTAgMjAwIDkwQzIxNi42IDkwIDIzMCAxMDMuNCAyMzAgMTIwQzIzMCAxMzYuNiAyMTYuNiAxNTAgMjAwIDE1MFoiIGZpbGw9IiM5Q0EzQUYiLz4KPHA+Cjx0ZXh0IHg9IjIwMCIgeT0iMTgwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSIjOUNBM0FGIiBmb250LXNpemU9IjE0Ij5JbW1hZ2luZSBub24gdmFsaWRhPC90ZXh0Pgo8L3N2Zz4K';
                }}
              />
              {!image.isActive && (
                <div className="absolute inset-0 bg-red-500 bg-opacity-50 flex items-center justify-center">
                  <span className="text-white font-bold">DISATTIVATA</span>
                </div>
              )}
            </div>
            <CardContent className="p-4">
              <div className="space-y-2">
                <h3 className="font-semibold truncate">{image.name}</h3>
                <div className="text-sm text-gray-500 space-y-1">
                  <p>Sezione: {image.section || 'Nessuna'}</p>
                  <p>Posizione: {image.position || 0}</p>
                  {image.title && <p>Titolo: {image.title}</p>}
                  {image.buttonText && <p>Pulsante: {image.buttonText}</p>}
                </div>
                <div className="flex gap-2 pt-2">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleImageEdit(image)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>
                          Modifica Immagine: {editingImage?.name}
                        </DialogTitle>
                      </DialogHeader>
                      
                      <div className="space-y-6">
                        <div>
                          <h3 className="text-lg font-semibold mb-4">Informazioni Base</h3>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label>Sezione</Label>
                              <Select value={editForm.section} onValueChange={(value) => setEditForm({...editForm, section: value})}>
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="hero">Hero</SelectItem>
                                  <SelectItem value="banner">Banner</SelectItem>
                                  <SelectItem value="promotion">Promozione</SelectItem>
                                  <SelectItem value="gallery">Galleria</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <Label>Posizione</Label>
                              <Input
                                type="number"
                                value={editForm.position}
                                onChange={(e) => setEditForm({...editForm, position: parseInt(e.target.value) || 0})}
                              />
                            </div>
                            <div>
                              <Label>Allineamento Testo</Label>
                              <Select value={editForm.textAlign} onValueChange={(value) => setEditForm({...editForm, textAlign: value})}>
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {TEXT_ALIGNMENTS.map(align => (
                                    <SelectItem key={align.value} value={align.value}>{align.label}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="flex items-center space-x-2">
                              <input
                                type="checkbox"
                                id="isActive"
                                checked={editForm.isActive}
                                onChange={(e) => setEditForm({...editForm, isActive: e.target.checked})}
                              />
                              <Label htmlFor="isActive">Attiva</Label>
                            </div>
                          </div>
                        </div>
                        
                        <Separator />
                        
                        <div>
                          <h3 className="text-lg font-semibold mb-4">Testo e Contenuto</h3>
                          <div className="space-y-4">
                            <div>
                              <Label>Titolo</Label>
                              <Input
                                value={editForm.title}
                                onChange={(e) => setEditForm({...editForm, title: e.target.value})}
                                placeholder="Titolo principale"
                              />
                            </div>
                            <div>
                              <Label>Sottotitolo</Label>
                              <Textarea
                                value={editForm.subtitle}
                                onChange={(e) => setEditForm({...editForm, subtitle: e.target.value})}
                                placeholder="Sottotitolo o descrizione"
                                rows={3}
                              />
                            </div>
                            <div>
                              <Label>Testo Pulsante</Label>
                              <Input
                                value={editForm.buttonText}
                                onChange={(e) => setEditForm({...editForm, buttonText: e.target.value})}
                                placeholder="scopri, acquista, ecc."
                              />
                            </div>
                            <div>
                              <Label>Link Pulsante</Label>
                              <Input
                                value={editForm.linkUrl}
                                onChange={(e) => setEditForm({...editForm, linkUrl: e.target.value})}
                                placeholder="https://example.com"
                              />
                            </div>
                          </div>
                        </div>
                        
                        <Separator />
                        
                        <div>
                          <h3 className="text-lg font-semibold mb-4">Stile e Colori</h3>
                          <div className="space-y-6">
                            <div>
                              <h4 className="font-semibold mb-4 flex items-center gap-2">
                                <Type className="h-4 w-4" />
                                Stile Titolo
                              </h4>
                              <div className="grid grid-cols-2 gap-4">
                                <ColorPicker
                                  value={editForm.titleColor}
                                  onChange={(color) => setEditForm({...editForm, titleColor: color})}
                                  label="Colore Titolo"
                                />
                                <div>
                                  <Label>Font Titolo</Label>
                                  <Select value={editForm.titleFont} onValueChange={(value) => setEditForm({...editForm, titleFont: value})}>
                                    <SelectTrigger>
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {AVAILABLE_FONTS.map(font => (
                                        <SelectItem key={font} value={font}>{font}</SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>
                                <div>
                                  <Label>Dimensione Titolo</Label>
                                  <Select value={editForm.titleSize} onValueChange={(value) => setEditForm({...editForm, titleSize: value})}>
                                    <SelectTrigger>
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {TEXT_SIZES.map(size => (
                                        <SelectItem key={size.value} value={size.value}>{size.label}</SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>
                                <div>
                                  <Label>Peso Titolo</Label>
                                  <Select value={editForm.titleWeight} onValueChange={(value) => setEditForm({...editForm, titleWeight: value})}>
                                    <SelectTrigger>
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {FONT_WEIGHTS.map(weight => (
                                        <SelectItem key={weight.value} value={weight.value}>{weight.label}</SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>
                              </div>
                              <div className="flex justify-end mt-4">
                                <Button 
                                  size="sm" 
                                  onClick={() => {
                                    console.log('Saving title section with data:', editForm);
                                    handleSectionSave('Stile Titolo');
                                  }}
                                  disabled={savingSection === 'Stile Titolo'}
                                  className="bg-blue-600 hover:bg-blue-700 text-white"
                                >
                                  {savingSection === 'Stile Titolo' ? 'Salvando...' : 'Salva Titolo'}
                                </Button>
                              </div>
                            </div>
                            
                            <Separator />
                            
                            <div>
                              <h4 className="font-semibold mb-4 flex items-center gap-2">
                                <Type className="h-4 w-4" />
                                Stile Sottotitolo
                              </h4>
                              <div className="grid grid-cols-2 gap-4">
                                <ColorPicker
                                  value={editForm.subtitleColor}
                                  onChange={(color) => setEditForm({...editForm, subtitleColor: color})}
                                  label="Colore Sottotitolo"
                                />
                                <div>
                                  <Label>Font Sottotitolo</Label>
                                  <Select value={editForm.subtitleFont} onValueChange={(value) => setEditForm({...editForm, subtitleFont: value})}>
                                    <SelectTrigger>
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {AVAILABLE_FONTS.map(font => (
                                        <SelectItem key={font} value={font}>{font}</SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>
                                <div>
                                  <Label>Dimensione Sottotitolo</Label>
                                  <Select value={editForm.subtitleSize} onValueChange={(value) => setEditForm({...editForm, subtitleSize: value})}>
                                    <SelectTrigger>
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {TEXT_SIZES.map(size => (
                                        <SelectItem key={size.value} value={size.value}>{size.label}</SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>
                                <div>
                                  <Label>Peso Sottotitolo</Label>
                                  <Select value={editForm.subtitleWeight} onValueChange={(value) => setEditForm({...editForm, subtitleWeight: value})}>
                                    <SelectTrigger>
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {FONT_WEIGHTS.map(weight => (
                                        <SelectItem key={weight.value} value={weight.value}>{weight.label}</SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>
                              </div>
                              <div className="flex justify-end mt-4">
                                <Button 
                                  size="sm" 
                                  onClick={() => handleSectionSave('Stile Sottotitolo')}
                                  disabled={savingSection === 'Stile Sottotitolo'}
                                >
                                  {savingSection === 'Stile Sottotitolo' ? 'Salvando...' : 'Salva Sottotitolo'}
                                </Button>
                              </div>
                            </div>
                            
                            <Separator />
                            
                            <div>
                              <h4 className="font-semibold mb-4 flex items-center gap-2">
                                <Palette className="h-4 w-4" />
                                Stile Pulsante
                              </h4>
                              <div className="grid grid-cols-2 gap-4">
                                <ColorPicker
                                  value={editForm.buttonColor}
                                  onChange={(color) => setEditForm({...editForm, buttonColor: color})}
                                  label="Colore Testo Pulsante"
                                />
                                <ColorPicker
                                  value={editForm.buttonBgColor}
                                  onChange={(color) => setEditForm({...editForm, buttonBgColor: color})}
                                  label="Colore Sfondo Pulsante"
                                />
                                <div>
                                  <Label>Font Pulsante</Label>
                                  <Select value={editForm.buttonFont} onValueChange={(value) => setEditForm({...editForm, buttonFont: value})}>
                                    <SelectTrigger>
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {AVAILABLE_FONTS.map(font => (
                                        <SelectItem key={font} value={font}>{font}</SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>
                                <div>
                                  <Label>Dimensione Pulsante</Label>
                                  <Select value={editForm.buttonSize} onValueChange={(value) => setEditForm({...editForm, buttonSize: value})}>
                                    <SelectTrigger>
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {TEXT_SIZES.map(size => (
                                        <SelectItem key={size.value} value={size.value}>{size.label}</SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>
                              </div>
                              <div className="flex justify-end mt-4">
                                <Button 
                                  size="sm" 
                                  onClick={() => handleSectionSave('Stile Pulsante')}
                                  disabled={savingSection === 'Stile Pulsante'}
                                >
                                  {savingSection === 'Stile Pulsante' ? 'Salvando...' : 'Salva Pulsante'}
                                </Button>
                              </div>
                            </div>
                          </div>
                          
                          {editingImage?.mediaType === 'video' && (
                            <>
                              <Separator />
                              
                              <div>
                                <h4 className="font-semibold mb-4 flex items-center gap-2">
                                  <Settings className="h-4 w-4" />
                                  Impostazioni Video
                                </h4>
                                <div className="grid grid-cols-2 gap-4">
                                  <div className="flex items-center space-x-2">
                                    <input
                                      type="checkbox"
                                      id="autoplay"
                                      checked={editForm.autoplay}
                                      onChange={(e) => setEditForm({...editForm, autoplay: e.target.checked})}
                                      className="rounded border-gray-300"
                                    />
                                    <Label htmlFor="autoplay">Autoplay</Label>
                                  </div>
                                  
                                  <div className="flex items-center space-x-2">
                                    <input
                                      type="checkbox"
                                      id="loop"
                                      checked={editForm.loop}
                                      onChange={(e) => setEditForm({...editForm, loop: e.target.checked})}
                                      className="rounded border-gray-300"
                                    />
                                    <Label htmlFor="loop">Loop</Label>
                                  </div>
                                  
                                  <div className="flex items-center space-x-2">
                                    <input
                                      type="checkbox"
                                      id="muted"
                                      checked={editForm.muted}
                                      onChange={(e) => setEditForm({...editForm, muted: e.target.checked})}
                                      className="rounded border-gray-300"
                                    />
                                    <Label htmlFor="muted">Silenziato</Label>
                                  </div>
                                  
                                  <div className="flex items-center space-x-2">
                                    <input
                                      type="checkbox"
                                      id="showControls"
                                      checked={editForm.showControls}
                                      onChange={(e) => setEditForm({...editForm, showControls: e.target.checked})}
                                      className="rounded border-gray-300"
                                    />
                                    <Label htmlFor="showControls">Mostra Controlli</Label>
                                  </div>
                                  
                                  <div>
                                    <Label htmlFor="posterImage">Immagine Poster (URL)</Label>
                                    <Input
                                      id="posterImage"
                                      type="text"
                                      value={editForm.posterImage || ''}
                                      onChange={(e) => setEditForm({...editForm, posterImage: e.target.value})}
                                      placeholder="URL dell'immagine poster"
                                    />
                                  </div>
                                  
                                  <div>
                                    <Label htmlFor="duration">Durata (secondi)</Label>
                                    <Input
                                      id="duration"
                                      type="number"
                                      value={editForm.duration || 0}
                                      onChange={(e) => setEditForm({...editForm, duration: parseInt(e.target.value) || 0})}
                                      placeholder="Durata in secondi"
                                    />
                                  </div>
                                </div>
                                <div className="flex justify-end mt-4">
                                  <Button 
                                    size="sm" 
                                    onClick={() => handleSectionSave('Impostazioni Video')}
                                    disabled={savingSection === 'Impostazioni Video'}
                                  >
                                    {savingSection === 'Impostazioni Video' ? 'Salvando...' : 'Salva Video'}
                                  </Button>
                                </div>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex justify-end gap-2 mt-6">
                        <Button variant="outline" onClick={() => setEditingImage(null)}>
                          Annulla
                        </Button>
                        <Button onClick={handleImageSave}>
                          Salva Modifiche
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedImage(image)}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleImageDelete(image.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredImages.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <ImageIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">Nessuna immagine trovata in questa sezione</p>
          </CardContent>
        </Card>
      )}

      {/* Preview Modal */}
      {selectedImage && (
        <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>{selectedImage.name}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <img
                src={selectedImage.url}
                alt={selectedImage.name}
                className="w-full max-h-96 object-contain rounded-lg"
              />
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <strong>Sezione:</strong> {selectedImage.section || 'Nessuna'}
                </div>
                <div>
                  <strong>Posizione:</strong> {selectedImage.position || 0}
                </div>
                <div>
                  <strong>Dimensione:</strong> {(selectedImage.size / 1024).toFixed(1)} KB
                </div>
                <div>
                  <strong>Tipo:</strong> {selectedImage.type}
                </div>
                {selectedImage.title && (
                  <div className="col-span-2">
                    <strong>Titolo:</strong> {selectedImage.title}
                  </div>
                )}
                {selectedImage.subtitle && (
                  <div className="col-span-2">
                    <strong>Sottotitolo:</strong> {selectedImage.subtitle}
                  </div>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}