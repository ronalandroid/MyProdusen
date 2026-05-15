#!/bin/bash

# Deployment Preparation Script for Netlify
# This script prepares your project for deployment

echo "🚀 Preparing MyProdusen for Netlify Deployment..."
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if git is initialized
if [ ! -d .git ]; then
    echo -e "${RED}❌ Git repository not initialized${NC}"
    echo "Run: git init"
    exit 1
fi

echo -e "${GREEN}✅ Git repository found${NC}"

# Check if node_modules exists
if [ ! -d node_modules ]; then
    echo -e "${YELLOW}⚠️  node_modules not found. Installing dependencies...${NC}"
    npm install
fi

echo -e "${GREEN}✅ Dependencies installed${NC}"

# Check if .env.example exists
if [ ! -f .env.example ]; then
    echo -e "${YELLOW}⚠️  Creating .env.example...${NC}"
    cat > .env.example << 'ENVEOF'
# Database
DATABASE_URL=postgresql://user:password@host:5432/database

# Authentication
JWT_SECRET=your-super-secret-jwt-key-minimum-32-characters-long
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-nextauth-secret-key-minimum-32-chars

# Environment
NODE_ENV=development

# Optional: Redis
REDIS_URL=redis://localhost:6379

# Optional: File Upload
MAX_FILE_SIZE=10485760
ALLOWED_FILE_TYPES=image/jpeg,image/png,image/webp
ENVEOF
fi

echo -e "${GREEN}✅ .env.example exists${NC}"

# Test build
echo ""
echo "🔨 Testing production build..."
npm run build

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Build successful!${NC}"
else
    echo -e "${RED}❌ Build failed. Fix errors before deploying.${NC}"
    exit 1
fi

# Check required files
echo ""
echo "📋 Checking required files..."

files=("netlify.toml" "next.config.js" "package.json" ".gitignore")
for file in "${files[@]}"; do
    if [ -f "$file" ]; then
        echo -e "${GREEN}✅ $file${NC}"
    else
        echo -e "${RED}❌ $file missing${NC}"
    fi
done

# Git status
echo ""
echo "📝 Git status:"
git status --short

# Summary
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🎉 Deployment Preparation Complete!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Next steps:"
echo "1. Commit your changes:"
echo "   git add ."
echo "   git commit -m 'feat: prepare for Netlify deployment'"
echo "   git push origin main"
echo ""
echo "2. Go to https://app.netlify.com"
echo "3. Click 'Add new site' → 'Import an existing project'"
echo "4. Connect your repository"
echo "5. Configure build settings:"
echo "   - Build command: npm run build"
echo "   - Publish directory: .next"
echo "6. Add environment variables (see .env.example)"
echo "7. Deploy!"
echo ""
echo "📖 Full guide: NETLIFY_DEPLOYMENT_GUIDE.md"
echo ""

