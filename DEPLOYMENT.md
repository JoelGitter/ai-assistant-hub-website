# 🚀 Azure Deployment Guide

## Prerequisites

1. **Azure Account**: You need an active Azure subscription
2. **Azure CLI**: Install from [https://docs.microsoft.com/en-us/cli/azure/install-azure-cli](https://docs.microsoft.com/en-us/cli/azure/install-azure-cli)
3. **Git**: For code deployment

## Step 1: Install and Login to Azure CLI

```bash
# Install Azure CLI (if not already installed)
# macOS: brew install azure-cli
# Windows: Download from Microsoft
# Linux: Follow official docs

# Login to Azure
az login
```

## Step 2: Create Azure Resources

```bash
# Make the deployment script executable
chmod +x server/azure-deploy.sh

# Run the deployment script
cd server
./azure-deploy.sh
```

This will create:
- Resource Group: `ai-assistant-hub-rg`
- App Service Plan: `ai-assistant-hub-plan`
- Web App: `ai-assistant-hub-app`

## Step 3: Set Environment Variables

```bash
# Set your environment variables (replace with your actual values)
az webapp config appsettings set \
  --name ai-assistant-hub-app \
  --resource-group ai-assistant-hub-rg \
  --settings \
  MONGODB_URI="mongodb+srv://username:password@cluster.mongodb.net/ai-assistant-hub?retryWrites=true&w=majority" \
  JWT_SECRET="your-super-secret-jwt-key-here" \
  OPENAI_API_KEY="your-openai-api-key-here" \
  SESSION_SECRET="your-session-secret-here" \
  NODE_ENV="production" \
  PORT="8080"
```

## Step 4: Deploy Your Code

### Option A: Git Deployment (Recommended)

```bash
# Configure Git deployment
az webapp deployment source config-local-git \
  --name ai-assistant-hub-app \
  --resource-group ai-assistant-hub-rg

# Get the Git URL
az webapp deployment source show \
  --name ai-assistant-hub-app \
  --resource-group ai-assistant-hub-rg

# Add Azure as a remote and push
git remote add azure <GIT_URL_FROM_ABOVE>
git add .
git commit -m "Deploy to Azure"
git push azure main
```

### Option B: ZIP Deployment

```bash
# Create a deployment package
cd server
zip -r ../deployment.zip . -x "node_modules/*" ".env"

# Deploy the ZIP file
az webapp deployment source config-zip \
  --resource-group ai-assistant-hub-rg \
  --name ai-assistant-hub-app \
  --src ../deployment.zip
```

## Step 5: Update Chrome Extension

After deployment, update your Chrome extension to use the Azure URL:

1. **Update `popup.js`**:
```javascript
const SERVER_URL = 'https://ai-assistant-hub-app.azurewebsites.net';
```

2. **Update `content.js`**:
```javascript
const SERVER_URL = 'https://ai-assistant-hub-app.azurewebsites.net';
```

3. **Update `manifest.json`**:
```json
"host_permissions": [
  "https://ai-assistant-hub-app.azurewebsites.net/*"
]
```

4. **Reload the extension** in Chrome

## Step 6: Test Your Deployment

1. **Health Check**: Visit `https://ai-assistant-hub-app.azurewebsites.net/health`
2. **Test Registration**: Use the Chrome extension to create an account
3. **Test AI Features**: Try summarizing a page or filling a field

## Monitoring and Logs

```bash
# View application logs
az webapp log tail --name ai-assistant-hub-app --resource-group ai-assistant-hub-rg

# View deployment logs
az webapp deployment list --name ai-assistant-hub-app --resource-group ai-assistant-hub-rg
```

## Scaling and Performance

### Upgrade App Service Plan
```bash
# Scale up to a larger plan
az appservice plan update \
  --name ai-assistant-hub-plan \
  --resource-group ai-assistant-hub-rg \
  --sku S1
```

### Enable Auto-scaling
```bash
# Enable auto-scaling rules
az monitor autoscale create \
  --resource-group ai-assistant-hub-rg \
  --resource ai-assistant-hub-plan \
  --resource-type Microsoft.Web/serverfarms \
  --name ai-assistant-hub-autoscale \
  --min-count 1 \
  --max-count 3 \
  --count 1
```

## Cost Optimization

- **Development**: Use B1 plan (~$13/month)
- **Production**: Use S1 plan (~$73/month)
- **High Traffic**: Use P1V2 plan (~$146/month)

## Security Best Practices

1. **Use Azure Key Vault** for sensitive environment variables
2. **Enable HTTPS** (automatic with Azure)
3. **Set up monitoring** with Application Insights
4. **Configure backup** for your database

## Troubleshooting

### Common Issues

1. **App won't start**: Check logs with `az webapp log tail`
2. **Environment variables not set**: Verify with `az webapp config appsettings list`
3. **CORS errors**: Update CORS settings in `server.js`
4. **Database connection**: Verify MongoDB Atlas network access

### Useful Commands

```bash
# Restart the app
az webapp restart --name ai-assistant-hub-app --resource-group ai-assistant-hub-rg

# View app settings
az webapp config appsettings list --name ai-assistant-hub-app --resource-group ai-assistant-hub-rg

# View app status
az webapp show --name ai-assistant-hub-app --resource-group ai-assistant-hub-rg
```

## Next Steps

1. **Set up custom domain** (optional)
2. **Configure SSL certificates** (automatic with Azure)
3. **Set up monitoring** with Application Insights
4. **Add billing integration** with Stripe
5. **Implement CI/CD** with GitHub Actions

Your AI Assistant Hub is now live on Azure! 🎉 