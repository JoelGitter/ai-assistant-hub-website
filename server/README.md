# AI Assistant Hub Backend Server

A comprehensive Node.js/Express backend for the AI Assistant Hub with billing, authentication, and AI features.

## 🚀 Features

- **User Authentication**: JWT-based authentication with registration, login, and password reset
- **Subscription Management**: Stripe integration for billing and subscription handling
- **AI Services**: OpenAI-powered form filling, page summarization, and content generation
- **Usage Tracking**: Automatic usage tracking and limits for free/pro tiers
- **Webhook Processing**: Real-time Stripe webhook handling for subscription events
- **Security**: Rate limiting, CORS, helmet security headers
- **Database**: MongoDB with Mongoose ODM

## 📋 Prerequisites

- Node.js 16+ 
- MongoDB Atlas account
- Stripe account
- OpenAI API key
- Azure App Service (for production)

## 🛠️ Installation

1. **Clone the repository**
```bash
cd server
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up environment variables**
```bash
cp env.example .env
```

Edit `.env` with your configuration:
```env
# Server Configuration
PORT=3000
NODE_ENV=development

# MongoDB Configuration
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/ai-assistant-hub?retryWrites=true&w=majority

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-here
JWT_EXPIRES_IN=7d

# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key_here
STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here

# OpenAI Configuration
OPENAI_API_KEY=sk-your-openai-api-key-here
```

4. **Set up Stripe products and prices**
```bash
npm run setup
```

5. **Start the development server**
```bash
npm run dev
```

## 📚 API Documentation

### Authentication Endpoints

#### POST `/api/auth/register`
Register a new user.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "name": "John Doe"
}
```

**Response:**
```json
{
  "message": "User registered successfully",
  "token": "jwt_token_here",
  "user": {
    "id": "user_id",
    "email": "user@example.com",
    "name": "John Doe",
    "subscription": {
      "plan": "free",
      "status": "inactive"
    }
  }
}
```

#### POST `/api/auth/login`
Login user.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

#### GET `/api/auth/profile`
Get current user profile (requires authentication).

#### PUT `/api/auth/profile`
Update user profile (requires authentication).

### Billing Endpoints

#### POST `/api/billing/create-checkout-session`
Create a Stripe checkout session.

**Request Body:**
```json
{
  "priceId": "price_1234567890",
  "successUrl": "https://myassistanthub.com/success.html",
  "cancelUrl": "https://myassistanthub.com/#pricing",
  "customerEmail": "user@example.com"
}
```

#### POST `/api/billing/webhook`
Stripe webhook endpoint (handled automatically).

#### GET `/api/billing/subscription`
Get user's subscription status (requires authentication).

#### POST `/api/billing/create-portal-session`
Create Stripe customer portal session (requires authentication).

### AI Endpoints

#### POST `/api/ai/summarize`
Summarize page content.

**Request Body:**
```json
{
  "content": "Long text content to summarize...",
  "maxLength": 200
}
```

**Headers:**
```
Authorization: Bearer jwt_token_here
```

#### POST `/api/ai/fill-form`
Intelligently fill form fields.

**Request Body:**
```json
{
  "formData": {
    "firstName": "",
    "lastName": "",
    "email": ""
  },
  "userContext": "I'm applying for a job"
}
```

#### POST `/api/ai/generate`
Generate content based on prompt.

**Request Body:**
```json
{
  "prompt": "Write a professional email",
  "type": "email",
  "maxLength": 500
}
```

#### POST `/api/ai/analyze`
Analyze text sentiment and extract information.

**Request Body:**
```json
{
  "text": "Text to analyze...",
  "analysisType": "sentiment"
}
```

