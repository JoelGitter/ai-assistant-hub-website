const express = require("express");
const { body, validationResult } = require("express-validator");
const OpenAI = require("openai");
const sgMail = require("@sendgrid/mail");
const {
  checkSubscriptionAccess,
  incrementUsage,
  getUsageStats,
} = require("../middleware/billing");
const { auth } = require("../middleware/auth");
const router = express.Router();

// Initialize OpenAI (optional for testing)
let openai = null;
if (process.env.OPENAI_API_KEY) {
  console.log("[AI] OpenAI API key found, initializing...");
  openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
  console.log("[AI] OpenAI initialized successfully");
} else {
  console.log("[AI] No OpenAI API key found, using mock responses");
}

// Summarize page content
router.post(
  "/summarize",
  [
    auth, // Re-enabled authentication
    checkSubscriptionAccess, // Re-enabled subscription check
    body("content").optional().isString(),
    body("text").optional().isString(),
    body("maxLength").optional().isInt({ min: 50, max: 1000 }),
  ],
  async (req, res) => {
    try {
      // Check for validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: "Validation failed",
          details: errors.array(),
        });
      }

      const { content, text, maxLength = 200, isYouTubeVideo = false } = req.body;
      const contentToSummarize = content || text;

      if (!contentToSummarize) {
        return res.status(400).json({ error: "Content or text is required" });
      }

      let summary;

      // Use OpenAI if available, otherwise fallback to mock
      if (openai) {
        try {
          console.log("[AI] Attempting OpenAI API call...");
          console.log("[AI] Content length:", contentToSummarize.length);
          console.log("[AI] Max length:", maxLength);
          console.log("[AI] Is YouTube video:", isYouTubeVideo);

          // Different prompts for YouTube videos vs regular content
          let systemPrompt;
          if (isYouTubeVideo) {
            systemPrompt = `You are an AI assistant that creates comprehensive, detailed summaries of YouTube video transcripts. 
            
            For YouTube videos, provide a thorough analysis that includes:
            1. Main topics and themes discussed (3-8 key points)
            2. Important details, facts, or insights mentioned
            3. Key takeaways or conclusions
            4. Notable quotes or statements (if any)
            5. Structure and flow of the content
            
            Always return summaries as 5-8 numbered bullet points (1., 2., 3., etc.).
            Each bullet point should be 2-3 sentences for comprehensive coverage.
            Focus on providing substantial detail and insights from the video content.
            If the video is long (1+ hours), provide more detailed analysis.
            If the video is educational or informational, highlight the key learning points.
            
            Format the response exactly like this example:
            1. First main topic with detailed explanation and key points discussed.
            2. Second important theme with specific details and insights provided.
            3. Third significant aspect with relevant facts and conclusions.
            4. Fourth key point with notable details and implications.
            5. Additional important content with comprehensive coverage.`;
          } else {
            systemPrompt = `You are an AI assistant that creates concise, structured summaries. 
            Always return summaries as 3-8 numbered bullet points (1., 2., 3., etc.).
            Each bullet point should be 1-2 sentences maximum.
            Focus on the key points, main ideas, and important details.
            Format the response exactly like this example:
            1. First key point about the main topic.
            2. Second important detail or finding.
            3. Third significant aspect or conclusion.
            4. Fourth relevant point or implication.`;
          }

          const completion = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [
              {
                role: "system",
                content: systemPrompt,
              },
              {
                role: "user",
                content: `Please provide a comprehensive summary of this ${isYouTubeVideo ? 'video transcript' : 'content'}: ${contentToSummarize}`,
              },
            ],
            max_tokens: isYouTubeVideo ? 1000 : 500, // More tokens for YouTube videos
            temperature: 0.3,
          });

          console.log("[AI] OpenAI API call successful");
          summary = completion.choices[0].message.content;
        } catch (error) {
          console.error("[AI] OpenAI API error details:", {
            name: error.name,
            message: error.message,
            status: error.status,
            code: error.code,
            type: error.type,
          });
          // Return the actual error message instead of generic fallback
          summary = `OpenAI API Error: ${
            error.message || error.name || "Unknown error"
          }. Status: ${error.status || "Unknown"}. Code: ${
            error.code || "Unknown"
          }.`;
        }
      } else {
        // Mock response for testing
        console.log("[AI] Using mock response (no OpenAI API key)");
        summary = `1. This is a mock summary for testing purposes.
2. The content appears to be about various topics.
3. In a real implementation, this would be generated by AI.
4. Please add your OpenAI API key for actual summarization.`;
      }

      // Get updated usage stats AFTER incrementing
      try {
        await getUsageStats(req, res, () => {});
      } catch (error) {
        console.error("Error getting usage stats:", error);
        return res.status(500).json({
          error: "Failed to get usage statistics",
          details: error.message
        });
      }

      res.json({
        summary: summary,
        success: true,
        usage: res.locals.usageStats,
      });
    } catch (error) {
      console.error("[AI] Summarize error:", error);
      res.status(500).json({
        error: "Internal server error",
        details: error.message,
      });
    }
  }
);

