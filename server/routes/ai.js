const express = require('express');
const { body, validationResult } = require('express-validator');
const OpenAI = require('openai');
const { checkSubscriptionAccess, incrementUsage, getUsageStats } = require('../middleware/billing');
const { auth } = require('../middleware/auth');
const router = express.Router();

// Initialize OpenAI (optional for testing)
let openai = null;
if (process.env.OPENAI_API_KEY) {
  console.log('[AI] OpenAI API key found, initializing...');
  openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
  });
  console.log('[AI] OpenAI initialized successfully');
} else {
  console.log('[AI] No OpenAI API key found, using mock responses');
}

// Summarize page content
router.post('/summarize', [
  auth, // Re-enabled authentication
  checkSubscriptionAccess, // Re-enabled subscription check
  getUsageStats, // Add usage stats to response
  body('content').optional().isString(),
  body('text').optional().isString(),
  body('maxLength').optional().isInt({ min: 50, max: 1000 })
], async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: errors.array() 
      });
    }

    const { content, text, maxLength = 200 } = req.body;
    const contentToSummarize = content || text;

    if (!contentToSummarize) {
      return res.status(400).json({ error: 'Content or text is required' });
    }

    let summary;
    
    // Use OpenAI if available, otherwise fallback to mock
    if (openai) {
      try {
        console.log('[AI] Attempting OpenAI API call...');
        console.log('[AI] Content length:', contentToSummarize.length);
        console.log('[AI] Max length:', maxLength);
        
        const completion = await openai.chat.completions.create({
          model: "gpt-3.5-turbo",
          messages: [
            {
              role: "system",
              content: `You are an AI assistant that creates concise, informative summaries. 
              Summarize the given content in ${maxLength} words or less. 
              Focus on the key points and main ideas.`
            },
            {
              role: "user",
              content: `Please summarize this content: ${contentToSummarize}`
            }
          ],
          max_tokens: 500,
          temperature: 0.3
        });
        
        console.log('[AI] OpenAI API call successful');
        summary = completion.choices[0].message.content;
      } catch (error) {
        console.error('[AI] OpenAI API error details:', {
          name: error.name,
          message: error.message,
          status: error.status,
          code: error.code,
          type: error.type
        });
        // Fallback to mock response if OpenAI fails
        summary = `This is a test summary of the content. The original text was: "${contentToSummarize.substring(0, 50)}..." - This is a fallback response due to OpenAI API issues.`;
      }
    } else {
      console.log('[AI] OpenAI not initialized - using mock response');
      // Mock response when OpenAI is not configured
      summary = `This is a test summary of the content. The original text was: "${contentToSummarize.substring(0, 50)}..." - This is a mock response for testing the Chrome extension.`;
    }

    // Increment usage after successful request (before sending response)
    try {
      await incrementUsage(req, res, () => {});
    } catch (error) {
      console.error('Error incrementing usage:', error);
      // Don't fail the request if usage tracking fails
    }

    res.json({
      summary: summary,
      success: true,
      usage: res.locals.usageStats
    });

  } catch (error) {
    console.error('Error summarizing content:', error);
    res.status(500).json({ 
      error: 'Failed to summarize content',
      details: error.message 
    });
  }
});

// Fill form fields intelligently
router.post('/fill-form', [
  auth,
  checkSubscriptionAccess,
  body('formData').isObject(),
  body('userContext').optional().isString()
], async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: errors.array() 
      });
    }

    const { formData, userContext = '' } = req.body;

    // Create form filling suggestions using OpenAI
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: `You are an AI assistant that helps fill out forms intelligently. 
          Analyze the form fields and provide appropriate values based on the user's context. 
          Return only a JSON object with field names as keys and suggested values as values.`
        },
        {
          role: "user",
          content: `Form fields: ${JSON.stringify(formData)}
          User context: ${userContext}
          
          Please suggest appropriate values for these form fields.`
        }
      ],
      max_tokens: 1000,
      temperature: 0.2
    });

    const suggestions = JSON.parse(completion.choices[0].message.content);

    // Increment usage after successful request
    await incrementUsage(req, res, () => {});

    res.json({
      suggestions,
      usage: res.locals.usageStats
    });

  } catch (error) {
    console.error('Error filling form:', error);
    res.status(500).json({ 
      error: 'Failed to fill form',
      details: error.message 
    });
  }
});

