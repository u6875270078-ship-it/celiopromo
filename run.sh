#!/bin/bash

# Celio E-commerce Linux/Mac Startup Script

echo "🚀 Starting Celio E-commerce Application..."
echo ""

# Check if .env exists
if [ ! -f ".env" ]; then
    echo "❌ .env file not found!"
    echo "Please copy .env.example to .env and configure your settings:"
    echo "   cp .env.example .env"
    echo ""
    echo "Then edit .env file with your database URL and API keys."
    echo ""
    exit 1
fi

# Check if built
if [ ! -d "dist" ]; then
    echo "📦 Building application first..."
    npm run build
    if [ $? -ne 0 ]; then
        echo "❌ Build failed!"
        exit 1
    fi
fi

echo "✅ Starting server..."
echo "📖 Open http://localhost:5000 in your browser"
echo ""
echo "👨‍💼 Default admin login:"
echo "   Email: admin@celio.com"  
echo "   Password: admin123"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

# Start the application
node dist/index.js