// Fill form fields intelligently
router.post(
  "/fill-form",
  [
    auth,
    checkSubscriptionAccess,
    body("formData").isObject(),
    body("userContext").optional().isString(),
  ],
  async (req, res) => {
    try {
      // Check for validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: "Validation failed",
          details: errors.array(),
        });
      }

      const { formData, userContext = "" } = req.body;

      // Create form filling suggestions using OpenAI
      const completion = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: `You are an AI assistant that helps fill out forms intelligently, but you are not brief. 
          Analyze the form fields and provide appropriate values based on the user's context. 
          Return only a JSON object with field names as keys and suggested values as values.`,
          },
          {
            role: "user",
            content: `Form fields: ${JSON.stringify(formData)}
          User context: ${userContext}
          
          Please suggest appropriate values for these form fields.`,
          },
        ],
        max_tokens: 1000,
        temperature: 0.2,
      });

      const suggestions = JSON.parse(completion.choices[0].message.content);

      // Increment usage after successful request
      try {
        await incrementUsage(req, res, () => {});
      } catch (error) {
        console.error("Error incrementing usage:", error);
        return res.status(500).json({ 
          error: "Usage tracking failed", 
          details: error.message 
        });
      }

      // Get updated usage stats AFTER incrementing
      try {
        await getUsageStats(req, res, () => {});
      } catch (error) {
        console.error("Error getting usage stats:", error);
        return res.status(500).json({ 
          error: "Failed to get usage statistics", 
          details: error.message 
        });
      }

      res.json({
        suggestions,
        usage: res.locals.usageStats,
      });
    } catch (error) {
      console.error("Error filling form:", error);
      res.status(500).json({
        error: "Failed to fill form",
        details: error.message,
      });
    }
  }
);

// Fill individual form field (for Chrome extension)
router.post(
  "/fill",
  [
    auth, // Re-enabled authentication
    checkSubscriptionAccess, // Re-enabled subscription check
    body("context").isString(),
    body("instruction").optional().isString(),
    body("url").optional().isString(),
    body("fieldType").optional().isString(),
  ],
  async (req, res) => {
    try {
      // Check for validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: "Validation failed",
          details: errors.array(),
        });
      }

      const { context, instruction = "", url, fieldType } = req.body;

      let result;

      // Use OpenAI if available, otherwise fallback to mock
      if (openai) {
        try {
          console.log("[AI] Attempting OpenAI API call for field fill...");

          const completion = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [
              {
                role: "system",
                content: `You are an AI assistant that helps fill out form fields intelligently.
                  Based on the context and user instruction, provide an appropriate value for the field.
                  Generate detailed, realistic responses that match the field type and context.
                  For text areas, provide longer, more comprehensive content.
                  For input fields, provide appropriate but detailed responses.
                  Return only the value, no explanations or additional text.`,
                },
                {
                  role: "user",
                  content: `Field type: ${fieldType || "text"}
                  Context: ${context}
                  User instruction: ${instruction}
                  
                  Please provide a detailed, appropriate value for this field.`,
                },
              ],
              max_tokens: 300,
              temperature: 0.7,
            });

          console.log("[AI] OpenAI API call successful for field fill");
          result = completion.choices[0].message.content;
        } catch (error) {
          console.error("[AI] OpenAI API error for field fill:", {
            name: error.name,
            message: error.message,
            status: error.status,
            code: error.code,
            type: error.type,
          });
          // Fallback to mock response if OpenAI fails
          result = `Sample text for ${
            fieldType || "text"
          } field. Context: "${context.substring(
            0,
            30
          )}..." - This is a fallback response due to OpenAI API issues.`;
        }
      } else {
        console.log(
          "[AI] OpenAI not initialized - using mock response for field fill"
        );
        // Mock response when OpenAI is not configured
        result = `Sample text for ${
          fieldType || "text"
        } field. Context: "${context.substring(
          0,
          30
        )}..." - This is a mock response for testing the Chrome extension.`;
      }

      // Increment usage after successful request (before sending response)
      try {
        await incrementUsage(req, res, () => {});
      } catch (error) {
        console.error("Error incrementing usage:", error);
        return res.status(500).json({ 
          error: "Usage tracking failed", 
          details: error.message 
        });
      }

      // Get updated usage stats AFTER incrementing
      try {
        await getUsageStats(req, res, () => {});
      } catch (error) {
        console.error("Error getting usage stats:", error);
        return res.status(500).json({ 
          error: "Failed to get usage statistics", 
          details: error.message 
        });
      }

      res.json({
        result: result,
        success: true,
        usage: res.locals.usageStats,
      });
    } catch (error) {
      console.error("Error filling field:", error);
      res.status(500).json({
        error: "Failed to fill field",
        details: error.message,
      });
    }
  }
);

