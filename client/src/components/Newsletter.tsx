'use client';
import React, { useState } from 'react';
import { Mail } from 'lucide-react';

const Newsletter: React.FC = () => {
  const [email, setEmail] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle newsletter subscription
    console.log('Newsletter subscription:', email);
    setEmail('');
  };

  return (
    <section className="newsletter" aria-labelledby="newsletter-title">
      <h2 id="newsletter-title">Inscrivez‑vous à la newsletter.</h2>
      <form onSubmit={handleSubmit} className="field" noValidate>
        <Mail size={18} aria-hidden="true" />
        <input 
          type="email" 
          placeholder="Adresse email" 
          aria-label="Votre adresse email pour la newsletter"
          aria-describedby="newsletter-description"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
          required
        />
        <button type="submit" aria-label="S'inscrire à la newsletter">OK</button>
      </form>
      <div id="newsletter-description" className="disclaimer">
        En vous inscrivant, vous acceptez notre politique de confidentialité.
      </div>
    </section>
  );
};

export default Newsletter;