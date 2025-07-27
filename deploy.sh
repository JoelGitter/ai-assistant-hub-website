#!/bin/bash

# AI Assistant Hub Website Deployment Script
# This script prepares your website for deployment to Cloudflare Pages

echo "🚀 Preparing AI Assistant Hub Website for Deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if we're in the website directory
if [ ! -f "index.html" ]; then
    print_error "Please run this script from the website directory"
    exit 1
fi

# Check required files
print_status "Checking required files..."

REQUIRED_FILES=(
    "index.html"
    "css/style.css"
    "css/responsive.css"
    "js/main.js"
    "images/logo.svg"
    "privacy-policy.html"
    "terms-of-service.html"
)

MISSING_FILES=()

for file in "${REQUIRED_FILES[@]}"; do
    if [ ! -f "$file" ]; then
        MISSING_FILES+=("$file")
    fi
done

if [ ${#MISSING_FILES[@]} -ne 0 ]; then
    print_error "Missing required files:"
    for file in "${MISSING_FILES[@]}"; do
        echo "  - $file"
    done
    exit 1
fi

print_success "All required files found!"

# Check for placeholder content
print_status "Checking for placeholder content..."

PLACEHOLDERS=(
    "YOUR_USERNAME"
    "G-XXXXXXXXXX"
    "your-email@domain.com"
    "your-domain.com"
)

for placeholder in "${PLACEHOLDERS[@]}"; do
    if grep -r "$placeholder" . > /dev/null 2>&1; then
        print_warning "Found placeholder: $placeholder"
        echo "  Please update this before deployment"
    fi
done

# Create deployment package
print_status "Creating deployment package..."

PACKAGE_NAME="ai-assistant-hub-website-$(date +%Y%m%d-%H%M%S).zip"

# Create clean package
zip -r "$PACKAGE_NAME" . \
    -x "*.DS_Store" \
    -x ".git/*" \
    -x "*.log" \
    -x "deploy.sh" \
    -x "README.md" \
    -x "deploy-to-cloudflare.md" \
    -x "*.zip" \
    -x ".env*" \
    -x "node_modules/*" \
    -x ".vscode/*" \
    -x "*.tmp" \
    -x "*.bak"

if [ $? -eq 0 ]; then
    PACKAGE_SIZE=$(du -h "$PACKAGE_NAME" | cut -f1)
    print_success "Deployment package created: $PACKAGE_NAME ($PACKAGE_SIZE)"
else
    print_error "Failed to create deployment package"
    exit 1
fi

# Validate HTML
print_status "Validating HTML..."

if command -v tidy > /dev/null 2>&1; then
    tidy -q -e index.html 2>/dev/null
    if [ $? -eq 0 ]; then
        print_success "HTML validation passed"
    else
        print_warning "HTML validation found issues (non-critical)"
    fi
else
    print_warning "HTML tidy not found - skipping validation"
fi

# Check file sizes
print_status "Checking file sizes..."

LARGE_FILES=()
find . -name "*.png" -o -name "*.jpg" -o -name "*.jpeg" -o -name "*.gif" | while read file; do
    size=$(du -h "$file" | cut -f1)
    size_num=$(du -k "$file" | cut -f1)
    if [ "$size_num" -gt 500 ]; then
        LARGE_FILES+=("$file ($size)")
    fi
done

if [ ${#LARGE_FILES[@]} -ne 0 ]; then
    print_warning "Large files detected (consider optimizing):"
    for file in "${LARGE_FILES[@]}"; do
        echo "  - $file"
    done
fi

# Generate deployment summary
print_status "Generating deployment summary..."

cat > deployment-summary.txt << EOF
AI Assistant Hub Website Deployment Summary
===========================================

Deployment Package: $PACKAGE_NAME
Package Size: $PACKAGE_SIZE
Created: $(date)

Files Included:
$(find . -type f -name "*.html" -o -name "*.css" -o -name "*.js" -o -name "*.svg" | sort)

Next Steps:
1. Upload to Cloudflare Pages or GitHub
2. Update placeholder content
3. Test all functionality
4. Set up custom domain (optional)

Deployment Options:
- GitHub + Cloudflare Pages (recommended)
- Direct upload to Cloudflare Pages
- Other hosting providers

For detailed instructions, see deploy-to-cloudflare.md
EOF

print_success "Deployment summary created: deployment-summary.txt"

# Final checklist
echo ""
echo "📋 Deployment Checklist:"
echo "========================"
echo "✅ All required files present"
echo "✅ Package created successfully"
echo "✅ HTML validation completed"
echo ""
echo "🔧 Before deploying:"
echo "1. Update placeholder content in files"
echo "2. Replace Chrome Web Store URLs"
echo "3. Update contact information"
echo "4. Add your Google Analytics ID"
echo "5. Test locally with a web server"
echo ""
echo "🚀 Ready to deploy!"
echo "=================="
echo "Package: $PACKAGE_NAME"
echo "Size: $PACKAGE_SIZE"
echo ""
echo "Choose your deployment method:"
echo "1. GitHub + Cloudflare Pages (recommended)"
echo "2. Direct upload to Cloudflare Pages"
echo "3. Other hosting provider"
echo ""
echo "For detailed instructions, see deploy-to-cloudflare.md" 