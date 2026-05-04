import { Resend } from 'resend';

export interface ContactFormData {
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
}

export interface OrderNotificationData {
  customerEmail: string;
  customerName: string;
  orderNumber: string;
  orderTotal: string;
  shippingAddress?: string | {
    firstName: string;
    lastName: string;
    line1: string;
    city: string;
    postalCode: string;
    country: string;
    phone?: string;
  };
  billingAddress?: string | {
    firstName: string;
    lastName: string;
    line1: string;
    city: string;
    postalCode: string;
    country: string;
    phone?: string;
  };
  paymentMethod?: string;
  items: Array<{
    name: string;
    quantity: number;
    price: string;
    productId?: number;
  }>;
}

export class EmailService {
  private fromEmail: string;
  private supportEmail: string;
  private apiKey: string;

  constructor() {
    // Load configuration from environment/admin settings - using verified domain
    this.fromEmail = process.env.EMAIL_FROM || 'admin@havanabarbiella.it';
    this.supportEmail = process.env.EMAIL_ADMIN || 'admin@havanabarbiella.it';
    this.apiKey = process.env.RESEND_API_KEY || '';
    
    // Debug log configuration
    console.log(`📧 Email service initialized:`, {
      fromEmail: this.fromEmail,
      supportEmail: this.supportEmail,
      hasApiKey: !!this.apiKey
    });
  }

  // Method to update configuration dynamically
  updateConfig(config: { fromEmail?: string; supportEmail?: string; apiKey?: string }) {
    if (config.fromEmail) this.fromEmail = config.fromEmail;
    if (config.supportEmail) this.supportEmail = config.supportEmail;
    if (config.apiKey) this.apiKey = config.apiKey;
  }

  // Get current Resend instance with latest API key
  private getResendInstance(): Resend {
    const apiKey = this.apiKey || process.env.RESEND_API_KEY;
    if (!apiKey) {
      throw new Error('Resend API key not configured');
    }
    return new Resend(apiKey);
  }

