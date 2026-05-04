'use client';
import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { PublicImage } from '@shared/schema';

const HeroCarousel: React.FC = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [slides, setSlides] = useState<PublicImage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Load hero images from database
  useEffect(() => {
    const loadHeroImages = async () => {
      try {
        const response = await fetch('/api/images/hero');
        if (response.ok) {
          const data = await response.json();
          // Convert string dates to Date objects to match TypeScript type
          const processedImages = (data.images || []).map((image: any) => ({
            ...image,
            uploadedAt: new Date(image.uploadedAt),
            createdAt: new Date(image.createdAt)
          }));
          setSlides(processedImages);
        } else {
          // Fallback to default slides if API fails
          setSlides([
            {
              id: 1,
              name: "La Baggy Party",
              url: "https://images.unsplash.com/photo-1566150905458-1bf1fc113f0d?q=80&w=1974&auto=format&fit=crop",
              path: "",
              size: 0,
              type: "image/jpeg",
              section: "hero",
              position: 0,
              isActive: true,
              title: "la baggy",
              subtitle: "party",
              buttonText: "scoprire",
              linkUrl: "/baggy-party",
              uploadedAt: new Date(),
              createdAt: new Date()
            }
          ]);
        }
      } catch (error) {
        console.error('Error loading hero images:', error);
        // Fallback slides
        setSlides([
          {
            id: 1,
            name: "La Baggy Party",
            url: "https://images.unsplash.com/photo-1566150905458-1bf1fc113f0d?q=80&w=1974&auto=format&fit=crop",
            path: "",
            size: 0,
            type: "image/jpeg",
            section: "hero",
            position: 0,
            isActive: true,
            title: "la baggy",
            subtitle: "party",
            buttonText: "scoprire",
            linkUrl: "/baggy-party",
            uploadedAt: new Date(),
            createdAt: new Date()
          }
        ]);
      } finally {
        setIsLoading(false);
      }
    };

    loadHeroImages();
  }, []);

  const go = (direction: number) => {
    setCurrentIndex((prev) => (prev + direction + slides.length) % slides.length);
  };

  useEffect(() => {
    if (slides.length > 0) {
      const interval = setInterval(() => {
        go(1);
      }, 4000); // Change every 4 seconds like Celio
      return () => clearInterval(interval);
    }
  }, [slides.length]);
  

  if (isLoading) {
    return (
      <section className="experience-component experience-commerce_assets-bannerWithLinksComponent">
        <div className="banner-with-links__image-banner h-96 bg-gray-200 animate-pulse flex items-center justify-center">
          <span className="text-gray-500">Caricamento...</span>
        </div>
      </section>
    );
  }

  if (slides.length === 0) {
    return (
      <section className="experience-component experience-commerce_assets-bannerWithLinksComponent">
        <div className="banner-with-links__image-banner h-96 bg-gray-100 flex items-center justify-center">
          <span className="text-gray-600">Nessuna immagine hero configurata</span>
        </div>
      </section>
    );
  }

  return (
    <section className="experience-component experience-commerce_assets-bannerWithLinksComponent">
      <div className="banner-with-links__image-banner" role="region" aria-live="polite" aria-label="Images promotionnelles">
        <div className="banner-slides" style={{ transform: `translateX(-${currentIndex * 100}%)` }}>
          {slides.map((slide, index) => (
            <div 
              key={slide.id} 
              className="banner-slide"
              role="tabpanel"
              aria-hidden={index !== currentIndex ? 'true' : 'false'}
              aria-label={`Slide ${index + 1} sur ${slides.length}`}
            >
              <div className="relative w-full h-full">
                <img 
                  src={slide.url} 
                  alt={slide.name}
                  loading={index === 0 ? 'eager' : 'lazy'}
                  className="w-full h-full object-cover"
                />
                {/* Content Overlay - Celio Style Layout */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="max-w-6xl mx-auto px-4 w-full">
                    <div className="relative">
                      
                      {/* Text content positioned over the products like original */}
                      <div className="absolute top-1/2 right-8 transform -translate-y-1/2 text-white text-right">
                        {slide.title && (
                          <h1 className="text-4xl md:text-5xl font-bold mb-2">
                            {slide.title}
                          </h1>
                        )}
                        {slide.subtitle && (
                          <h2 className="text-2xl md:text-3xl font-light mb-4">
                            {slide.subtitle}
                          </h2>
                        )}
                        {slide.linkUrl && slide.buttonText && (
                          <a 
                            href={slide.linkUrl}
                            className="inline-block bg-black text-white px-6 py-2 rounded-full hover:bg-gray-800 transition-colors font-medium text-sm"
                          >
                            {slide.buttonText}
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="hero-nav" role="group" aria-label="Navigation du carrousel">
          <button 
            className="nav-btn" 
            onClick={() => go(-1)} 
            aria-label="Image précédente"
            type="button"
          >
            <ChevronLeft size={20} />
          </button>
          <button 
            className="nav-btn" 
            onClick={() => go(1)} 
            aria-label="Image suivante"
            type="button"
          >
            <ChevronRight size={20} />
          </button>
        </div>
        {/* Slide Indicators */}
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`w-2 h-2 rounded-full transition-all duration-300 ${
                index === currentIndex ? 'bg-white' : 'bg-white bg-opacity-50'
              }`}
              aria-label={`Vai alla slide ${index + 1}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default HeroCarousel;