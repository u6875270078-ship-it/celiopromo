# 🚀 Celio E-commerce VPS Deployment Guide

## 📋 Prerequisites

**Your VPS Requirements:**
- Ubuntu 20.04 or 22.04 LTS
- Node.js 18+ 
- PostgreSQL database
- NGINX (for reverse proxy)
- SSL certificate (Let's Encrypt)
- Domain name pointing to your VPS IP

---

## Step 1: Download Project Files

Since Replit doesn't have direct export, you need to manually copy your files:

### Method A: Using Replit Shell
```bash
# Create a zip of your project
zip -r celio-app.zip . -x "node_modules/*" ".git/*" "dist/*"
```

### Method B: Manual File Copy
Copy these essential files/folders to your VPS:
```
client/             # Frontend React app
server/             # Backend Express server
shared/             # Database schema
package.json        # Dependencies
package-lock.json   # Lock file
vite.config.ts      # Build configuration
tailwind.config.ts  # Styling
tsconfig.json       # TypeScript config
drizzle.config.ts   # Database config
postcss.config.js   # CSS processing
components.json     # UI components
```

---

## Step 2: VPS Server Setup

### Install Node.js
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verify installation
node --version
npm --version
```

### Install PostgreSQL
```bash
# Install PostgreSQL
sudo apt install postgresql postgresql-contrib -y

# Start PostgreSQL service
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Create database and user
sudo -u postgres psql
```

In PostgreSQL console:
```sql
CREATE DATABASE celio_production;
CREATE USER celio_user WITH ENCRYPTED PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE celio_production TO celio_user;
\q
```

### Install NGINX
```bash
sudo apt install nginx -y
sudo systemctl start nginx
sudo systemctl enable nginx
```

---

## Step 3: Deploy Application

### Upload and Install
```bash
# Navigate to your web directory
cd /var/www/

# Create app directory
sudo mkdir celio-app
sudo chown $USER:$USER celio-app
cd celio-app

# Upload your files here (using scp, sftp, or file manager)
# Then install dependencies
npm install

# Build the application
npm run build
```

### Environment Variables
Create `.env` file:
```bash
# Database
DATABASE_URL=postgresql://celio_user:your_secure_password@localhost:5432/celio_production

# Email (Resend)
RESEND_API_KEY=your_resend_api_key

# Application
NODE_ENV=production
PORT=3000

# Security
SESSION_SECRET=your_very_long_random_secret_key
```

### Setup Database Schema
```bash
# Push database schema
npm run db:push
```

---

## Step 4: Process Manager (PM2)

Install and configure PM2 to keep your app running:

```bash
# Install PM2 globally
sudo npm install -g pm2

# Create ecosystem file
cat > ecosystem.config.js << EOF
module.exports = {
  apps: [{
    name: 'celio-app',
    script: 'dist/index.js',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    instances: 'max',
    exec_mode: 'cluster',
    watch: false,
    max_memory_restart: '1G',
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true
  }]
}
EOF

# Create logs directory
mkdir logs

# Start application
pm2 start ecosystem.config.js

# Enable PM2 to start on boot
pm2 startup
pm2 save
```

---

## Step 5: NGINX Configuration

Create NGINX configuration:

```bash
sudo nano /etc/nginx/sites-available/celio-app
```

Add this configuration:
```nginx
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable the site:
```bash
sudo ln -s /etc/nginx/sites-available/celio-app /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

---

## Step 6: SSL Certificate (Let's Encrypt)

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx -y

# Get SSL certificate
sudo certbot --nginx -d your-domain.com -d www.your-domain.com

# Test auto-renewal
sudo certbot renew --dry-run
```

---

## Step 7: Firewall Setup

```bash
# Configure UFW firewall
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw enable
```

---

## 🔄 Deployment Updates

For future updates:

```bash
# Navigate to app directory
cd /var/www/celio-app

# Upload new files
# Install any new dependencies
npm install

# Rebuild application
npm run build

# Update database if needed
npm run db:push

# Restart application
pm2 restart celio-app
```

---

## 📊 Monitoring Commands

```bash
# Check PM2 status
pm2 status

# View logs
pm2 logs celio-app

# Monitor resources
pm2 monit

# Check NGINX status
sudo systemctl status nginx

# Check database connection
sudo -u postgres psql -d celio_production -c "SELECT NOW();"
```

---

## 🔍 Troubleshooting

### If app won't start:
```bash
# Check logs
pm2 logs celio-app

# Check environment variables
pm2 env celio-app

# Restart services
pm2 restart celio-app
sudo systemctl restart nginx
```

### If database connection fails:
```bash
# Check PostgreSQL status
sudo systemctl status postgresql

# Test connection
psql -h localhost -U celio_user -d celio_production
```

---

## 🚀 Your App Will Be Live At:
- **HTTP**: http://your-domain.com
- **HTTPS**: https://your-domain.com (after SSL setup)

---

**Need help?** Contact your system administrator for server access and domain configuration.