// Generate content based on prompt
router.post(
  "/generate",
  [
    auth,
    checkSubscriptionAccess,
    body("prompt").isString().notEmpty(),
    body("type").optional().isIn(["text", "list", "email", "code"]),
    body("maxLength").optional().isInt({ min: 50, max: 2000 }),
  ],
  async (req, res) => {
    try {
      // Check for validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: "Validation failed",
          details: errors.array(),
        });
      }

      const { prompt, type = "text", maxLength = 500 } = req.body;

      let systemPrompt = "You are a helpful AI assistant.";

      switch (type) {
        case "list":
          systemPrompt +=
            " Create a well-structured list based on the user's request.";
          break;
        case "email":
          systemPrompt +=
            " Write a professional email based on the user's request.";
          break;
        case "code":
          systemPrompt +=
            " Generate clean, well-commented code based on the user's request.";
          break;
        default:
          systemPrompt += " Provide a helpful response to the user's request.";
      }

      // Generate content using OpenAI
      const completion = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: systemPrompt,
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        max_tokens: Math.min(maxLength * 2, 2000),
        temperature: 0.7,
      });

      const generatedContent = completion.choices[0].message.content;

      // Increment usage after successful request
      try {
        await incrementUsage(req, res, () => {});
      } catch (error) {
        console.error("Error incrementing usage:", error);
        return res.status(500).json({ 
          error: "Usage tracking failed", 
          details: error.message 
        });
      }

      res.json({
        content: generatedContent,
        type,
        usage: res.locals.usageStats,
      });
    } catch (error) {
      console.error("Error generating content:", error);
      res.status(500).json({
        error: "Failed to generate content",
        details: error.message,
      });
    }
  }
);

// Analyze text sentiment and extract key information
router.post(
  "/analyze",
  [
    auth,
    checkSubscriptionAccess,
    body("text").isString().notEmpty(),
    body("analysisType")
      .optional()
      .isIn(["sentiment", "entities", "summary", "all"]),
  ],
  async (req, res) => {
    try {
      // Check for validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: "Validation failed",
          details: errors.array(),
        });
      }

      const { text, analysisType = "all" } = req.body;

      let systemPrompt = "You are an AI assistant that analyzes text.";
      let userPrompt = `Analyze the following text: "${text}"`;

      switch (analysisType) {
        case "sentiment":
          systemPrompt +=
            " Analyze the sentiment and emotional tone of the text.";
          userPrompt += " Focus on sentiment analysis only.";
          break;
        case "entities":
          systemPrompt +=
            " Extract key entities, names, places, and important information from the text.";
          userPrompt += " Focus on entity extraction only.";
          break;
        case "summary":
          systemPrompt += " Provide a concise summary of the main points.";
          userPrompt += " Focus on summarization only.";
          break;
        default:
          systemPrompt +=
            " Provide a comprehensive analysis including sentiment, entities, and summary.";
      }

      // Analyze text using OpenAI
      const completion = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: systemPrompt,
          },
          {
            role: "user",
            content: userPrompt,
          },
        ],
        max_tokens: 800,
        temperature: 0.3,
      });

      const analysis = completion.choices[0].message.content;

      // Increment usage after successful request
      try {
        await incrementUsage(req, res, () => {});
      } catch (error) {
        console.error("Error incrementing usage:", error);
        return res.status(500).json({ 
          error: "Usage tracking failed", 
          details: error.message 
        });
      }

      res.json({
        analysis,
        analysisType,
        usage: res.locals.usageStats,
      });
    } catch (error) {
      console.error("Error analyzing text:", error);
      res.status(500).json({
        error: "Failed to analyze text",
        details: error.message,
      });
    }
  }
);

