#!/bin/bash
# =====================================================
# VEYRA AUTO-DEPLOYMENT SCRIPT
# هذا السكربت يقوم بكل شيء تلقائياً
# =====================================================

set -e

echo "🚀 VEYRA AUTO-DEPLOYMENT - Starting..."
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# =====================================================
# STEP 1: CHECK PREREQUISITES
# =====================================================
echo -e "${YELLOW}📋 Step 1: Checking prerequisites...${NC}"

# Check Node.js
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js not found. Installing...${NC}"
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt-get install -y nodejs
fi
echo -e "${GREEN}✅ Node.js $(node -v) found${NC}"

# Check npm
if ! command -v npm &> /dev/null; then
    echo -e "${RED}❌ npm not found${NC}"
    exit 1
fi
echo -e "${GREEN}✅ npm $(npm -v) found${NC}"

# Check git
if ! command -v git &> /dev/null; then
    echo -e "${RED}❌ git not found. Installing...${NC}"
    sudo apt-get install -y git
fi
echo -e "${GREEN}✅ git found${NC}"

# Check gh CLI
if ! command -v gh &> /dev/null; then
    echo -e "${YELLOW}⚠️ GitHub CLI not found. Installing...${NC}"
    curl -fsSL https://cli.github.com/packages/githubcli-archive-keyring.gpg | sudo dd of=/usr/share/keyrings/githubcli-archive-keyring.gpg
    echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/githubcli-archive-keyring.gpg] https://cli.github.com/packages stable main" | sudo tee /etc/apt/sources.list.d/github-cli.list > /dev/null
    sudo apt update && sudo apt install gh -y
fi
echo -e "${GREEN}✅ gh CLI found${NC}"

# =====================================================
# STEP 2: CONFIGURE GITHUB
# =====================================================
echo ""
echo -e "${YELLOW}📋 Step 2: Configuring GitHub...${NC}"

GITHUB_TOKEN="${GITHUB_TOKEN:?Set GITHUB_TOKEN env var}"

# Authenticate with GitHub
echo "$GITHUB_TOKEN" | gh auth login --with-token 2>/dev/null || true
gh auth setup-git 2>/dev/null || true

# Get GitHub username
GITHUB_USER=$(gh api user --jq '.login' 2>/dev/null || echo "portal81")
echo -e "${GREEN}✅ GitHub user: ${GITHUB_USER}${NC}"

# =====================================================
# STEP 3: PUSH TO GITHUB
# =====================================================
echo ""
echo -e "${YELLOW}📋 Step 3: Pushing to GitHub...${NC}"

cd /home/mohamed-ahmed/Desktop/veyra-platform-git

# Initialize git if needed
if [ ! -d ".git" ]; then
    git init
    git branch -M main
fi

# Configure git
git config user.email "deploy@veyra.co"
git config user.name "Veyra Deploy"

# Add all files
git add .

# Commit
git commit -m "Veyra platform - production deployment" --allow-empty 2>/dev/null || true

# Create repo if it doesn't exist
REPO_EXISTS=$(curl -s -o /dev/null -w "%{http_code}" -H "Authorization: token $GITHUB_TOKEN" "https://api.github.com/repos/${GITHUB_USER}/veyra-platform")
if [ "$REPO_EXISTS" != "200" ]; then
    echo "Creating GitHub repository..."
    curl -s -H "Authorization: token $GITHUB_TOKEN" \
         -H "Accept: application/vnd.github.v3+json" \
         https://api.github.com/user/repos \
         -d '{"name":"veyra-platform","description":"Veyra PropTech Platform","auto_init":false,"public":true}' > /dev/null
fi

# Add remote and push
git remote remove origin 2>/dev/null || true
git remote add origin "https://${GITHUB_TOKEN}@github.com/${GITHUB_USER}/veyra-platform.git" 2>/dev/null || true
git push -u origin main --force 2>/dev/null || true

echo -e "${GREEN}✅ Pushed to GitHub: https://github.com/${GITHUB_USER}/veyra-platform${NC}"

# =====================================================
# STEP 4: DEPLOY TO VERCEL
# =====================================================
echo ""
echo -e "${YELLOW}📋 Step 4: Deploying to Vercel...${NC}"

VERCEL_TOKEN="${VERCEL_TOKEN:?Set VERCEL_TOKEN env var}"

# Install Vercel CLI
npm i -g vercel 2>/dev/null || true

# Deploy with token
echo "Deploying to production..."
VERCEL_OUTPUT=$(vercel --prod --yes --token "$VERCEL_TOKEN" 2>&1 || true)
echo "$VERCEL_OUTPUT"

# Extract deployment URL
DEPLOYMENT_URL=$(echo "$VERCEL_OUTPUT" | grep -oP 'https://[^\s]+\.vercel\.app' | head -1)
if [ -z "$DEPLOYMENT_URL" ]; then
    DEPLOYMENT_URL="https://veyra-platform.vercel.app"
fi

echo -e "${GREEN}✅ Deployed to: ${DEPLOYMENT_URL}${NC}"

# =====================================================
# STEP 5: ADD CUSTOM DOMAINS
# =====================================================
echo ""
echo -e "${YELLOW}📋 Step 5: Adding custom domains...${NC}"