  async sendContactFormEmail(data: ContactFormData): Promise<boolean> {
    try {
      const resend = this.getResendInstance();
      await resend.emails.send({
        from: this.fromEmail,
        to: this.supportEmail,
        subject: `Nuovo messaggio di contatto: ${data.subject}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: #f8f9fa; padding: 20px; border-radius: 8px;">
              <h2 style="color: #333; margin-bottom: 20px;">Nuovo Messaggio di Contatto</h2>
              
              <div style="background: white; padding: 20px; border-radius: 6px; margin-bottom: 15px;">
                <h3 style="color: #555; margin-bottom: 10px;">Dettagli del Cliente</h3>
                <p><strong>Nome:</strong> ${data.name}</p>
                <p><strong>Email:</strong> ${data.email}</p>
                ${data.phone ? `<p><strong>Telefono:</strong> ${data.phone}</p>` : ''}
                <p><strong>Oggetto:</strong> ${data.subject}</p>
              </div>
              
              <div style="background: white; padding: 20px; border-radius: 6px;">
                <h3 style="color: #555; margin-bottom: 10px;">Messaggio</h3>
                <p style="line-height: 1.6;">${data.message.replace(/\n/g, '<br>')}</p>
              </div>
              
              <div style="margin-top: 20px; padding: 15px; background: #e9ecef; border-radius: 6px;">
                <p style="margin: 0; font-size: 12px; color: #666;">
                  Questo messaggio è stato inviato tramite il modulo di contatto del sito Celio.
                </p>
              </div>
            </div>
          </div>
        `,
      });

      // Send confirmation email to customer
      await resend.emails.send({
        from: this.fromEmail,
        to: data.email,
        subject: 'Conferma ricezione del tuo messaggio - Celio',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
              <h1 style="margin: 0; font-size: 28px;">Celio</h1>
              <p style="margin: 10px 0 0 0; opacity: 0.9;">be normal</p>
            </div>
            
            <div style="background: white; padding: 30px; border-radius: 0 0 8px 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
              <h2 style="color: #333; margin-bottom: 20px;">Grazie per averci contattato!</h2>
              
              <p style="color: #666; line-height: 1.6; margin-bottom: 20px;">
                Caro/a <strong>${data.name}</strong>,
              </p>
              
              <p style="color: #666; line-height: 1.6; margin-bottom: 20px;">
                Abbiamo ricevuto il tuo messaggio riguardo: <strong>${data.subject}</strong>
              </p>
              
              <p style="color: #666; line-height: 1.6; margin-bottom: 20px;">
                Il nostro team di supporto clienti ti risponderà il prima possibile, solitamente entro 24 ore lavorative.
              </p>
              
              <div style="background: #f8f9fa; padding: 20px; border-radius: 6px; margin: 20px 0;">
                <h3 style="color: #555; margin-bottom: 15px;">Contatti di Supporto</h3>
                <p style="margin: 5px 0; color: #666;"><strong>📧 Email:</strong> supporto@celio.com</p>
                <p style="margin: 5px 0; color: #666;"><strong>📞 Telefono:</strong> +39 02 1234 5678</p>
                <p style="margin: 5px 0; color: #666;"><strong>🕒 Orari:</strong> Lun-Ven 9:00-18:00</p>
              </div>
              
              <p style="color: #666; line-height: 1.6;">
                Grazie per aver scelto Celio!<br>
                <strong>Il Team Celio</strong>
              </p>
            </div>
          </div>
        `,
      });

      return true;
    } catch (error) {
      console.error('Error sending contact form email:', error);
      return false;
    }
  }

  async sendOrderConfirmationEmail(data: OrderNotificationData): Promise<boolean> {
    try {
      // Parse shipping and billing addresses if they're JSON strings
      const shippingAddress = typeof data.shippingAddress === 'string' ? JSON.parse(data.shippingAddress) : data.shippingAddress;
      const billingAddress = data.billingAddress ? 
        (typeof data.billingAddress === 'string' ? JSON.parse(data.billingAddress) : data.billingAddress) : 
        shippingAddress;

      // Calculate VAT and subtotals
      const subtotal = parseFloat(data.orderTotal?.replace('€', '') || '0');
      const vatRate = 0.22; // 22% VAT for Italy
      const vatAmount = subtotal * vatRate / (1 + vatRate);
      const subtotalWithoutVat = subtotal - vatAmount;
      
      // Current date for invoice
      const invoiceDate = new Date().toLocaleDateString('it-IT', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      
      // Expected delivery date (5-7 working days)
      const deliveryDate = new Date();
      deliveryDate.setDate(deliveryDate.getDate() + 7);
      const expectedDelivery = deliveryDate.toLocaleDateString('it-IT', {
        year: 'numeric',
        month: 'long', 
        day: 'numeric'
      });

      const itemsHtml = data.items.map(item => {
        const itemPrice = parseFloat(item.price?.replace('€', '') || '0');
        const itemTotal = itemPrice * item.quantity;
        return `
          <tr style="border-bottom: 1px solid #ddd;">
            <td style="padding: 12px; color: #333;">
              <strong>${item.name}</strong><br>
              <span style="font-size: 12px; color: #666;">Codice: ${item.productId || 'N/A'}</span>
            </td>
            <td style="padding: 12px; text-align: center; color: #333;">${item.quantity}</td>
            <td style="padding: 12px; text-align: right; color: #333;">€${itemPrice.toFixed(2)}</td>
            <td style="padding: 12px; text-align: right; color: #333; font-weight: bold;">€${itemTotal.toFixed(2)}</td>
          </tr>`;
      }).join('');

      const resend = this.getResendInstance();
      await resend.emails.send({
        from: this.fromEmail,
        to: data.customerEmail,
        subject: `📧 Conferma d'Ordine e Fattura #${data.orderNumber} - Celio Italia`,
        html: `
          <!DOCTYPE html>
          <html lang="it">
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Conferma Ordine ${data.orderNumber}</title>
          </head>
          <body style="margin: 0; padding: 0; background-color: #f5f5f5; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
            <div style="max-width: 700px; margin: 0 auto; background-color: white;">
              
              <!-- Header with Company Logo -->
              <div style="background: linear-gradient(135deg, #2c3e50 0%, #34495e 100%); color: white; padding: 40px 30px; text-align: center;">
                <!-- Official Celio Logo -->
                <div style="margin-bottom: 25px;">
                  <img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAASIAAACuCAMAAAClZfCTAAAA8FBMVEX////YGSH9///+//38///WAADYCBT//fjibnLwsLPke37VAAzuq6z//f/WGiL///ronJ7VEBf62t3hUlfsoqP11dXRAADfP0rphIjpmZnZGB7ZAADaGB/UGh756uvSAAnhXGDpjY7YISn88vDTERXttrLyvLznmZ/2z9Dqkpn18vHjZ2fhdHvZVVj96eTwrKvjZW3ig3/bLzT86eHaNz/dOUj3ycr88+z1zM/+7/HcSEbYIy/si5Pjd3bdTlH34uLwvrTlUFvaQkLad4DaUVv1usHrkZHhOzvXKzv61tvjfHflbW742NHXKyzxoKnutLwv6HmzAAAPu0lEQVR4nO1cDVvbtha2ZUkOEZYRIQ5R7CTEIaVAgeVmKYxCut61a1e6/f9/c8+xkyAbQnFJWXsfvWV" 
                       alt="Celio Official Logo" 
                       style="max-width: 280px; height: auto; background: white; padding: 20px; border-radius: 12px; box-shadow: 0 4px 15px rgba(0,0,0,0.2);" />
                </div>
                
                <p style="margin: 15px 0 0 0; opacity: 0.9; font-size: 16px; letter-spacing: 3px; font-weight: 300;">ITALIA • BE NORMAL</p>
                
                <div style="margin-top: 25px; padding-top: 25px; border-top: 1px solid rgba(255,255,255,0.3);">
                  <h2 style="margin: 0; font-size: 26px; font-weight: 300; text-transform: uppercase;">Conferma d'Ordine</h2>
                  <p style="margin: 8px 0 0 0; font-size: 18px; opacity: 0.9;">Fattura N° ${data.orderNumber}</p>
                </div>
              </div>
              
              <!-- Invoice Details -->
              <div style="padding: 30px;">
                
                <!-- Order & Customer Info -->
                <div style="display: flex; justify-content: space-between; margin-bottom: 30px; border-bottom: 2px solid #f0f0f0; padding-bottom: 20px;">
                  <div style="flex: 1; margin-right: 20px;">
                    <h3 style="color: #2c3e50; margin: 0 0 15px 0; font-size: 18px;">📋 Dettagli Ordine</h3>
                    <p style="margin: 5px 0; color: #555;"><strong>Numero Ordine:</strong> ${data.orderNumber}</p>
                    <p style="margin: 5px 0; color: #555;"><strong>Data Ordine:</strong> ${invoiceDate}</p>
                    <p style="margin: 5px 0; color: #555;"><strong>Metodo Pagamento:</strong> ${data.paymentMethod || 'Carta di Credito'}</p>
                    <p style="margin: 5px 0; color: #555;"><strong>Stato:</strong> <span style="color: #27ae60; font-weight: bold;">✅ CONFERMATO</span></p>
                  </div>
                  <div style="flex: 1;">
                    <h3 style="color: #2c3e50; margin: 0 0 15px 0; font-size: 18px;">👤 Cliente</h3>
                    <p style="margin: 5px 0; color: #333; font-weight: bold; font-size: 16px;">${data.customerName}</p>
                    <p style="margin: 5px 0; color: #555;">${data.customerEmail}</p>
                    ${shippingAddress?.phone ? `<p style="margin: 5px 0; color: #555;">📞 ${shippingAddress.phone}</p>` : ''}
                  </div>
                </div>
                
                <!-- Shipping & Billing Addresses -->
                <div style="display: flex; gap: 30px; margin-bottom: 30px;">
                  <div style="flex: 1; background: #f8f9fa; padding: 20px; border-radius: 8px;">
                    <h3 style="color: #2c3e50; margin: 0 0 15px 0; font-size: 16px;">📦 Indirizzo di Spedizione</h3>
                    <p style="margin: 0; color: #555; line-height: 1.6;">
                      ${shippingAddress?.firstName} ${shippingAddress?.lastName}<br>
                      ${shippingAddress?.line1}<br>
                      ${shippingAddress?.city}, ${shippingAddress?.postalCode}<br>
                      ${shippingAddress?.country}
                    </p>
                  </div>
                  <div style="flex: 1; background: #f8f9fa; padding: 20px; border-radius: 8px;">
                    <h3 style="color: #2c3e50; margin: 0 0 15px 0; font-size: 16px;">💳 Indirizzo di Fatturazione</h3>
                    <p style="margin: 0; color: #555; line-height: 1.6;">
                      ${billingAddress?.firstName} ${billingAddress?.lastName}<br>
                      ${billingAddress?.line1}<br>
                      ${billingAddress?.city}, ${billingAddress?.postalCode}<br>
                      ${billingAddress?.country}
                    </p>
                  </div>
                </div>
                
                <!-- Products Table -->
                <div style="margin-bottom: 30px;">
                  <h3 style="color: #2c3e50; margin-bottom: 20px; font-size: 18px; border-bottom: 2px solid #3498db; padding-bottom: 10px;">🛍️ Prodotti Ordinati</h3>
                  <table style="width: 100%; border-collapse: collapse; background: white; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                    <thead>
                      <tr style="background: linear-gradient(135deg, #3498db, #2980b9); color: white;">
                        <th style="padding: 15px; text-align: left; font-weight: 600;">Prodotto</th>
                        <th style="padding: 15px; text-align: center; font-weight: 600;">Qtà</th>
                        <th style="padding: 15px; text-align: right; font-weight: 600;">Prezzo Unit.</th>
                        <th style="padding: 15px; text-align: right; font-weight: 600;">Totale</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${itemsHtml}
                    </tbody>
                  </table>
                </div>
                
                <!-- Pricing Breakdown -->
                <div style="background: linear-gradient(135deg, #ecf0f1, #bdc3c7); padding: 25px; border-radius: 10px; margin-bottom: 30px;">
                  <h3 style="color: #2c3e50; margin: 0 0 20px 0; font-size: 18px;">💰 Riepilogo Prezzi</h3>
                  <div style="background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 5px rgba(0,0,0,0.1);">
                    <div style="display: flex; justify-content: space-between; margin-bottom: 10px; padding-bottom: 10px; border-bottom: 1px solid #eee;">
                      <span style="color: #555;">Subtotale (escl. IVA):</span>
                      <span style="color: #333; font-weight: bold;">€${subtotalWithoutVat.toFixed(2)}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; margin-bottom: 10px; padding-bottom: 10px; border-bottom: 1px solid #eee;">
                      <span style="color: #555;">IVA (22%):</span>
                      <span style="color: #e74c3c; font-weight: bold;">€${vatAmount.toFixed(2)}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; margin-bottom: 10px; padding-bottom: 10px; border-bottom: 1px solid #eee;">
                      <span style="color: #555;">Spedizione:</span>
                      <span style="color: #27ae60; font-weight: bold;">GRATUITA</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; padding-top: 10px; border-top: 2px solid #3498db;">
                      <span style="color: #2c3e50; font-size: 20px; font-weight: bold;">TOTALE:</span>
                      <span style="color: #2c3e50; font-size: 24px; font-weight: bold;">${data.orderTotal}</span>
                    </div>
                  </div>
                </div>
                
                <!-- Delivery Information -->
                <div style="background: linear-gradient(135deg, #2ecc71, #27ae60); color: white; padding: 25px; border-radius: 10px; margin-bottom: 30px;">
                  <h3 style="margin: 0 0 15px 0; font-size: 18px;">🚚 Informazioni sulla Consegna</h3>
                  <div style="background: rgba(255,255,255,0.1); padding: 15px; border-radius: 8px;">
                    <p style="margin: 5px 0;">📅 <strong>Consegna Prevista:</strong> ${expectedDelivery}</p>
                    <p style="margin: 5px 0;">⏰ <strong>Tempi di Consegna:</strong> 5-7 giorni lavorativi</p>
                    <p style="margin: 5px 0;">📦 <strong>Corriere:</strong> Poste Italiane con tracciamento</p>
                    <p style="margin: 5px 0;">💌 <strong>Tracking:</strong> Riceverai email con codice di tracciamento</p>
                    <p style="margin: 5px 0;">🎁 <strong>Imballaggio:</strong> Confezione regalo gratuita disponibile</p>
                  </div>
                </div>
                
                <!-- Support Information -->
                <div style="background: #f8f9fa; padding: 25px; border-radius: 10px; margin-bottom: 30px; border-left: 5px solid #3498db;">
                  <h3 style="color: #2c3e50; margin: 0 0 15px 0; font-size: 18px;">📞 Assistenza Clienti</h3>
                  <div style="display: flex; gap: 30px;">
                    <div style="flex: 1;">
                      <p style="margin: 5px 0; color: #555;"><strong>📧 Email:</strong> ${this.supportEmail}</p>
                      <p style="margin: 5px 0; color: #555;"><strong>📞 Telefono:</strong> +39 015 123 4567</p>
                      <p style="margin: 5px 0; color: #555;"><strong>💬 WhatsApp:</strong> +39 348 123 4567</p>
                    </div>
                    <div style="flex: 1;">
                      <p style="margin: 5px 0; color: #555;"><strong>🕒 Orari:</strong> Lun-Ven 9:00-18:00</p>
                      <p style="margin: 5px 0; color: #555;"><strong>🌍 Online:</strong> 24/7 sul nostro sito</p>
                      <p style="margin: 5px 0; color: #555;"><strong>⭐ Rating:</strong> 4.8/5 Eccellente</p>
                    </div>
                  </div>
                </div>
                
                <!-- Footer -->
                <div style="text-align: center; border-top: 2px solid #ecf0f1; padding-top: 25px;">
                  <h3 style="color: #2c3e50; margin-bottom: 15px;">Grazie per aver scelto Celio Italia! 🇮🇹</h3>
                  <p style="color: #666; line-height: 1.6; margin-bottom: 15px;">
                    Il tuo ordine è stato confermato e processato con successo.<br>
                    Stai per ricevere prodotti di qualità superiore, selezionati appositamente per te.
                  </p>
                  <p style="color: #3498db; font-weight: bold; font-size: 16px;">Il Team Celio Italia</p>
                  
                  <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #eee;">
                    <p style="color: #888; font-size: 12px; line-height: 1.4;">
                      Celio Italia S.r.l. | Via della Moda 123, 20121 Milano, Italia<br>
                      P.IVA: IT12345678901 | CF: CLIO123456789 | REA: MI-1234567<br>
                      Capitale Sociale: €100.000 i.v. | celio.it
                    </p>
                  </div>
                </div>
                
              </div>
            </div>
          </body>
          </html>
        `,
      });

      return true;
    } catch (error) {
      console.error('Error sending comprehensive order confirmation email:', error);
      return false;
    }
  }

