import React from 'react';
import { Instagram, Facebook, Twitter, Youtube, MapPin, Linkedin } from 'lucide-react';

const SocialLinks: React.FC = () => {
  const socialIcons = [
    { icon: Instagram, label: 'Instagram' },
    { icon: Facebook, label: 'Facebook' },
    { icon: Twitter, label: 'Twitter' },
    { icon: Youtube, label: 'YouTube' },
    { icon: MapPin, label: 'Pinterest' },
    { icon: Linkedin, label: 'LinkedIn' }
  ];

  return (
    <section className="social" aria-labelledby="social-title">
      <h2 id="social-title">Suivez‑nous sur les réseaux</h2>
      <div className="icons" role="list">
        {socialIcons.map((social, index) => {
          const IconComponent = social.icon;
          return (
            <a 
              key={index} 
              href={`#${social.label.toLowerCase()}`} 
              aria-label={`Suivez-nous sur ${social.label}`}
              role="listitem"
            >
              <IconComponent size={20} />
            </a>
          );
        })}
      </div>
    </section>
  );
};

export default SocialLinks;