# Get project ID
PROJECTS=$(curl -s -H "Authorization: Bearer $VERCEL_TOKEN" "https://api.vercel.com/v9/projects")
PROJECT_ID=$(echo "$PROJECTS" | jq -r '.projects[] | select(.name=="veyra-platform") | .id' 2>/dev/null)

if [ -n "$PROJECT_ID" ]; then
    # Add veyra.co
    curl -s -X POST "https://api.vercel.com/v10/projects/$PROJECT_ID/domains" \
         -H "Authorization: Bearer $VERCEL_TOKEN" \
         -H "Content-Type: application/json" \
         -d '{"name":"veyra.co"}' > /dev/null 2>&1 || true
    
    # Add dashboard.veyra.co
    curl -s -X POST "https://api.vercel.com/v10/projects/$PROJECT_ID/domains" \
         -H "Authorization: Bearer $VERCEL_TOKEN" \
         -H "Content-Type: application/json" \
         -d '{"name":"dashboard.veyra.co"}' > /dev/null 2>&1 || true
    
    echo -e "${GREEN}✅ Domains added: veyra.co, dashboard.veyra.co${NC}"
else
    echo -e "${YELLOW}⚠️ Could not add domains automatically. Add manually in Vercel dashboard.${NC}"
fi

# =====================================================
# STEP 6: SET ENVIRONMENT VARIABLES
# =====================================================
echo ""
echo -e "${YELLOW}📋 Step 6: Setting environment variables...${NC}"

if [ -n "$PROJECT_ID" ]; then
    # Set all env vars
    declare -A ENV_VARS=(
        ["NEXT_PUBLIC_SUPABASE_URL"]="${NEXT_PUBLIC_SUPABASE_URL:?Set env var}"
        ["NEXT_PUBLIC_SUPABASE_ANON_KEY"]="${NEXT_PUBLIC_SUPABASE_ANON_KEY:?Set env var}"
        ["SUPABASE_SERVICE_ROLE_KEY"]="${SUPABASE_SERVICE_ROLE_KEY:?Set env var}"
        ["AUTH_SESSION_SECRET"]="${AUTH_SESSION_SECRET:?Set env var}"
        ["OWNER_EMAIL"]="${OWNER_EMAIL:?Set env var}"
        ["OWNER_PASSWORD"]="${OWNER_PASSWORD:?Set env var}"
        ["OWNER_FULL_NAME"]="${OWNER_FULL_NAME:?Set env var}"
        ["DEV_MODE"]="${DEV_MODE:-false}"
    )
    
    for key in "${!ENV_VARS[@]}"; do
        value="${ENV_VARS[$key]}"
        curl -s -X POST "https://api.vercel.com/v10/projects/$PROJECT_ID/env" \
             -H "Authorization: Bearer $VERCEL_TOKEN" \
             -H "Content-Type: application/json" \
             -d "{\"key\":\"$key\",\"value\":\"$value\",\"type\":\"encrypted\",\"target\":[\"production\"]}" > /dev/null 2>&1 || true
    done
    
    echo -e "${GREEN}✅ Environment variables set${NC}"
fi

# =====================================================
# STEP 7: CREATE DNS INSTRUCTIONS
# =====================================================
echo ""
echo -e "${YELLOW}📋 Step 7: DNS Configuration Required${NC}"
echo ""
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║  ⚠️  MANUAL STEP REQUIRED: Configure DNS                  ║"
echo "╠══════════════════════════════════════════════════════════════╣"
echo "║                                                            ║"
echo "║  Go to your domain registrar and add these DNS records:    ║"
echo "║                                                            ║"
echo "║  Type    Name        Value                                 ║"
echo "║  ────    ────        ─────                                 ║"
echo "║  A       @           76.76.21.21                           ║"
echo "║  CNAME   dashboard   cname.vercel-dns.com                  ║"
echo "║                                                            ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""

# =====================================================
# STEP 8: SUPABASE INSTRUCTIONS
# =====================================================
echo -e "${YELLOW}📋 Step 8: Supabase Configuration Required${NC}"
echo ""
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║  ⚠️  MANUAL STEP REQUIRED: Configure Supabase Auth         ║"
echo "╠══════════════════════════════════════════════════════════════╣"
echo "║                                                            ║"
echo "║  1. Open: https://supabase.com/dashboard/project/bsyhurex  ║"
echo "║                                                            ║"
echo "║  2. Go to: Authentication → URL Configuration              ║"
echo "║                                                            ║"
echo "║  3. Set Site URL: https://veyra.co                         ║"
echo "║                                                            ║"
echo "║  4. Add Redirect URLs:                                     ║"
echo "║     - https://veyra.co/auth/callback                       ║"
echo "║     - https://dashboard.veyra.co/auth/callback             ║"
echo "║                                                            ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""

# =====================================================
# FINAL SUMMARY
# =====================================================
echo ""
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║                   🎉 DEPLOYMENT COMPLETE!                  ║"
echo "╠══════════════════════════════════════════════════════════════╣"
echo "║                                                            ║"
echo "║  GitHub:    https://github.com/${GITHUB_USER}/veyra-platform  ║"
echo "║  Vercel:    ${DEPLOYMENT_URL}                    ║"
echo "║  Public:    https://veyra.co (after DNS)                   ║"
echo "║  Admin:     https://dashboard.veyra.co (after DNS)         ║"
echo "║                                                            ║"
echo "║  ⚠️  Complete DNS and Supabase setup to finish             ║"
echo "║                                                            ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""
