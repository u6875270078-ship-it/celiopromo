'use client';
import React, { useState } from 'react';
import { Plus, Minus } from 'lucide-react';

const Footer: React.FC = () => {
  const [openSections, setOpenSections] = useState<{[key: string]: boolean}>({});

  const toggleSection = (section: string) => {
    setOpenSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const footerSections = [
    {
      title: "Le nostre categorie",
      items: ["T‑shirt", "Jeans", "Pantaloni", "Camicie", "Giacche"]
    },
    {
      title: "Chi siamo",
      items: ["La nostra storia", "Sostenibilità", "Lavora con noi"]
    },
    {
      title: "Negozi e servizi",
      items: ["Trova un negozio"]
    },
    {
      title: "Aiuto",
      items: ["FAQ", "Contattaci"]
    }
  ];

  const legalLinks = [
    "Condizioni generali",
    "Informativa sulla privacy",
    "Note legali",
    "Accessibilità",
    "Sitemap",
    "Gestisci i cookie"
  ];

  return (
    <footer role="contentinfo">
      <div className="container">
        <nav className="foot-grids" aria-label="Navigazione del footer">
          {footerSections.map((section, index) => (
            <div key={index} className="foot-col">
              <h3 
                onClick={() => toggleSection(section.title)}
                className="collapsible-header"
                role="button"
                tabIndex={0}
                aria-expanded={openSections[section.title] ? 'true' : 'false'}
                aria-controls={`footer-section-${index}`}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    toggleSection(section.title);
                  }
                }}
              >
                {section.title}
                {openSections[section.title] ? <Minus size={16} /> : <Plus size={16} />}
              </h3>
              <ul 
                id={`footer-section-${index}`}
                className={openSections[section.title] ? 'expanded' : ''}
                aria-hidden={!openSections[section.title] ? 'true' : 'false'}
              >
                {section.items.map((item, itemIndex) => (
                  <li key={itemIndex}>
                    <a href={`#${item.toLowerCase().replace(/\s+/g, '-')}`}>{item}</a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>
        <nav className="legal" aria-label="Link legali">
          {legalLinks.map((link, index) => (
            <a key={index} href={`#${link.toLowerCase().replace(/\s+/g, '-')}`}>{link}</a>
          ))}
        </nav>
      </div>
    </footer>
  );
};

export default Footer;