// Support request endpoint
router.post(
  "/support",
  [
    auth,
    checkSubscriptionAccess,
    incrementUsage,
    body("email").isEmail(),
    body("subject").isLength({ min: 1, max: 200 }),
    body("message").isString().isLength({ min: 10, max: 2000 }),
  ],
  async (req, res) => {
    try {
      // Check for validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: "Validation failed",
          details: errors.array(),
        });
      }

      const { email, subject, message, url, userAgent } = req.body;
      const userId = req.user.id;

      console.log("[Support] New support request received:", {
        userId,
        email,
        subject,
        url,
        messageLength: message.length
      });

      // Here you would typically:
      // 1. Save to database
      // 2. Send email notification
      // 3. Create ticket in support system
      
      // Send email notification
      try {
        // Check if SendGrid API key is configured
        if (!process.env.SENDGRID_API_KEY) {
          console.error("[Support] SendGrid API key not configured");
          return res.status(500).json({
            error: "Email service not configured",
            details: "SendGrid API key is missing"
          });
        }

        console.log("[Support] Attempting to send email with SendGrid...");

        // Use a more robust email configuration
        sgMail.setApiKey(process.env.SENDGRID_API_KEY);
        const msg = {
          to: 'joelhenrycl@gmail.com',
          from: {
            email: 'aiassistanthub@gmail.com',
            name: 'AI Assistant Hub Support'
          },
          subject: `[AI Assistant Hub Support] ${subject}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
              <div style="background-color: #ffffff; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                <h2 style="color: #333; margin-bottom: 20px; border-bottom: 2px solid #007bff; padding-bottom: 10px;">
                  🆘 New Support Request
                </h2>
                
                <div style="margin-bottom: 20px;">
                  <h3 style="color: #007bff; margin-bottom: 10px;">Request Details</h3>
                  <p><strong>From:</strong> ${email}</p>
                  <p><strong>User ID:</strong> ${userId}</p>
                  <p><strong>Subject:</strong> ${subject}</p>
                  <p><strong>Timestamp:</strong> ${new Date().toLocaleString()}</p>
                </div>
                
                <div style="margin-bottom: 20px;">
                  <h3 style="color: #007bff; margin-bottom: 10px;">Technical Information</h3>
                  <p><strong>URL:</strong> <a href="${url}" style="color: #007bff;">${url}</a></p>
                  <p><strong>User Agent:</strong> <span style="font-size: 12px; color: #666;">${userAgent}</span></p>
                </div>
                
                <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; border-left: 4px solid #007bff;">
                  <h3 style="color: #007bff; margin-bottom: 15px;">Message</h3>
                  <div style="white-space: pre-wrap; line-height: 1.6; color: #333;">
                    ${message.replace(/\n/g, '<br>')}
                  </div>
                </div>
                
                <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #666;">
                  <p>This is an automated support request from AI Assistant Hub.</p>
                  <p>Please respond to the user at: <strong>${email}</strong></p>
                </div>
              </div>
            </div>
          `,
          text: `
New Support Request

From: ${email}
User ID: ${userId}
Subject: ${subject}
URL: ${url}
User Agent: ${userAgent}
Timestamp: ${new Date().toLocaleString()}

Message:
${message}

---
This is an automated support request from AI Assistant Hub.
Please respond to the user at: ${email}
          `
        };

        await sgMail.send(msg);
        console.log("[Support] Email sent successfully to joelhenrycl@gmail.com");
      } catch (emailError) {
        console.error("[Support] Email sending failed:", emailError);
        return res.status(500).json({
          error: "Failed to send support request",
          details: emailError.message
        });
      }
      
      // For now, we'll just log it and return success
      console.log("[Support] Support request details:", {
        userId,
        email,
        subject,
        message: message.substring(0, 100) + "...",
        url,
        userAgent,
        timestamp: new Date().toISOString()
      });

      // Get updated usage stats
      try {
        await getUsageStats(req, res, () => {});
      } catch (error) {
        console.error("Error getting usage stats:", error);
        return res.status(500).json({
          error: "Failed to get usage statistics",
          details: error.message
        });
      }

      res.json({
        success: true,
        message: "Support request submitted successfully",
        usage: res.locals.usageStats,
      });
    } catch (error) {
      console.error("[Support] Error processing support request:", error);
      res.status(500).json({
        error: "Internal server error",
        details: error.message,
      });
    }
  }
);

// Get user's usage statistics
router.get("/usage", [auth, getUsageStats], async (req, res) => {
  try {
    res.json({
      usage: res.locals.usageStats,
    });
  } catch (error) {
    console.error("Error getting usage:", error);
    res.status(500).json({ error: "Failed to get usage statistics" });
  }
});

// Health check for AI service
router.get("/health", async (req, res) => {
  try {
    // Test OpenAI connection
    await openai.models.list();

    res.json({
      status: "healthy",
      service: "ai",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("AI service health check failed:", error);
    res.status(503).json({
      status: "unhealthy",
      service: "ai",
      error: error.message,
      timestamp: new Date().toISOString(),
    });
  }
});

module.exports = router;
