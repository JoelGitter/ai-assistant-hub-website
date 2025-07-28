#!/bin/bash

# AI Assistant Hub Azure Deployment Script
# This script automates the deployment to Azure App Service

set -e

echo "🚀 Starting Azure deployment for AI Assistant Hub..."

# Configuration
RESOURCE_GROUP="ai-assistant-hub-rg"
APP_SERVICE_PLAN="ai-assistant-hub-plan"
WEB_APP_NAME="ai-assistant-hub-app"
LOCATION="East US"
RUNTIME="NODE|16-lts"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Azure CLI is installed
if ! command -v az &> /dev/null; then
    print_error "Azure CLI is not installed. Please install it first."
    echo "Installation guide: https://docs.microsoft.com/en-us/cli/azure/install-azure-cli"
    exit 1
fi

# Check if user is logged in to Azure
if ! az account show &> /dev/null; then
    print_warning "You are not logged in to Azure. Please login first."
    az login
fi

print_status "Creating resource group: $RESOURCE_GROUP"
az group create --name $RESOURCE_GROUP --location "$LOCATION" --output table

print_status "Creating App Service plan: $APP_SERVICE_PLAN"
az appservice plan create \
    --name $APP_SERVICE_PLAN \
    --resource-group $RESOURCE_GROUP \
    --sku B1 \
    --is-linux \
    --output table

print_status "Creating web app: $WEB_APP_NAME"
az webapp create \
    --name $WEB_APP_NAME \
    --resource-group $RESOURCE_GROUP \
    --plan $APP_SERVICE_PLAN \
    --runtime $RUNTIME \
    --output table

print_status "Configuring web app settings"
az webapp config set \
    --resource-group $RESOURCE_GROUP \
    --name $WEB_APP_NAME \
    --startup-file "npm start" \
    --output table

print_status "Setting up Git deployment"
DEPLOYMENT_URL=$(az webapp deployment source config-local-git \
    --name $WEB_APP_NAME \
    --resource-group $RESOURCE_GROUP \
    --query url \
    --output tsv)

print_status "Git deployment URL: $DEPLOYMENT_URL"

# Create .env file for local development
if [ ! -f .env ]; then
    print_status "Creating .env file from template"
    cp env.example .env
    print_warning "Please update .env with your actual values"
fi

# Install dependencies
print_status "Installing dependencies"
npm install

# Build the application
print_status "Building application"
npm run build 2>/dev/null || echo "No build script found, skipping..."

# Create deployment package
print_status "Creating deployment package"
zip -r ../deployment.zip . -x "node_modules/*" ".env" ".git/*" "*.log"

print_status "Deployment package created: ../deployment.zip"

# Deploy to Azure
print_status "Deploying to Azure App Service"
az webapp deployment source config-zip \
    --resource-group $RESOURCE_GROUP \
    --name $WEB_APP_NAME \
    --src ../deployment.zip \
    --output table

# Get the web app URL
WEB_APP_URL=$(az webapp show \
    --name $WEB_APP_NAME \
    --resource-group $RESOURCE_GROUP \
    --query defaultHostName \
    --output tsv)

print_status "✅ Deployment completed successfully!"
echo ""
echo "🌐 Your application is now live at:"
echo "   https://$WEB_APP_URL"
echo ""
echo "📊 Azure Portal:"
echo "   https://portal.azure.com/#@/resource/subscriptions/$(az account show --query id --output tsv)/resourceGroups/$RESOURCE_GROUP/providers/Microsoft.Web/sites/$WEB_APP_NAME"
echo ""
echo "🔧 Next steps:"
echo "   1. Set environment variables in Azure Portal"
echo "   2. Configure your domain (optional)"
echo "   3. Set up monitoring and logging"
echo ""
echo "📝 Environment variables to set:"
echo "   MONGODB_URI=your-mongodb-connection-string"
echo "   JWT_SECRET=your-jwt-secret"
echo "   STRIPE_SECRET_KEY=your-stripe-secret-key"
echo "   STRIPE_WEBHOOK_SECRET=your-webhook-secret"
echo "   OPENAI_API_KEY=your-openai-api-key"
echo "   NODE_ENV=production"
echo ""
echo "🔗 Set environment variables with:"
echo "   az webapp config appsettings set --resource-group $RESOURCE_GROUP --name $WEB_APP_NAME --settings MONGODB_URI=\"your-uri\" JWT_SECRET=\"your-secret\" ..."
echo ""
echo "📋 View logs with:"
echo "   az webapp log tail --name $WEB_APP_NAME --resource-group $RESOURCE_GROUP" 