import React from 'react';

const ProductChips: React.FC = () => {
  const products = [
    {
      image: "https://images.unsplash.com/photo-1548883354-1f4ed2151f6f?q=80&w=1200&auto=format&fit=crop",
      title: "Le jean baggy",
      alt: "Jean baggy"
    },
    {
      image: "https://images.unsplash.com/photo-1516762689617-e1cffcef479d?q=80&w=1200&auto=format&fit=crop",
      title: "Le 24h baggy",
      alt: "24h baggy"
    },
    {
      image: "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=1200&auto=format&fit=crop",
      title: "Le chino baggy",
      alt: "Chino baggy"
    }
  ];

  return (
    <section className="chip-cards" aria-label="Prodotti in evidenza">
      {products.map((product, index) => (
        <article key={index} className="chip-card">
          <img 
            src={product.image} 
            alt={product.alt}
            loading="lazy"
          />
          <h3>{product.title}</h3>
          <a 
            className="btn-pill" 
            href={`#${product.title.toLowerCase().replace(/\s+/g, '-')}`}
            aria-label={`Scopri ${product.title}`}
          >
            scopri
          </a>
        </article>
      ))}
    </section>
  );
};

export default ProductChips;