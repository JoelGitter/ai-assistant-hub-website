// Configuration file for AI Assistant Hub
window.AI_ASSISTANT_CONFIG = {
    version: '4.0.0',
    environment: 'production',
    features: {
        formFilling: true,
        pageSummarization: true,
        smartNavigation: true
    },
    api: {
        baseUrl: 'https://api.myassistanthub.com',
        timeout: 30000
    },
    stripe: {
        publishableKey: 'pk_live_your_stripe_key_here'
    }
};
