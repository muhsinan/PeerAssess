#!/bin/bash

# PeerAssess Deployment Script
# Run this script on your VM after transferring the project files

set -e

echo "🚀 Starting PeerAssess deployment..."

# Set project directory
PROJECT_DIR="/var/www/peerassess"
DB_NAME="peer_assessment"

# Create project directory
sudo mkdir -p $PROJECT_DIR
sudo chown $USER:$USER $PROJECT_DIR

echo "📁 Project directory created at $PROJECT_DIR"

# Navigate to project directory
cd $PROJECT_DIR

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Build the application
echo "🔨 Building the application..."
npm run build

# Set up environment variables
echo "⚙️  Setting up environment variables..."
cat > .env.local << EOF
# Database Configuration
DB_USER=your_db_user
DB_HOST=localhost
DB_NAME=peer_assessment
DB_PASSWORD=your_secure_password
DB_PORT=5432

# Next.js Configuration
NEXTAUTH_URL=https://yourdomain.com
NEXTAUTH_SECRET=$(openssl rand -base64 32)

# OpenAI API (if you want AI features)
OPENAI_API_KEY=your_openai_api_key_here
EOF

echo "🗄️  Setting up database..."
# Import database schema
psql -h localhost -U your_db_user -d $DB_NAME -f database_schema.sql

echo "🔧 Starting application with PM2..."
# Start with PM2
pm2 start npm --name "peerassess" -- start
pm2 save
pm2 startup

echo "✅ Application started successfully!"
echo "📍 Application is running on http://localhost:3000" 