  async sendTeamInvitationEmail(invitation: {
    email: string;
    firstName: string; 
    lastName: string;
    role: string;
    department?: string;
    position?: string;
    inviterName?: string;
    username?: string;
    password?: string;
  }): Promise<boolean> {
    try {
      console.log(`📧 Attempting to send team invitation email:`, {
        to: invitation.email,
        from: this.fromEmail,
        hasCredentials: !!invitation.username && !!invitation.password
      });

      const resend = this.getResendInstance();
      
      const roleTranslations = {
        'admin': 'Amministratore',
        'manager': 'Manager', 
        'editor': 'Editor',
        'viewer': 'Visualizzatore'
      };

      const result = await resend.emails.send({
        from: this.fromEmail,
        to: invitation.email,
        subject: `Benvenuto nel team Celio - Invito ERP System`,
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Invito Team Celio</title>
          </head>
          <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8f9fa;">
            <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
              
              <!-- Header with Logo -->
              <div style="background: linear-gradient(135deg, #1a1a1a 0%, #333 100%); padding: 30px 20px; text-align: center;">
                <img src="https://i.postimg.cc/1zXFwhRF/download.png" alt="Celio Logo" style="height: 60px; margin-bottom: 20px;" />
                <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 300; letter-spacing: 1px;">
                  Benvenuto nel Team
                </h1>
              </div>

              <!-- Main Content -->
              <div style="padding: 40px 30px;">
                <h2 style="color: #333; font-size: 24px; margin-bottom: 20px; font-weight: 400;">
                  Ciao ${invitation.firstName},
                </h2>
                
                <p style="color: #555; font-size: 16px; line-height: 1.6; margin-bottom: 25px;">
                  Sei stato invitato a far parte del team di <strong>Celio</strong>! Siamo entusiasti di averti con noi nel nostro sistema ERP.
                </p>

                <!-- Invitation Details Card -->
                <div style="background-color: #f8f9fa; border-radius: 12px; padding: 25px; margin: 30px 0; border-left: 4px solid #007bff;">
                  <h3 style="color: #333; font-size: 18px; margin: 0 0 15px 0; font-weight: 500;">
                    📋 Dettagli del tuo Ruolo
                  </h3>
                  <div style="display: grid; gap: 10px;">
                    <div style="display: flex; align-items: center; gap: 10px;">
                      <span style="color: #666; font-weight: 500; min-width: 80px;">Ruolo:</span>
                      <span style="background: #007bff; color: white; padding: 4px 12px; border-radius: 20px; font-size: 14px; font-weight: 500;">
                        ${roleTranslations[invitation.role] || invitation.role}
                      </span>
                    </div>
                    ${invitation.department ? `
                    <div style="display: flex; align-items: center; gap: 10px;">
                      <span style="color: #666; font-weight: 500; min-width: 80px;">Reparto:</span>
                      <span style="color: #333;">${invitation.department}</span>
                    </div>
                    ` : ''}
                    ${invitation.position ? `
                    <div style="display: flex; align-items: center; gap: 10px;">
                      <span style="color: #666; font-weight: 500; min-width: 80px;">Posizione:</span>
                      <span style="color: #333;">${invitation.position}</span>
                    </div>
                    ` : ''}
                  </div>
                </div>

                ${invitation.username && invitation.password ? `
                <!-- Login Credentials Card -->
                <div style="background: linear-gradient(135deg, #28a745 0%, #1e7e34 100%); border-radius: 12px; padding: 25px; margin: 30px 0; color: white; box-shadow: 0 4px 15px rgba(40, 167, 69, 0.2);">
                  <h3 style="color: white; font-size: 18px; margin: 0 0 20px 0; font-weight: 500; text-align: center;">
                    🔐 Le tue credenziali di accesso
                  </h3>
                  <div style="background: rgba(255, 255, 255, 0.1); border-radius: 8px; padding: 20px; margin-bottom: 20px;">
                    <div style="display: grid; gap: 15px;">
                      <div style="display: flex; align-items: center; justify-content: space-between; padding: 10px 0;">
                        <span style="color: rgba(255, 255, 255, 0.9); font-weight: 500;">👤 Username:</span>
                        <span style="color: white; font-weight: 600; font-family: 'Courier New', monospace; font-size: 16px; background: rgba(255, 255, 255, 0.2); padding: 8px 12px; border-radius: 6px;">
                          ${invitation.username}
                        </span>
                      </div>
                      <div style="display: flex; align-items: center; justify-content: space-between; padding: 10px 0;">
                        <span style="color: rgba(255, 255, 255, 0.9); font-weight: 500;">🔑 Password:</span>
                        <span style="color: white; font-weight: 600; font-family: 'Courier New', monospace; font-size: 16px; background: rgba(255, 255, 255, 0.2); padding: 8px 12px; border-radius: 6px;">
                          ${invitation.password}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div style="text-align: center; padding: 15px 0;">
                    <p style="color: rgba(255, 255, 255, 0.9); font-size: 14px; margin: 0; line-height: 1.5;">
                      💡 <strong>Importante:</strong> Conserva queste credenziali in modo sicuro. Ti consigliamo di cambiare la password al primo accesso.
                    </p>
                  </div>
                </div>
                ` : ''}

                <!-- Call to Action -->
                <div style="text-align: center; margin: 35px 0;">
                  <a href="${process.env.REPLIT_DOMAIN ? `https://${process.env.REPLIT_DOMAIN}` : 'https://27c31b4c-78d5-4e1b-befd-ce9fa9bc535a-00-2cxs4ecosbrca.riker.replit.dev'}/team/login" style="display: inline-block; background: linear-gradient(135deg, #007bff 0%, #0056b3 100%); color: white; text-decoration: none; padding: 15px 35px; border-radius: 30px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 15px rgba(0, 123, 255, 0.3); transition: all 0.3s ease;">
                    🚀 Accedi al Sistema ERP
                  </a>
                </div>

                <p style="color: #666; font-size: 14px; line-height: 1.5; margin-top: 30px; text-align: center;">
                  Se hai domande o hai bisogno di aiuto, non esitare a contattare il team di supporto.
                </p>
              </div>

              <!-- Footer -->
              <div style="background-color: #f8f9fa; padding: 25px 30px; text-align: center; border-top: 1px solid #e9ecef;">
                <div style="display: flex; justify-content: center; gap: 20px; margin-bottom: 15px; flex-wrap: wrap;">
                  <span style="color: #666; font-size: 14px;">📧 Email: admin@celio.com</span>
                  <span style="color: #666; font-size: 14px;">🌐 www.celio.com</span>
                </div>
                <p style="color: #888; font-size: 12px; margin: 0; line-height: 1.4;">
                  © 2024 Celio. Tutti i diritti riservati.<br>
                  Questo è un messaggio automatico generato dal sistema ERP Celio.
                </p>
              </div>

            </div>
          </body>
          </html>
        `
      });

      console.log(`✅ Email sent successfully via Resend:`, {
        to: invitation.email,
        emailId: result.data?.id,
        message: 'Team invitation email sent'
      });

      return true;
    } catch (error) {
      console.error('❌ Error sending team invitation email:', error);
      console.error('Full error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack
      });
      return false;
    }
  }
}

export const emailService = new EmailService();