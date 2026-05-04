import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { HeroMediaRenderer } from './HeroMediaRenderer';

interface HeroImage {
  id: number;
  name: string;
  url: string;
  title?: string | null;
  subtitle?: string | null;
  buttonText?: string | null;
  linkUrl?: string | null;
  // Advanced styling options
  titleColor?: string | null;
  subtitleColor?: string | null;
  buttonColor?: string | null;
  buttonBgColor?: string | null;
  titleFont?: string | null;
  subtitleFont?: string | null;
  buttonFont?: string | null;
  titleSize?: string | null;
  subtitleSize?: string | null;
  textAlign?: string | null;
  titleWeight?: string | null;
  subtitleWeight?: string | null;
  buttonSize?: string | null;
  // Video support fields
  media_type?: string | null;
  autoplay?: boolean | null;
  loop?: boolean | null;
  muted?: boolean | null;
  showControls?: boolean | null;
  posterImage?: string | null;
}

const SimpleHeroCarousel: React.FC = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [slides, setSlides] = useState<HeroImage[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadHeroImages = async () => {
      try {
        console.log('🔄 Loading hero images...');
        setIsLoading(true);
        
        // Add cache busting to ensure fresh data
        const response = await fetch(`/api/images/hero?t=${Date.now()}`);
        if (response.ok) {
          const data = await response.json();
          console.log('✅ API Response:', data);
          
          // Safely map the images with proper type handling
          const mappedImages = (data.images || []).map((img: any) => ({
            ...img,
            uploadedAt: typeof img.uploadedAt === 'string' ? img.uploadedAt : new Date().toISOString(),
            createdAt: typeof img.createdAt === 'string' ? img.createdAt : new Date().toISOString()
          }));
          
          setSlides(mappedImages);
          console.log('✅ Carousel data loaded successfully:', mappedImages.length, 'images');
        } else {
          console.log('❌ API failed, using fallback');
          // Fallback slides with your image
          setSlides([
            {
              id: 1,
              name: "Baggy Party",
              url: "https://i.postimg.cc/4xVTmdj0/baggyita.jpg",
              title: "la baggy",
              subtitle: "party",
              buttonText: "scopri",
              linkUrl: "/baggy-party"
            }
          ]);
        }
      } catch (error) {
        console.error('❌ Error loading hero images:', error);
        // Always show your image as fallback
        setSlides([
          {
            id: 1,
            name: "Baggy Party",
            url: "https://i.postimg.cc/4xVTmdj0/baggyita.jpg",
            title: "la baggy",
            subtitle: "party", 
            buttonText: "scopri",
            linkUrl: "/baggy-party"
          }
        ]);
      } finally {
        console.log('🏁 Setting loading to false');
        setIsLoading(false);
      }
    };

    loadHeroImages();
  }, []);

  const go = (direction: number) => {
    if (slides.length > 0) {
      setCurrentIndex((prev) => (prev + direction + slides.length) % slides.length);
    }
  };

  // Auto-advance slides every 10 seconds - works even with 1 image for testing
  useEffect(() => {
    if (slides.length >= 1) {
      const interval = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % slides.length);
      }, 10000); // 10 seconds
      return () => clearInterval(interval);
    }
  }, [slides.length]);

  if (isLoading) {
    console.log('🔄 Showing loading state...');
    return (
      <div className="relative h-96 bg-gray-200 animate-pulse flex items-center justify-center">
        <span className="text-gray-500">Caricamento in corso...</span>
      </div>
    );
  }

  console.log('✅ Rendering carousel with', slides.length, 'slides');

  if (slides.length === 0) {
    return (
      <div className="relative h-96 bg-gradient-to-r from-gray-900 to-black flex items-center justify-center">
        <div className="text-center text-white">
          <h1 className="text-4xl md:text-6xl font-bold mb-4">gli essenziali</h1>
          <h2 className="text-2xl md:text-4xl font-light mb-6">della stagione</h2>
          <button className="bg-white text-black px-8 py-3 rounded-full hover:bg-gray-100 transition-colors">
            scopri
          </button>
        </div>
      </div>
    );
  }

  const currentSlide = slides[currentIndex];

  return (
    <div className="relative h-64 sm:h-80 md:h-96 lg:h-[500px] overflow-hidden bg-white">
      {/* Main slide - Image or Video */}
      <div className="relative w-full h-full">
        <HeroMediaRenderer slide={currentSlide} />
        
        {/* Content overlay with dynamic styling */}
        <div className={`absolute inset-0 flex items-end ${
          currentSlide.textAlign === 'left' ? 'justify-start' :
          currentSlide.textAlign === 'center' ? 'justify-center' : 'justify-end'
        }`}>
          <div className={`max-w-lg px-4 sm:px-8 md:px-12 pb-8 sm:pb-12 md:pb-16 ${
            currentSlide.textAlign === 'left' ? 'text-left' :
            currentSlide.textAlign === 'center' ? 'text-center' : 'text-right'
          }`}>
            {/* Title with dynamic styling */}
            {currentSlide.title && (
              <h1 
                className={`mb-2 sm:mb-3 drop-shadow-lg ${
                  currentSlide.titleSize === 'xs' ? 'text-xs' :
                  currentSlide.titleSize === 'sm' ? 'text-sm' :
                  currentSlide.titleSize === 'md' ? 'text-base' :
                  currentSlide.titleSize === 'lg' ? 'text-lg sm:text-xl' :
                  currentSlide.titleSize === 'xl' ? 'text-xl sm:text-2xl md:text-3xl' :
                  currentSlide.titleSize === '2xl' ? 'text-2xl sm:text-3xl md:text-4xl' :
                  currentSlide.titleSize === '3xl' ? 'text-3xl sm:text-4xl md:text-5xl' :
                  currentSlide.titleSize === '4xl' ? 'text-4xl sm:text-5xl md:text-6xl' :
                  currentSlide.titleSize === '5xl' ? 'text-5xl sm:text-6xl md:text-7xl' :
                  'text-2xl sm:text-3xl md:text-5xl lg:text-6xl'
                } ${
                  currentSlide.titleWeight === 'light' ? 'font-light' :
                  currentSlide.titleWeight === 'normal' ? 'font-normal' :
                  currentSlide.titleWeight === 'medium' ? 'font-medium' :
                  currentSlide.titleWeight === 'semibold' ? 'font-semibold' :
                  currentSlide.titleWeight === 'extrabold' ? 'font-extrabold' :
                  'font-bold'
                }`}
                style={{
                  color: currentSlide.titleColor || '#ffffff',
                  fontFamily: currentSlide.titleFont || 'Inter'
                }}
                onLoad={() => console.log('Title color applied:', currentSlide.titleColor)}
              >
                {currentSlide.title}
              </h1>
            )}
            
            {/* Subtitle with dynamic styling */}
            {currentSlide.subtitle && (
              <h2 
                className={`mb-6 sm:mb-8 drop-shadow-lg ${
                  currentSlide.subtitleSize === 'xs' ? 'text-xs' :
                  currentSlide.subtitleSize === 'sm' ? 'text-sm' :
                  currentSlide.subtitleSize === 'md' ? 'text-base' :
                  currentSlide.subtitleSize === 'lg' ? 'text-lg sm:text-xl' :
                  currentSlide.subtitleSize === 'xl' ? 'text-xl sm:text-2xl' :
                  currentSlide.subtitleSize === '2xl' ? 'text-2xl sm:text-3xl' :
                  currentSlide.subtitleSize === '3xl' ? 'text-3xl sm:text-4xl' :
                  'text-lg sm:text-xl md:text-3xl lg:text-4xl'
                } ${
                  currentSlide.subtitleWeight === 'light' ? 'font-light' :
                  currentSlide.subtitleWeight === 'medium' ? 'font-medium' :
                  currentSlide.subtitleWeight === 'semibold' ? 'font-semibold' :
                  currentSlide.subtitleWeight === 'bold' ? 'font-bold' :
                  'font-normal'
                }`}
                style={{
                  color: currentSlide.subtitleColor || '#ffffff',
                  fontFamily: currentSlide.subtitleFont || 'Inter'
                }}
              >
                {currentSlide.subtitle}
              </h2>
            )}
            
            {/* Call to action button with dynamic styling */}
            {currentSlide.buttonText && (
              <a 
                href={currentSlide.linkUrl || "#"}
                className={`inline-block px-6 sm:px-8 py-2 sm:py-3 rounded-full transition-all duration-300 drop-shadow-lg hover:scale-105 ${
                  currentSlide.buttonSize === 'xs' ? 'px-3 py-1 text-xs' :
                  currentSlide.buttonSize === 'sm' ? 'px-4 py-2 text-sm' :
                  currentSlide.buttonSize === 'lg' ? 'px-10 py-4 text-lg' :
                  currentSlide.buttonSize === 'xl' ? 'px-12 py-5 text-xl' :
                  'px-6 sm:px-8 py-2 sm:py-3'
                }`}
                style={{
                  backgroundColor: currentSlide.buttonBgColor || '#ffffff',
                  color: currentSlide.buttonColor || '#000000',
                  fontFamily: currentSlide.buttonFont || 'Inter'
                }}
              >
                {currentSlide.buttonText}
              </a>
            )}
          </div>
        </div>
      </div>
      
      {/* Navigation arrows - only show if multiple slides */}
      {slides.length > 1 && (
        <>
          <button 
            onClick={() => go(-1)}
            className="absolute left-2 sm:left-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 sm:p-3 rounded-full hover:bg-opacity-75 transition-all"
          >
            <ChevronLeft className="w-4 h-4 sm:w-6 sm:h-6" />
          </button>
          <button 
            onClick={() => go(1)}
            className="absolute right-2 sm:right-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 sm:p-3 rounded-full hover:bg-opacity-75 transition-all"
          >
            <ChevronRight className="w-4 h-4 sm:w-6 sm:h-6" />
          </button>
        </>
      )}
      
      {/* Dots indicator - only show if multiple slides */}
      {slides.length > 1 && (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`w-2 h-2 sm:w-3 sm:h-3 rounded-full transition-all ${
                index === currentIndex ? 'bg-white' : 'bg-white bg-opacity-50'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default SimpleHeroCarousel;