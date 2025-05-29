#!/bin/bash

echo "Setting up PeerAssess deployment environment..."

# Update system packages
sudo apt update && sudo apt upgrade -y

# Install Node.js 18.x
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PostgreSQL
sudo apt install postgresql postgresql-contrib -y

# Install Nginx (reverse proxy)
sudo apt install nginx -y

# Install PM2 (process manager)
sudo npm install -g pm2

# Install Git
sudo apt install git -y

# Create application directory
sudo mkdir -p /var/www/peerassess
sudo chown $USER:$USER /var/www/peerassess

# Setup PostgreSQL
sudo -u postgres psql -c "CREATE USER peerassess WITH PASSWORD 'your_secure_password';"
sudo -u postgres psql -c "CREATE DATABASE peerassess_db OWNER peerassess;"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE peerassess_db TO peerassess;"

# Configure firewall
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw --force enable

echo "Basic setup complete! Next steps:"
echo "1. Clone your repository to /var/www/peerassess"
echo "2. Set up environment variables"
echo "3. Build and start the application"
echo "4. Configure Nginx" 