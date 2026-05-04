import React from 'react';
import { Truck, Shield } from 'lucide-react';

const ServicePerks: React.FC = () => {
  const perks = [
    {
      icon: Truck,
      title: "Disponibile in negozio",
      subtitle: "In tutta Italia"
    },
    {
      icon: Shield,
      title: "Qualità garantita",
      subtitle: "Materiali selezionati"
    }
  ];

  return (
    <section className="perks" aria-label="I nostri servizi" role="list">
      {perks.map((perk, index) => {
        const IconComponent = perk.icon;
        return (
          <div key={index} className="perk" role="listitem">
            <div className="icon" aria-hidden="true">
              <IconComponent size={24} />
            </div>
            <div>
              <h3 className="t">{perk.title}</h3>
              <div className="s">{perk.subtitle}</div>
            </div>
          </div>
        );
      })}
    </section>
  );
};

export default ServicePerks;