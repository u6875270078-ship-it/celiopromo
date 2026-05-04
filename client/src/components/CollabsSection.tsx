import React from 'react';

const CollabsSection: React.FC = () => {
  const collabs = [
    {
      image: "https://images.unsplash.com/photo-1520975916090-3105956dac38?q=80&w=1600&auto=format&fit=crop",
      alt: "Collab 1"
    },
    {
      image: "https://images.unsplash.com/photo-1516826957135-700dedea698c?q=80&w=1600&auto=format&fit=crop",
      alt: "Collab 2"
    },
    {
      image: "https://images.unsplash.com/photo-1516826957132-13dbc8f4f6bd?q=80&w=1600&auto=format&fit=crop",
      alt: "Collab 3"
    }
  ];

  return (
    <section aria-labelledby="collabs-title">
      <h2 id="collabs-title" className="section-title">le collab dell'estate sono qui.</h2>
      <div className="collabs" role="list">
        {collabs.map((collab, index) => (
          <a 
            key={index} 
            className="tile" 
            href={`#collab-${index + 1}`}
            role="listitem"
            aria-label={`Vedi la collaborazione ${index + 1}`}
          >
            <img 
              src={collab.image} 
              alt={collab.alt}
              loading="lazy"
            />
          </a>
        ))}
      </div>
    </section>
  );
};

export default CollabsSection;