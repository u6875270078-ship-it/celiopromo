# 🛍️ Celio E-commerce - Quick Setup Guide

## 📋 What You Need

- **Node.js** 18+ installed
- **PostgreSQL** database running
- **Domain/VPS** (optional, for production)

---

## 🚀 Quick Start (3 Steps)

### 1. **Configure Environment**
```bash
# Copy the environment template
cp .env.example .env

# Edit with your settings (required!)
nano .env
```

**Required Settings in .env:**
```bash
DATABASE_URL=postgresql://user:password@localhost:5432/celio_production
RESEND_API_KEY=your_resend_api_key_here
SESSION_SECRET=your_random_secret_key_here
```

### 2. **Run Setup**
```bash
# Automatic setup (recommended)
node setup.js

# OR Manual setup
npm install
npm run build
npm run db:push
```

### 3. **Start Application**

**Windows:**
```bash
run.bat
```

**Linux/Mac:**
```bash
chmod +x run.sh
./run.sh
```

**Or manually:**
```bash
npm start
```

---

## 🌐 Access Your Store

- **Website:** http://localhost:5000
- **Admin Panel:** http://localhost:5000/admin
- **Default Login:** admin@celio.com / admin123

---

## 🔑 API Keys Setup

### **Email Service (Resend)**
1. Go to [resend.com](https://resend.com/api-keys)
2. Create account and get API key
3. Add to .env: `RESEND_API_KEY=re_xxxxxxxxx`

### **Payments (Stripe) - Optional**
1. Go to [stripe.com/dashboard](https://dashboard.stripe.com/apikeys)
2. Get publishable and secret keys
3. Add to .env:
   ```
   STRIPE_PUBLISHABLE_KEY=pk_test_xxxxx
   STRIPE_SECRET_KEY=sk_test_xxxxx
   ```

### **PayPal - Optional**
1. Go to [developer.paypal.com](https://developer.paypal.com/)
2. Create app and get client credentials
3. Add to .env:
   ```
   PAYPAL_CLIENT_ID=your_client_id
   PAYPAL_CLIENT_SECRET=your_client_secret
   ```

---

## 🗃️ Database Setup

### **Option 1: Local PostgreSQL**
```bash
# Install PostgreSQL
sudo apt install postgresql  # Ubuntu/Debian
brew install postgresql      # macOS

# Create database
sudo -u postgres psql
CREATE DATABASE celio_production;
CREATE USER celio_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE celio_production TO celio_user;

# Update .env
DATABASE_URL=postgresql://celio_user:your_password@localhost:5432/celio_production
```

### **Option 2: Cloud Database (Recommended)**
Use services like:
- **Neon** (recommended): [neon.tech](https://neon.tech) - Free tier available
- **Supabase**: [supabase.com](https://supabase.com) - Free tier
- **Railway**: [railway.app](https://railway.app) - Easy setup

Just get the connection URL and add to .env!

---

## 🚀 Production Deployment

### **VPS Deployment**
1. Upload all files to your server
2. Install Node.js and PostgreSQL
3. Follow the setup steps above
4. Use PM2 for process management:
   ```bash
   npm install -g pm2
   pm2 start dist/index.js --name celio-app
   ```

### **Quick Deploy Services**
- **Vercel/Netlify**: For static sites only (won't work for this full-stack app)
- **Railway**: Upload and deploy automatically
- **Render**: Connect GitHub and deploy
- **DigitalOcean App Platform**: Easy deployment

---

## 🔧 Common Issues

### **"DATABASE_URL must be set"**
- Check that .env file exists
- Verify DATABASE_URL is correctly formatted
- Test database connection

### **"npm install" fails**
- Make sure Node.js 18+ is installed
- Clear npm cache: `npm cache clean --force`
- Delete node_modules and try again

### **Port 5000 already in use**
- Change PORT in .env file
- Kill existing process: `lsof -ti:5000 | xargs kill`

### **Images not loading**
- Check that image URLs in database are accessible
- Verify internet connection for external images

---

## 📁 File Structure

```
celio-app/
├── client/          # React frontend
├── server/          # Express backend  
├── shared/          # Database schema
├── dist/            # Built application
├── .env.example     # Environment template
├── .env             # Your configuration
├── database_setup.sql  # Sample data
├── setup.js         # Automatic setup
├── run.bat          # Windows starter
├── run.sh           # Linux/Mac starter
└── package.json     # Dependencies
```

---

## 🎯 Features Included

✅ **Complete E-commerce Store**
- Product catalog with categories
- Shopping cart and checkout
- Order management
- Admin dashboard

✅ **Italian Fashion Theme** 
- Homepage hero carousel
- Product galleries
- Mobile responsive design

✅ **Integrations Ready**
- Email confirmations (Resend)
- Payment processing (Stripe/PayPal)
- File uploads (Google Cloud)

✅ **Production Ready**
- Security best practices
- Database migrations
- Error handling
- Performance optimized

---

## 💡 Next Steps

1. **Customize Design**: Edit colors and styles in `client/src/index.css`
2. **Add Products**: Use admin panel at `/admin` to add your products
3. **Setup Domain**: Point your domain to your server
4. **SSL Certificate**: Use Let's Encrypt for HTTPS
5. **Email Templates**: Customize in `server/email.ts`

---

## 🆘 Need Help?

- **Check logs**: Browser console and terminal output
- **Database issues**: Verify connection and credentials
- **Email not working**: Check RESEND_API_KEY is valid
- **Performance**: Monitor with `pm2 monit` in production

---

**Ready to sell! 🛍️ Your Italian fashion e-commerce store is ready to go!**