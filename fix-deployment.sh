#!/bin/bash

# CEE Lab App - Deployment Fix Script
# This script fixes all deployment issues step by step

echo "🚀 CEE Lab App - Deployment Fix Script"
echo "======================================"

# Set error handling
set -e
trap 'echo "❌ Script failed at line $LINENO"' ERR

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}$1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Step 1: Fix broken packages and clean up
print_status "🔧 Step 1: Fixing broken packages..."
dpkg --configure -a
apt --fix-broken install -y
apt update
apt upgrade -y

# Step 2: Remove old Node.js completely
print_status "🗑️  Step 2: Removing old Node.js installation..."
# Kill any existing node processes
pkill -f node || true
pkill -f npm || true

# Remove old Node.js
apt remove --purge nodejs npm -y || true
apt autoremove -y
apt autoclean

# Remove any leftover files
rm -rf /usr/local/bin/node
rm -rf /usr/local/bin/npm
rm -rf /usr/local/lib/node_modules
rm -rf /usr/local/include/node
rm -rf /usr/local/share/man/man1/node*
rm -rf /var/lib/dpkg/info/nodejs*
rm -rf /etc/apt/sources.list.d/nodesource.list

print_success "Old Node.js removed"

# Step 3: Install Node.js 18 LTS properly
print_status "📦 Step 3: Installing Node.js 18 LTS..."

# Download and install Node.js 18 LTS using NodeSource repository
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt-get install -y nodejs

# Verify installation
node_version=$(node --version)
npm_version=$(npm --version)

print_success "Node.js installed: $node_version"
print_success "npm installed: $npm_version"

# Step 4: Clean up and prepare application directory
print_status "📁 Step 4: Preparing application directory..."

# Backup existing directory if it has content
if [ -d "/var/www/cee-lab-app" ] && [ "$(ls -A /var/www/cee-lab-app)" ]; then
    print_warning "Backing up existing directory..."
    mv /var/www/cee-lab-app /var/www/cee-lab-app-backup-$(date +%Y%m%d-%H%M%S)
fi

# Create fresh directory
mkdir -p /var/www/cee-lab-app
cd /var/www/cee-lab-app

print_success "Application directory prepared"

# Step 5: Clone repository
print_status "📥 Step 5: Cloning repository..."

# You'll need to replace this with your actual repository URL
# For now, we'll copy the files manually
print_warning "Repository cloning skipped - files need to be uploaded manually"

# Step 6: Install PM2 globally
print_status "🔧 Step 6: Installing PM2..."
npm install -g pm2

# Verify PM2 installation
pm2_version=$(pm2 --version)
print_success "PM2 installed: $pm2_version"

# Step 7: Create environment file
print_status "🌐 Step 7: Creating environment file..."
cat > /var/www/cee-lab-app/.env << EOF
NODE_ENV=production
PORT=3000
DATABASE_URL=sqlite:./equipment.db
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=10485760
ALLOWED_FILE_TYPES=image/jpeg,image/png,image/gif,image/webp
EOF

print_success "Environment file created"

# Step 8: Configure Nginx
print_status "🌐 Step 8: Configuring Nginx..."

# Create Nginx configuration
cat > /etc/nginx/sites-available/cee-lab-app.conf << 'EOF'
server {
    listen 8080;
    server_name _;
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;
    
    # Root directory for static files
    root /var/www/cee-lab-app;
    index index.html;
    
    # Handle static files
    location / {
        try_files $uri $uri/ @nodejs;
    }
    
    # Handle API requests and fallback for SPA
    location @nodejs {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 86400;
    }
    
    # Handle API routes explicitly
    location /api/ {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 86400;
    }
    
    # Handle uploads
    location /uploads/ {
        alias /var/www/cee-lab-app/uploads/;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    # Security: deny access to sensitive files
    location ~ /\. {
        deny all;
    }
    
    location ~ \.(env|log)$ {
        deny all;
    }
    
    # Optimize static file serving
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
EOF

# Enable the site
ln -sf /etc/nginx/sites-available/cee-lab-app.conf /etc/nginx/sites-enabled/

# Test Nginx configuration
nginx -t

# Reload Nginx
systemctl reload nginx

print_success "Nginx configured and reloaded"

# Step 9: Set up file upload directory
print_status "📁 Step 9: Setting up upload directory..."
mkdir -p /var/www/cee-lab-app/uploads
chown -R www-data:www-data /var/www/cee-lab-app/uploads
chmod 755 /var/www/cee-lab-app/uploads

print_success "Upload directory configured"

# Step 10: Display next steps
print_status "📋 Step 10: Next Steps"
echo ""
print_success "Environment setup completed successfully!"
echo ""
print_warning "NEXT STEPS REQUIRED:"
echo "1. Upload your application files to: /var/www/cee-lab-app/"
echo "2. Run 'npm install' in the application directory"
echo "3. Start the app with PM2: pm2 start server.js --name cee-lab-app"
echo "4. Save PM2 configuration: pm2 save && pm2 startup"
echo ""
print_status "📊 System Status:"
echo "• Node.js: $(node --version)"
echo "• npm: $(npm --version)" 
echo "• PM2: $(pm2 --version)"
echo "• Nginx: $(nginx -v 2>&1)"
echo ""
print_status "🌐 Access URLs:"
echo "• App will be available at: http://77.37.62.110:8080"
echo "• Server logs: pm2 logs cee-lab-app"
echo "• PM2 status: pm2 status"
echo ""
print_success "Deployment environment ready!"
