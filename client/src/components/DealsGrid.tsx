import React from 'react';

const DealsGrid: React.FC = () => {
  const deals = [
    {
      image: "https://images.unsplash.com/photo-1602810318383-4c53b9c07d4a?q=80&w=1349&auto=format&fit=crop",
      title: "Set di 3 t‑shirt essenziali",
      alt: "Set t‑shirt"
    },
    {
      image: "https://images.unsplash.com/photo-1583496661160-fb5886a0aaaa?q=80&w=1349&auto=format&fit=crop",
      title: "Set di 3 boxer",
      alt: "Set boxer"
    },
    {
      image: "https://images.unsplash.com/photo-1520962862888-567d6e03b4b8?q=80&w=1349&auto=format&fit=crop",
      title: "Set di 3 paia di calzini",
      alt: "Set calzini"
    },
    {
      image: "https://images.unsplash.com/photo-1495107334309-fcf20504a5ab?q=80&w=1349&auto=format&fit=crop",
      title: "Set di accessori essenziali",
      alt: "Set accessori"
    }
  ];

  return (
    <section aria-labelledby="deals-title">
      <h2 id="deals-title" className="section-title" style={{ marginTop: '26px' }}>
        Offerte
      </h2>
      <div className="deals" role="list">
        {deals.map((deal, index) => (
          <article key={index} className="deal" role="listitem">
            <img 
              src={deal.image} 
              alt={deal.alt}
              loading="lazy"
            />
            <div className="info">
              <h3>{deal.title}</h3>
              <div className="cta">
                <a
                  className="btn-pill secondary"
                  href={`#deal-${index + 1}`}
                  aria-label={`Scopri: ${deal.title}`}
                >
                  scopri
                </a>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
};

export default DealsGrid;