// Fill individual form field (for Chrome extension)
router.post('/fill', [
  auth, // Re-enabled authentication
  checkSubscriptionAccess, // Re-enabled subscription check
  getUsageStats, // Add usage stats to response
  body('context').isString(),
  body('instruction').optional().isString(),
  body('url').optional().isString(),
  body('fieldType').optional().isString()
], async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: errors.array() 
      });
    }

    const { context, instruction = '', url, fieldType } = req.body;

    // Simple mock response for testing (no OpenAI required)
    const mockResult = `Sample text for ${fieldType || 'text'} field. Context: "${context.substring(0, 30)}..." - This is a mock response for testing the Chrome extension.`;

    // Increment usage after successful request (before sending response)
    try {
      await incrementUsage(req, res, () => {});
    } catch (error) {
      console.error('Error incrementing usage:', error);
      // Don't fail the request if usage tracking fails
    }

    res.json({
      result: mockResult,
      success: true,
      usage: res.locals.usageStats
    });

  } catch (error) {
    console.error('Error filling field:', error);
    res.status(500).json({ 
      error: 'Failed to fill field',
      details: error.message 
    });
  }
});

// Generate content based on prompt
router.post('/generate', [
  auth,
  checkSubscriptionAccess,
  body('prompt').isString().notEmpty(),
  body('type').optional().isIn(['text', 'list', 'email', 'code']),
  body('maxLength').optional().isInt({ min: 50, max: 2000 })
], async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: errors.array() 
      });
    }

    const { prompt, type = 'text', maxLength = 500 } = req.body;

    let systemPrompt = 'You are a helpful AI assistant.';
    
    switch (type) {
      case 'list':
        systemPrompt += ' Create a well-structured list based on the user\'s request.';
        break;
      case 'email':
        systemPrompt += ' Write a professional email based on the user\'s request.';
        break;
      case 'code':
        systemPrompt += ' Generate clean, well-commented code based on the user\'s request.';
        break;
      default:
        systemPrompt += ' Provide a helpful response to the user\'s request.';
    }

    // Generate content using OpenAI
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: systemPrompt
        },
        {
          role: "user",
          content: prompt
        }
      ],
      max_tokens: Math.min(maxLength * 2, 2000),
      temperature: 0.7
    });

    const generatedContent = completion.choices[0].message.content;

    // Increment usage after successful request
    await incrementUsage(req, res, () => {});

    res.json({
      content: generatedContent,
      type,
      usage: res.locals.usageStats
    });

  } catch (error) {
    console.error('Error generating content:', error);
    res.status(500).json({ 
      error: 'Failed to generate content',
      details: error.message 
    });
  }
});

// Analyze text sentiment and extract key information
router.post('/analyze', [
  auth,
  checkSubscriptionAccess,
  body('text').isString().notEmpty(),
  body('analysisType').optional().isIn(['sentiment', 'entities', 'summary', 'all'])
], async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: errors.array() 
      });
    }

    const { text, analysisType = 'all' } = req.body;

    let systemPrompt = 'You are an AI assistant that analyzes text.';
    let userPrompt = `Analyze the following text: "${text}"`;

    switch (analysisType) {
      case 'sentiment':
        systemPrompt += ' Analyze the sentiment and emotional tone of the text.';
        userPrompt += ' Focus on sentiment analysis only.';
        break;
      case 'entities':
        systemPrompt += ' Extract key entities, names, places, and important information from the text.';
        userPrompt += ' Focus on entity extraction only.';
        break;
      case 'summary':
        systemPrompt += ' Provide a concise summary of the main points.';
        userPrompt += ' Focus on summarization only.';
        break;
      default:
        systemPrompt += ' Provide a comprehensive analysis including sentiment, entities, and summary.';
    }

    // Analyze text using OpenAI
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: systemPrompt
        },
        {
          role: "user",
          content: userPrompt
        }
      ],
      max_tokens: 800,
      temperature: 0.3
    });

    const analysis = completion.choices[0].message.content;

    // Increment usage after successful request
    await incrementUsage(req, res, () => {});

    res.json({
      analysis,
      analysisType,
      usage: res.locals.usageStats
    });

  } catch (error) {
    console.error('Error analyzing text:', error);
    res.status(500).json({ 
      error: 'Failed to analyze text',
      details: error.message 
    });
  }
});

// Get user's usage statistics
router.get('/usage', [auth, getUsageStats], async (req, res) => {
  try {
    res.json({
      usage: res.locals.usageStats
    });
  } catch (error) {
    console.error('Error getting usage:', error);
    res.status(500).json({ error: 'Failed to get usage statistics' });
  }
});

// Health check for AI service
router.get('/health', async (req, res) => {
  try {
    // Test OpenAI connection
    await openai.models.list();
    
    res.json({
      status: 'healthy',
      service: 'ai',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('AI service health check failed:', error);
    res.status(503).json({
      status: 'unhealthy',
      service: 'ai',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

module.exports = router; 