#!/bin/bash
# ============================================================
# MyProdusen — Deployment Script for VPS + Coolify
# ============================================================

set -e

echo "🚀 Preparing MyProdusen for Coolify Deployment..."
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
CYAN='\033[0;36m'
NC='\033[0m'

# ── 1. Check git ──
if [ ! -d .git ]; then
    echo -e "${RED}❌ Git repository not initialized${NC}"
    echo "Run: git init && git remote add origin <your-repo-url>"
    exit 1
fi
echo -e "${GREEN}✅ Git repository found${NC}"

# ── 2. Check required files ──
echo ""
echo -e "${CYAN}📋 Checking deployment files...${NC}"
required_files=("Dockerfile" "docker-entrypoint.sh" "nixpacks.toml" "next.config.js" "package.json" ".dockerignore" ".env.example" "drizzle/schema.ts" "drizzle.config.ts")
for file in "${required_files[@]}"; do
    if [ -f "$file" ]; then
        echo -e "  ${GREEN}✅ $file${NC}"
    else
        echo -e "  ${RED}❌ $file missing${NC}"
    fi
done

# ── 3. Check .env not committed ──
echo ""
if git ls-files --error-unmatch .env 2>/dev/null; then
    echo -e "${RED}❌ WARNING: .env is tracked by git! Remove it:${NC}"
    echo "   git rm --cached .env"
else
    echo -e "${GREEN}✅ .env is not tracked by git${NC}"
fi

# ── 4. Check docker-entrypoint.sh is executable ──
if [ -x "docker-entrypoint.sh" ]; then
    echo -e "${GREEN}✅ docker-entrypoint.sh is executable${NC}"
else
    chmod +x docker-entrypoint.sh
    echo -e "${YELLOW}⚠️  Fixed: docker-entrypoint.sh permissions${NC}"
fi

# ── 5. Git status ──
echo ""
echo -e "${CYAN}📝 Git status:${NC}"
git status --short

# ── Summary ──
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🎉 Deployment Preparation Complete!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Next steps:"
echo ""
echo "  1. Commit & push:"
echo "     git add ."
echo "     git commit -m 'feat: production deployment for Coolify'"
echo "     git push origin main"
echo ""
echo "  2. In Coolify (http://YOUR_VPS_IP:8000):"
echo "     → Create PostgreSQL + Redis databases"
echo "     → Create new project from Git repo"
echo "     → Add environment variables (see .env.example)"
echo "     → Set domain: myprodusen.online"
echo "     → Deploy!"
echo ""
echo "  📖 Full guide: docs/COOLIFY_DEPLOYMENT.md"
echo ""
