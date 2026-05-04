import React from 'react';

const PromoBar: React.FC = () => {
  const promoItems = [
    "10% di sconto sulla nuova collezione",
    "Ultime novità disponibili"
  ];

  return (
    <div className="promo">
      <div className="container">
        <div className="track">
          {promoItems.map((item, index) => (
            <div key={index}>{item}</div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PromoBar;