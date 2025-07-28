#!/bin/bash

# AI Assistant Hub Extension Packaging Script
# This script creates a clean package for Chrome Web Store submission

echo "🚀 Packaging AI Assistant Hub Extension for Chrome Web Store..."

# Set variables
EXTENSION_NAME="ai-assistant-hub"
VERSION="1.0.0"
PACKAGE_NAME="${EXTENSION_NAME}-v${VERSION}-chrome-store.zip"

# Clean up any existing package
if [ -f "$PACKAGE_NAME" ]; then
    echo "Removing existing package: $PACKAGE_NAME"
    rm "$PACKAGE_NAME"
fi

# Create the package
echo "Creating package: $PACKAGE_NAME"
zip -r "$PACKAGE_NAME" . \
    -x "*.DS_Store" \
    -x "node_modules/*" \
    -x ".git/*" \
    -x "*.log" \
    -x "server/*" \
    -x "DEPLOYMENT.md" \
    -x "CHROME_EXTENSION_RELEASE.md" \
    -x "package.json" \
    -x "package-lock.json" \
    -x "package-extension.sh" \
    -x "*.zip" \
    -x ".env*" \
    -x "README.md" \
    -x "test.js" \
    -x "*.md" \
    -x "scripts/*" \
    -x "middleware/*" \
    -x "models/*" \
    -x "routes/*" \
    -x "services/*" \
    -x "web.config" \
    -x "azure-deploy.sh" \
    -x "appsettings.json" \
    -x ".deployment" \
    -x "LogFiles/*" \
    -x "deployments/*" \
    -x "logs.zip" \
    -x ".github/*"

# Check if package was created successfully
if [ -f "$PACKAGE_NAME" ]; then
    PACKAGE_SIZE=$(du -h "$PACKAGE_NAME" | cut -f1)
    echo "✅ Package created successfully!"
    echo "📦 Package name: $PACKAGE_NAME"
    echo "📏 Package size: $PACKAGE_SIZE"
    echo ""
    echo "📋 Package contents:"
    unzip -l "$PACKAGE_NAME" | head -20
    echo "..."
    echo ""
    echo "🎯 Next steps:"
    echo "1. Upload $PACKAGE_NAME to Chrome Web Store"
    echo "2. Complete the store listing information"
    echo "3. Submit for review"
    echo ""
    echo "📚 See CHROME_EXTENSION_RELEASE.md for detailed instructions"
else
    echo "❌ Error: Package creation failed"
    exit 1
fi 