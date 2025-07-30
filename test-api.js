const fetch = require('node-fetch');

async function testAPI() {
  const SERVER_URL = 'https://ai-assistant-hub-app.azurewebsites.net';
  
  console.log('Testing backend health...');
  
  try {
    // Test health endpoint
    const healthResponse = await fetch(`${SERVER_URL}/health`);
    const healthData = await healthResponse.json();
    console.log('Health check:', healthData);
    
    // Test auth endpoint
    const authResponse = await fetch(`${SERVER_URL}/api/auth/health`);
    const authData = await authResponse.json();
    console.log('Auth health:', authData);
    
    console.log('\nBackend is responding!');
    
  } catch (error) {
    console.error('Error testing API:', error.message);
  }
}

testAPI(); 