#!/usr/bin/env node

/**
 * Celio E-commerce Setup Script
 * This script sets up the database and initializes the application
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🚀 Setting up Celio E-commerce Application...\n');

// Check if .env file exists
if (!fs.existsSync('.env')) {
  console.log('❌ .env file not found!');
  console.log('Please copy .env.example to .env and configure your settings:');
  console.log('   cp .env.example .env');
  console.log('\nThen edit .env file with your database URL and API keys.');
  console.log('\nRequired variables:');
  console.log('- DATABASE_URL (PostgreSQL connection string)');
  console.log('- RESEND_API_KEY (for emails)');
  console.log('- SESSION_SECRET (random string for security)');
  process.exit(1);
}

console.log('✅ .env file found');

// Check if database URL is set
dotenv.config();

if (!process.env.DATABASE_URL) {
  console.log('❌ DATABASE_URL not set in .env file');
  console.log('Please add your PostgreSQL connection string to .env:');
  console.log('DATABASE_URL=postgresql://user:password@localhost:5432/celio_production');
  process.exit(1);
}

console.log('✅ Database URL configured');

try {
  // Install dependencies if node_modules doesn't exist
  if (!fs.existsSync('node_modules')) {
    console.log('📦 Installing dependencies...');
    execSync('npm install', { stdio: 'inherit' });
    console.log('✅ Dependencies installed');
  } else {
    console.log('✅ Dependencies already installed');
  }

  // Build the application
  console.log('🔨 Building application...');
  execSync('npm run build', { stdio: 'inherit' });
  console.log('✅ Application built successfully');

  // Push database schema
  console.log('🗃️  Setting up database schema...');
  execSync('npm run db:push', { stdio: 'inherit' });
  console.log('✅ Database schema created');

  // Initialize with sample data if database_setup.sql exists
  if (fs.existsSync('database_setup.sql')) {
    console.log('📊 Initializing with sample data...');
    
    // Check if psql is available
    try {
      execSync('which psql', { stdio: 'pipe' });
      
      // Extract connection details from DATABASE_URL
      const dbUrl = process.env.DATABASE_URL;
      execSync(`psql "${dbUrl}" -f database_setup.sql`, { stdio: 'inherit' });
      console.log('✅ Sample data loaded');
    } catch (error) {
      console.log('⚠️  psql not found. You can manually import database_setup.sql');
      console.log('   or use your preferred PostgreSQL client');
    }
  }

  console.log('\n🎉 Setup completed successfully!');
  console.log('\n🚀 To start the application:');
  console.log('   npm start');
  console.log('\n📖 Your application will be available at:');
  console.log('   http://localhost:5000');
  console.log('\n👨‍💼 Default admin login:');
  console.log('   Email: admin@celio.com');
  console.log('   Password: admin123');
  console.log('\nHappy selling! 🛍️');

} catch (error) {
  console.error('❌ Setup failed:', error.message);
  console.log('\n🔍 Check the error above and try again');
  console.log('💡 Make sure PostgreSQL is running and accessible');
  process.exit(1);
}