interface HeroMediaRendererProps {
  slide: any;
}

export function HeroMediaRenderer({ slide }: HeroMediaRendererProps) {
  if (slide.mediaType === 'video') {
    // Check if it's a Wistia video (iframe embed)
    const isWistiaVideo = /wistia\.com/.test(slide.url);
    
    if (isWistiaVideo) {
      // Add autoplay parameters to Wistia URL
      const autoplayUrl = slide.url.includes('?') 
        ? `${slide.url}&autoPlay=true&muted=true&playButton=false&volume=0`
        : `${slide.url}?autoPlay=true&muted=true&playButton=false&volume=0`;
      
      return (
        <iframe
          src={autoplayUrl}
          className="w-full h-full object-cover object-center"
          style={{
            minHeight: '100%',
            minWidth: '100%',
            display: 'block',
            border: 'none'
          }}
          allow="autoplay; fullscreen; picture-in-picture"
          allowFullScreen
          onError={(e) => {
            console.error('Wistia iframe failed to load:', autoplayUrl);
          }}
        />
      );
    }
    
    // Handle regular video files
    return (
      <video
        src={slide.url}
        className="w-full h-full object-cover object-center"
        autoPlay={slide.autoplay ?? false}
        loop={slide.loop ?? true}
        muted={slide.muted ?? true}
        controls={slide.showControls ?? false}
        poster={slide.posterImage || undefined}
        playsInline
        style={{
          minHeight: '100%',
          minWidth: '100%',
          display: 'block'
        }}
        onError={(e) => {
          console.error('Video failed to load:', slide.url);
          e.currentTarget.style.display = 'none';
        }}
      />
    );
  }

  return (
    <img 
      src={slide.url} 
      alt={slide.name}
      className="w-full h-full object-cover object-center"
      loading="eager"
      style={{ 
        minHeight: '100%',
        minWidth: '100%',
        display: 'block'
      }}
      onError={(e) => {
        console.error('Image failed to load:', slide.url);
        e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAwIiBoZWlnaHQ9IjQwMCIgdmlld0JveD0iMCAwIDgwMCA0MDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI4MDAiIGhlaWdodD0iNDAwIiBmaWxsPSIjMTExMTExIi8+Cjx0ZXh0IHg9IjQwMCIgeT0iMjAwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSIjZmZmZmZmIiBmb250LXNpemU9IjI0Ij5DZWXLIO0FnZy48L3RleHQ+Cjwvc3ZnPgo=';
      }}
    />
  );
}