#!/bin/bash

# PeerAssess Update Script
# Run this script on your VM to update the application

set -e

echo "🔄 Starting PeerAssess update..."

# Navigate to project directory
cd /var/www/peerassess

# Create backup of current version
echo "📦 Creating backup..."
sudo cp -r /var/www/peerassess /var/backups/peerassess-$(date +%Y%m%d-%H%M%S)

# Pull latest changes from git
echo "📥 Pulling latest changes..."
git pull origin main

# Install/update dependencies
echo "📦 Installing dependencies..."
npm install

# Build the application
echo "🔨 Building application..."
npm run build

# Restart the application
echo "🔄 Restarting application..."
pm2 restart peerassess

# Wait a moment for the app to start
sleep 3

# Check if the application is running
echo "✅ Checking application status..."
pm2 status

# Test if the application responds
echo "🧪 Testing application..."
curl -I http://localhost:3000

echo "✅ Update completed successfully!"
echo "🌐 Your site is available at: https://peerassess.net" 