## 🔧 Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `PORT` | Server port | No (default: 3000) |
| `NODE_ENV` | Environment (development/production) | No |
| `MONGODB_URI` | MongoDB connection string | Yes |
| `JWT_SECRET` | Secret for JWT tokens | Yes |
| `JWT_EXPIRES_IN` | JWT token expiration | No (default: 7d) |
| `STRIPE_SECRET_KEY` | Stripe secret key | Yes |
| `STRIPE_PUBLISHABLE_KEY` | Stripe publishable key | Yes |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook secret | Yes |
| `OPENAI_API_KEY` | OpenAI API key | Yes |

## 🚀 Deployment

### Azure App Service

1. **Install Azure CLI**
```bash
# macOS
brew install azure-cli

# Windows
# Download from Microsoft
```

2. **Login to Azure**
```bash
az login
```

3. **Create Azure resources**
```bash
# Create resource group
az group create --name ai-assistant-hub-rg --location "East US"

# Create app service plan
az appservice plan create --name ai-assistant-hub-plan --resource-group ai-assistant-hub-rg --sku B1

# Create web app
az webapp create --name ai-assistant-hub-app --resource-group ai-assistant-hub-rg --plan ai-assistant-hub-plan --runtime "NODE|16-lts"
```

4. **Set environment variables**
```bash
az webapp config appsettings set \
  --resource-group ai-assistant-hub-rg \
  --name ai-assistant-hub-app \
  --settings \
  MONGODB_URI="your-mongodb-uri" \
  JWT_SECRET="your-jwt-secret" \
  STRIPE_SECRET_KEY="your-stripe-secret-key" \
  STRIPE_WEBHOOK_SECRET="your-webhook-secret" \
  OPENAI_API_KEY="your-openai-api-key" \
  NODE_ENV="production"
```

5. **Deploy the application**
```bash
# From the server directory
az webapp deployment source config-local-git --name ai-assistant-hub-app --resource-group ai-assistant-hub-rg

# Get the Git URL and push
git remote add azure <GIT_URL>
git push azure main
```

## 🔒 Security Features

- **JWT Authentication**: Secure token-based authentication
- **Rate Limiting**: 100 requests per 15 minutes per IP
- **CORS Protection**: Configured for specific domains
- **Helmet Security**: Security headers and CSP
- **Input Validation**: Express-validator for all inputs
- **Password Hashing**: bcryptjs for password security
- **Account Lockout**: 5 failed attempts locks account for 2 hours

## 📊 Usage Tracking

The system automatically tracks usage for each user:

- **Free Tier**: 10 requests per month
- **Pro Tier**: 1000 requests per month
- **Usage Resets**: Monthly on the same date
- **Real-time Checks**: Before each AI request

## 🔄 Webhook Events

The server handles these Stripe webhook events:

- `checkout.session.completed`: User completes payment
- `customer.subscription.created`: New subscription created
- `customer.subscription.updated`: Subscription updated
- `customer.subscription.deleted`: Subscription cancelled
- `invoice.payment_succeeded`: Payment successful
- `invoice.payment_failed`: Payment failed

## 🧪 Testing

```bash
# Run tests
npm test

# Run with coverage
npm run test:coverage
```

## 📝 Scripts

```bash
# Development
npm run dev          # Start with nodemon

# Production
npm start            # Start server

# Setup
npm run setup        # Setup Stripe products/prices

# Testing
npm test             # Run tests
```

## 🐛 Troubleshooting

### Common Issues

1. **MongoDB Connection Error**
   - Check your MongoDB URI
   - Ensure network access is configured
   - Verify username/password

2. **Stripe Webhook Errors**
   - Verify webhook secret
   - Check webhook endpoint URL
   - Ensure events are enabled

3. **OpenAI API Errors**
   - Check API key
   - Verify account has credits
   - Check rate limits

### Logs

```bash
# View Azure logs
az webapp log tail --name ai-assistant-hub-app --resource-group ai-assistant-hub-rg

# Local logs
npm run dev
```

## 📞 Support

For issues and questions:
- Check the logs for error details
- Verify environment variables
- Test endpoints with Postman/curl
- Check Stripe dashboard for webhook events

## 📄 License

MIT License - see LICENSE file for details. 